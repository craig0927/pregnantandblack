import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Image, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Text } from "../../components/Ui";
import { isSessionExpiredAfterDays, isSessionOver } from "../../lib/sessionWindow";
import { supabase } from "../../lib/supabase";
import { emitNotificationsChanged } from "../../lib/notificationEvents";
import { colors, fonts, spacing } from "../../theme/theme";
import { zonedDateTimeToUtcDate } from "../../utils/time";

type Session = {
  id: string;
  user_id: string;
  userName: string;
  userAvatarUrl?: string | null;
  conversation_id: string | null;
  date: string;
  start_time: string;
  time: string;
  status: "requested" | "confirmed";
  hcaTimeZone?: string | null;
};


const BABY_SIZE_AVATARS = [
  {
    key: "babySize/apple-pixabay.jpg",
    source: require("../../../assets/babySize/apple-pixabay.jpg"),
  },
  {
    key: "babySize/avocado-thought-catalog.jpg",
    source: require("../../../assets/babySize/avocado-thought-catalog.jpg"),
  },
  {
    key: "babySize/banana-shvets.jpg",
    source: require("../../../assets/babySize/banana-shvets.jpg"),
  },
  {
    key: "babySize/blueberry-fotios.jpg",
    source: require("../../../assets/babySize/blueberry-fotios.jpg"),
  },
  {
    key: "babySize/cabbage-ellie-burgin.jpg",
    source: require("../../../assets/babySize/cabbage-ellie-burgin.jpg"),
  },
  {
    key: "babySize/coconut-cottonbro.jpg",
    source: require("../../../assets/babySize/coconut-cottonbro.jpg"),
  },
  {
    key: "babySize/grape-gilmerdiaz.jpg",
    source: require("../../../assets/babySize/grape-gilmerdiaz.jpg"),
  },
  {
    key: "babySize/lemon-goumbik.jpg",
    source: require("../../../assets/babySize/lemon-goumbik.jpg"),
  },
  {
    key: "babySize/lime-farlight.jpg",
    source: require("../../../assets/babySize/lime-farlight.jpg"),
  },
  {
    key: "babySize/mango-rcwired.jpg",
    source: require("../../../assets/babySize/mango-rcwired.jpg"),
  },
  {
    key: "babySize/peach-laker.jpg",
    source: require("../../../assets/babySize/peach-laker.jpg"),
  },
  {
    key: "babySize/pineapple-psco.jpg",
    source: require("../../../assets/babySize/pineapple-psco.jpg"),
  },
  {
    key: "babySize/sesame-cottonbro.jpg",
    source: require("../../../assets/babySize/sesame-cottonbro.jpg"),
  },
  {
    key: "babySize/strawberry-nietjuhart.jpg",
    source: require("../../../assets/babySize/strawberry-nietjuhart.jpg"),
  },
  {
    key: "babySize/watermelon-pixabay.jpg",
    source: require("../../../assets/babySize/watermelon-pixabay.jpg"),
  },
] as const;

function getAvatarSource(avatarUrl?: string | null) {
  const avatar = avatarUrl?.trim() ?? "";
  if (!avatar) return null;
  const local = BABY_SIZE_AVATARS.find((x) => x.key === avatar);
  if (local) return local.source;
  return { uri: avatar };
}

function formatTime(t?: string | null) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${String(m).padStart(2, "0")} ${ampm}`;
}

function formatMMDDYYYY(iso?: string | null) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${m}/${d}/${y}`;
}

export default function HcaDashboard() {
  const navigation = useNavigation<any>();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hcaId, setHcaId] = useState<string | null>(null);
  const aliveRef = useRef(true);

  useEffect(() => {
    return () => {
      aliveRef.current = false;
    };
  }, []);

  /** LOAD DASHBOARD */
  const loadSessions = useCallback(async () => {
    setLoading(true);

    try {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid || !aliveRef.current) return;

      setHcaId(uid);

      const [{ data, error }, { data: profileData }] = await Promise.all([
        supabase
          .from("appointments")
          .select(
            `
            id,
            user_id,
            date,
            start_time,
            status,
            conversation_id,
            user:profiles!appointments_user_id_fkey(username, avatar_url)
          `,
          )
          .eq("hca_id", uid)
          .in("status", ["requested", "confirmed"])
          .order("date", { ascending: true }),
        supabase
          .from("profiles")
          .select("hca")
          .eq("id", uid)
          .single(),
      ]);

      if (!aliveRef.current) return;

      if (error) {
        console.error("HcaDashboard load error:", error);
        setSessions([]);
        return;
      }

      const hcaTimeZone = (profileData as any)?.hca?.timeZone ?? null;

      const mapped =
        data?.map((r: any) => {
          const p = Array.isArray(r.user) ? r.user[0] : r.user;

          return {
            id: r.id,
            user_id: r.user_id,
            userName: p?.username ?? "User",
            userAvatarUrl: p?.avatar_url ?? null,
            conversation_id: r.conversation_id,
            date: r.date,
            start_time: r.start_time,
            time: `${formatMMDDYYYY(r.date)} • ${formatTime(r.start_time)}`,
            status: r.status,
            hcaTimeZone,
          };
        }) ?? [];

      setSessions(mapped);
    } catch (e) {
      console.error("[HcaDashboard] load error", e);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  }, [loadSessions]);

  /** REAL-TIME: new/updated appointments for this HCA */
  useEffect(() => {
    if (!hcaId) return;

    const channel = supabase
      .channel(`hca-dashboard-${hcaId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `hca_id=eq.${hcaId}`,
        },
        () => loadSessions(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hcaId, loadSessions]);

  const pending = useMemo(
    () => sessions.filter((s) => s.status === "requested"),
    [sessions],
  );

  const upcoming = useMemo(
    () => sessions.filter((s) => s.status === "confirmed"),
    [sessions],
  );

  /** ACCEPT REQUEST */
  const accept = async (appointment: Session) => {
    if (!hcaId) return;

    try {
      const { data: convoId, error } = await supabase.rpc(
        "accept_appointment_and_create_conversation",
        {
          p_appointment_id: appointment.id,
        },
      );

      if (error) {
        console.error("[HCA Accept] RPC error", error);
        return;
      }

      // Try RPC first; fall back to generating a Jitsi link directly if it fails or returns no link.
      let meetLink: string | null = null;
      try {
        const { error: meetError } = await supabase.rpc("generate_meet_link", {
          p_appointment_id: appointment.id,
        });
        if (meetError) {
          console.warn("[HCA Accept] generate_meet_link RPC error, using fallback", meetError);
        } else {
          // Check if the RPC actually wrote a link.
          const { data: apptCheck } = await supabase
            .from("appointments")
            .select("meet_link")
            .eq("id", appointment.id)
            .maybeSingle();
          meetLink = apptCheck?.meet_link ?? null;
        }
      } catch (e) {
        console.warn("[HCA Accept] generate_meet_link threw, using fallback", e);
      }

      // Fallback: write a Jitsi link using the appointment ID as the room name.
      if (!meetLink) {
        const room = appointment.id.replace(/-/g, "").slice(0, 24);
        meetLink = `https://meet.jit.si/pwb-${room}`;
        await supabase
          .from("appointments")
          .update({ meet_link: meetLink })
          .eq("id", appointment.id);
      }

      // Mark the session request notification as read so the badge clears.
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("entity_id", appointment.id)
        .eq("entity_type", "appointment")
        .eq("type", "request_session")
        .eq("user_id", hcaId);

      emitNotificationsChanged();

      setSessions((prev) =>
        prev.map((s) =>
          s.id === appointment.id
            ? {
                ...s,
                status: "confirmed",
                conversation_id: convoId,
              }
            : s,
        ),
      );
    } catch (e) {
      console.error("[HcaDashboard] accept error", e);
    }
  };

  /** DECLINE */
  const decline = async (id: string) => {
    try {
      await Promise.all([
        supabase.from("appointments").update({ status: "cancelled" }).eq("id", id),
        supabase
          .from("notifications")
          .update({ read: true })
          .eq("entity_id", id)
          .eq("entity_type", "appointment")
          .eq("type", "request_session")
          .eq("user_id", hcaId),
      ]);

      emitNotificationsChanged();
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      console.error("[HcaDashboard] decline error", e);
    }
  };

  /** CANCEL CONFIRMED SESSION */
  const cancelSession = (s: Session) => {
    if (s.hcaTimeZone) {
      try {
        const sessionUtc = zonedDateTimeToUtcDate(
          s.date,
          s.start_time.slice(0, 5),
          s.hcaTimeZone,
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
      `Cancel your session with ${s.userName} on ${formatMMDDYYYY(s.date)}?`,
      [
        { text: "Keep it", style: "cancel" },
        {
          text: "Cancel session",
          style: "destructive",
          onPress: async () => {
            const { data: userRes } = await supabase.auth.getUser();
            const { error } = await supabase
              .from("appointments")
              .update({ status: "cancelled", updated_by: userRes.user?.id })
              .eq("id", s.id);

            if (error) {
              Alert.alert("Error", "Could not cancel. Please try again.");
              return;
            }

            setSessions((prev) => prev.filter((session) => session.id !== s.id));
          },
        },
      ],
    );
  };

  /** OPEN SESSION */
  const openSession = (s: Session) => {
    // TESTING: expiry gate disabled
    // if (isSessionExpiredAfterDays(s.date, s.start_time, 7)) {
    //   return;
    // }

    // Navigate to Messages tab first so MessagesHome is in the back stack,
    // then push UserChat on top of it.
    navigation.navigate("Messages");
    navigation.navigate("Messages", {
      screen: "UserChat",
      params: {
        conversationId: s.conversation_id,
        name: s.userName,
      },
    });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.cream }}
      contentContainerStyle={{ padding: spacing.md }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.introBlock}>
        <Text bold style={styles.introTopLine}>
          Welcome to Pregnant and Black. Your advocacy matters
        </Text>
        <Text muted style={styles.introSubline}>
          Stay organized and ready to support
        </Text>
        <Text muted style={styles.introCopy}>
          Review requests, manage sessions and availability, and join the
          community.
        </Text>
      </View>

      {/* =========================
        PENDING SECTION
    ========================== */}
      <Card style={styles.sectionCard}>
        <Text bold style={styles.sectionTitle}>
          Pending Requests
        </Text>
        <View style={styles.sectionDivider} />
        {loading ? (
          <Text muted style={{ marginTop: spacing.md }}>
            Loading…
          </Text>
        ) : pending.length === 0 ? (
          <Text muted style={{ marginTop: spacing.md }}>
            No pending requests.
          </Text>
        ) : (
          pending.map((s) => (
            <View key={s.id} style={styles.sessionCard}>
              <View style={styles.sessionTopRow}>
                <View style={styles.avatarWrap}>
                  {getAvatarSource(s.userAvatarUrl) ? (
                    <Image
                      source={getAvatarSource(s.userAvatarUrl)!}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Ionicons name="person" size={16} color={colors.warmGray} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text bold style={styles.userName}>
                    {s.userName}
                  </Text>
                  <Text muted style={{ marginTop: 4 }}>
                    {s.time}
                  </Text>
                </View>
              </View>

              <View style={styles.actionRow}>
                <Button
                  label="Accept"
                  onPress={() => accept(s)}
                  variant="outline"
                  style={{ flex: 1 }}
                />
                <Button
                  label="Decline"
                  onPress={() => decline(s.id)}
                  variant="outline"
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          ))
        )}
      </Card>

      {/* =========================
        UPCOMING SECTION
    ========================== */}
      <Card style={[styles.sectionCard, { marginTop: spacing.lg }]}>
        <Text bold style={styles.sectionTitle}>
          Upcoming/Past
        </Text>
        <View style={styles.sectionDivider} />
        {upcoming.length === 0 ? (
          <Text muted style={{ marginTop: spacing.md }}>
            No upcoming sessions.
          </Text>
        ) : (
          upcoming.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => openSession(s)}
              disabled={false /* TESTING: isSessionExpiredAfterDays(s.date, s.start_time, 7) */}
              style={({ pressed }) => [
                styles.sessionCard,
                // TESTING: isSessionExpiredAfterDays(s.date, s.start_time, 7) && { opacity: 0.55 },
                pressed && { opacity: 0.9 },
              ]}
            >
              <View style={styles.sessionTopRow}>
                <View style={styles.avatarWrap}>
                  {getAvatarSource(s.userAvatarUrl) ? (
                    <Image
                      source={getAvatarSource(s.userAvatarUrl)!}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Ionicons name="person" size={16} color={colors.warmGray} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text bold style={styles.userName}>
                    {s.userName}
                  </Text>
                  <Text muted style={{ marginTop: 4 }}>
                    {s.time}
                  </Text>
                </View>
              </View>
              <View style={styles.actionRow}>
                <Button
                  label="Reschedule"
                  variant="outline"
                  style={{ flex: 1 }}
                  onPress={() =>
                    navigation.navigate("HcaReschedule", {
                      appointmentId: s.id,
                      hcaId: hcaId!,
                      hcaName: s.userName,
                      currentDate: s.date,
                      currentTime: s.start_time,
                    })
                  }
                />
                <Button
                  label="Cancel"
                  variant="outline"
                  style={{ flex: 1 }}
                  onPress={() => cancelSession(s)}
                />
              </View>
            </Pressable>
          ))
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: 16,
  },
  introBlock: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  introTopLine: {
    color: colors.charcoal,
    fontSize: 18,
    lineHeight: 26,
    textAlign: "center",
    fontFamily: fonts.bold,
  },
  introSubline: {
    textAlign: "center",
    lineHeight: 22,
  },
  introCopy: {
    textAlign: "center",
    lineHeight: 22,
  },

  sectionTitle: {
    fontSize: 16,
    marginBottom: spacing.md,
    color: colors.coral,
    fontFamily: fonts.bold,
  },

  sectionDivider: {
    height: 1,
    backgroundColor: colors.inputBorder,
    marginBottom: spacing.md,
  },

  sessionCard: {
    paddingVertical: spacing.md,
  },
  sessionTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: colors.inputBorder,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
  },

  userName: {
    fontSize: 15,
    color: colors.charcoal,
    fontFamily: fonts.semiBold,
  },

  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  acceptBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.charcoal,
    alignItems: "center",
    justifyContent: "center",
  },

  acceptText: {
    color: colors.white,
    fontWeight: "600",
  },

  declineBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.gray300,
    alignItems: "center",
    justifyContent: "center",
  },

  declineText: {
    color: colors.warmGray,
    fontWeight: "600",
  },
});
