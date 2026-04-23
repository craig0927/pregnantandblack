import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Card, Text } from "../../components/Ui";
import { setLatestSessionError } from "../../lib/sessionErrorStore";
import { isSessionExpiredAfterDays, isSessionOver } from "../../lib/sessionWindow";
import { supabase } from "../../lib/supabase";
import { colors, fonts, neumorph, radius, spacing } from "../../theme/theme";
import { formatTimeInUserTimeZone, zonedDateTimeToUtcDate } from "../../utils/time";

type Appointment = {
  id: string;
  user_id: string;
  hca_id: string;
  date: string;
  start_time: string;
  conversation_id: string | null;
  status: string;
  hca_username: string | null;
  hca_timezone: string | null;
};

/* ---------------------- */
/* Formatting Helpers     */
/* ---------------------- */

function formatDateMMDDYYYY(date: string) {
  const d = new Date(`${date}T00:00:00`);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

function formatTime12h(time: string) {
  const [hStr, mStr] = time.split(":");
  const h = Number(hStr);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = ((h + 11) % 12) + 1;
  return `${hour12}:${mStr} ${ampm}`;
}

export default function Appointments() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const aliveRef = useRef(true);

  useEffect(() => {
    return () => { aliveRef.current = false; };
  }, []);

  // 30s tick keeps session-window status indicators (Started / Ended) current
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  /* ---------------------- */
  /* LOAD APPOINTMENTS      */
  /* ---------------------- */

  const load = useCallback(async () => {
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const currentUid = userRes.user?.id;
      if (!currentUid || !aliveRef.current) return;

      setUid(currentUid);

      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          id,
          user_id,
          hca_id,
          date,
          start_time,
          conversation_id,
          status,
          hca:profiles!appointments_hca_id_fkey(username, hca)
        `,
        )
        .eq("user_id", currentUid)
        .eq("status", "confirmed")
        .order("date", { ascending: true })
        .order("start_time", { ascending: true });

      if (!aliveRef.current) return;

      if (error) {
        console.error("[Appointments] load error", error);
        setAppointments([]);
      } else {
        const cleaned: Appointment[] = (data ?? []).map((row: any) => {
          const joinedProfile = Array.isArray(row.hca) ? row.hca[0] : row.hca;
          return {
            id: row.id,
            user_id: row.user_id,
            hca_id: row.hca_id,
            date: row.date,
            start_time: row.start_time,
            conversation_id: row.conversation_id,
            status: row.status,
            hca_username: joinedProfile?.username ?? null,
            hca_timezone: joinedProfile?.hca?.timeZone ?? null,
          };
        });

        const missingHcaIds = Array.from(
          new Set(
            cleaned
              .filter((a) => !a.hca_username && a.hca_id)
              .map((a) => a.hca_id),
          ),
        );

        if (missingHcaIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, username")
            .in("id", missingHcaIds);

          const byId = new Map<string, string | null>(
            (profiles ?? []).map((p: any) => [p.id, p.username ?? null]),
          );

          cleaned.forEach((a) => {
            if (!a.hca_username) {
              a.hca_username = byId.get(a.hca_id) ?? null;
            }
          });
        }

        // TESTING: show all appointments regardless of expiry
        // const visible = cleaned.filter(
        //   (a) => !isSessionExpiredAfterDays(a.date, a.start_time, 7, a.hca_timezone),
        // );
        setAppointments(cleaned);
      }
    } catch (e) {
      console.error("[Appointments] load error", e);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  /* ---------------------- */
  /* REAL-TIME UPDATES      */
  /* ---------------------- */

  useEffect(() => {
    if (!uid) return;

    const channel = supabase
      .channel(`user-appointments-${uid}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `user_id=eq.${uid}`,
        },
        () => load(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [uid, load]);

  /* ---------------------- */
  /* SELF-HEALING CONVO     */
  /* ---------------------- */

  const ensureConversation = async (a: Appointment): Promise<string | null> => {
    if (a.conversation_id) return a.conversation_id;

    if (!a.user_id || !a.hca_id) return null;

    try {
      // Create conversation
      const { data: convo, error: convoErr } = await supabase
        .from("conversations")
        .insert({
          user_id: a.user_id,
          hca_id: a.hca_id,
        })
        .select()
        .single();

      if (convoErr || !convo) return null;

      // Update appointment
      const { error: updateErr } = await supabase
        .from("appointments")
        .update({ conversation_id: convo.id })
        .eq("id", a.id);

      if (updateErr) return null;

      // Update local state
      setAppointments((prev) =>
        prev.map((x) =>
          x.id === a.id ? { ...x, conversation_id: convo.id } : x,
        ),
      );

      return convo.id;
    } catch (e) {
      console.error("[Appointments] ensureConversation error", e);
      return null;
    }
  };

  /* ---------------------- */
  /* OPEN SESSION           */
  /* ---------------------- */

  const openSession = async (a: Appointment) => {
    // TESTING: expiry gate disabled
    // if (isSessionExpiredAfterDays(a.date, a.start_time, 7)) {
    //   Alert.alert("Chat unavailable", "This session chat is no longer available after 7 days.");
    //   return;
    // }

    let convoId = a.conversation_id;

    if (!convoId) {
      convoId = await ensureConversation(a);
    }

    if (!convoId) {
      await setLatestSessionError(
        "Session open failed: unable to start conversation for this appointment.",
      );
      Alert.alert(
        "Unable to open session",
        "We couldn't open this session right now. Please try again.",
      );
      return;
    }

    navigation.getParent()?.navigate("Messages", {
      screen: "UserChat",
      params: {
        conversationId: convoId,
        name: a.hca_username ?? "Health Care Advocate",
      },
    });
  };

  const cancelAppointment = (a: Appointment) => {
    // Block cancellation within 1 hour of session start.
    if (a.hca_timezone) {
      try {
        const sessionUtc = zonedDateTimeToUtcDate(
          a.date,
          a.start_time.slice(0, 5),
          a.hca_timezone,
        );
        if (sessionUtc.getTime() <= Date.now() + 60 * 60 * 1000) {
          Alert.alert(
            "Too close to session time",
            "Sessions cannot be cancelled within 1 hour of the start time.",
          );
          return;
        }
      } catch {
        // If timezone conversion fails, allow cancellation to proceed.
      }
    }

    Alert.alert(
      "Cancel session",
      `Cancel your session with ${a.hca_username ?? "your advocate"} on ${formatDateMMDDYYYY(a.date)}?`,
      [
        { text: "Keep it", style: "cancel" },
        {
          text: "Cancel session",
          style: "destructive",
          onPress: async () => {
            const { data: userRes } = await supabase.auth.getUser();
            const userId = userRes.user?.id;

            const { error } = await supabase
              .from("appointments")
              .update({ status: "cancelled", updated_by: userId })
              .eq("id", a.id);

            if (error) {
              Alert.alert("Error", "Could not cancel. Please try again.");
              return;
            }

            load();

            // Check cancellation count and flag frequent cancellers.
            if (userId) {
              const { count } = await supabase
                .from("appointments")
                .select("*", { count: "exact", head: true })
                .eq("user_id", userId)
                .eq("status", "cancelled");

              if ((count ?? 0) >= 3) {
                supabase.functions
                  .invoke("flag-frequent-canceller", {
                    body: { userId, cancelCount: count },
                  })
                  .catch((e: any) => console.error("[Appointments] flag-frequent-canceller error", e));
              }
            }
          },
        },
      ],
    );
  };

  const goToHca = () => {
    navigation.navigate("HCAList");
  };

  /* ---------------------- */
  /* RENDER                 */
  /* ---------------------- */

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.cream }}
      contentContainerStyle={{ padding: spacing.md, paddingTop: spacing.sm }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={{ gap: spacing.md }}>
        <View style={styles.introBlock}>
          <Text bold style={styles.introHeading}>
            Plan your care with confidence
          </Text>
          <Text muted style={styles.introCopy}>
            See what&apos;s coming up, reschedule or cancel if needed, and
            schedule new support when you&apos;re ready.
          </Text>
          <Text muted style={styles.introNote}>
            Note: Messages sent outside scheduled session blocks are not
            monitored in real time. Your advocate will respond when available.
            If you need a timely response, schedule a new appointment.
          </Text>
        </View>

        <Button
          label="Schedule an appointment"
          onPress={goToHca}
          variant="outline"
          labelStyle={{ color: colors.coral }}
        />

        {loading ? (
          <Card style={{ marginTop: spacing.md }}>
            <Text muted>Loading…</Text>
          </Card>
        ) : appointments.length === 0 ? (
          <Card style={{ marginTop: spacing.md }}>
            <Text bold>No upcoming appointments</Text>
            <Text muted style={{ marginTop: spacing.sm }}>
              When confirmed, your sessions will show here.
            </Text>
          </Card>
        ) : (
          <View style={{ gap: spacing.md, marginTop: spacing.md }}>
            {appointments.map((a) => {
              // TESTING: no expiry/over gates
              const expired = false; // isSessionExpiredAfterDays(a.date, a.start_time, 7, a.hca_timezone);
              const over = false; // isSessionOver(a.date, a.start_time, a.hca_timezone);
              const canModify = !expired && !over;
              return (
                <Pressable
                  key={a.id}
                  onPress={() => openSession(a)}
                  disabled={expired}
                >
                  <Card style={expired ? { opacity: 0.55 } : undefined}>
                    <Text bold>Session with {a.hca_username ?? "Your Advocate"}</Text>

                    <Text muted style={{ marginTop: spacing.sm }}>
                      {formatDateMMDDYYYY(a.date)} •{" "}
                      {a.hca_timezone
                        ? formatTimeInUserTimeZone(
                            a.date,
                            a.start_time,
                            a.hca_timezone,
                            Intl.DateTimeFormat().resolvedOptions().timeZone,
                          )
                        : formatTime12h(a.start_time)}
                    </Text>

                    {expired ? (
                      <Text muted style={{ marginTop: 4 }}>
                        Chat no longer available
                      </Text>
                    ) : over ? (
                      <Text muted style={{ marginTop: 4 }}>
                        Session ended
                      </Text>
                    ) : null}

                    {canModify && (
                      <View style={apptStyles.actionRow}>
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            navigation.navigate("RescheduleAppointment", {
                              appointmentId: a.id,
                              hcaId: a.hca_id,
                              hcaName: a.hca_username ?? undefined,
                              currentDate: a.date,
                              currentTime: a.start_time,
                            });
                          }}
                          style={apptStyles.actionBtn}
                          hitSlop={8}
                        >
                          <Text style={apptStyles.actionBtnText}>Reschedule</Text>
                        </Pressable>
                        <Pressable
                          onPress={(e) => {
                            e.stopPropagation();
                            cancelAppointment(a);
                          }}
                          style={[apptStyles.actionBtn, apptStyles.cancelBtn]}
                          hitSlop={8}
                        >
                          <Text style={apptStyles.cancelBtnText}>Cancel</Text>
                        </Pressable>
                      </View>
                    )}
                  </Card>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  introBlock: {
    gap: spacing.sm,
  },
  introHeading: {
    color: colors.charcoal,
    fontSize: 20,
    lineHeight: 28,
    textAlign: "center",
    fontFamily: fonts.bold,
  },
  introCopy: {
    lineHeight: 22,
    textAlign: "center",
    fontFamily: fonts.regular,
  },
  introNote: {
    lineHeight: 20,
    textAlign: "center",
    fontFamily: fonts.regular,
  },
});

const apptStyles = StyleSheet.create({
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionBtn: {
    flex: 1,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: neumorph.bg,
    boxShadow:
      "4px 4px 8px rgba(0,0,0,0.15), -5px -5px 10px rgba(255,255,255,0.95)",
    elevation: 5,
  },
  actionBtnText: {
    color: colors.charcoal,
    fontSize: 13,
    fontWeight: "600",
    fontFamily: fonts.semiBold,
  },
  cancelBtn: {
    backgroundColor: colors.cream,
    boxShadow:
      "4px 4px 8px rgba(0,0,0,0.15), -5px -5px 10px rgba(255,255,255,0.95)",
    elevation: 5,
  },
  cancelBtnText: {
    color: colors.charcoal,
    fontSize: 13,
    fontWeight: "600",
    fontFamily: fonts.semiBold,
  },
});
