import { useFocusEffect, useRoute } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";

import { Button, Card, H1, Text } from "../../components/Ui";
import { setLatestSessionError } from "../../lib/sessionErrorStore";
import { supabase } from "../../lib/supabase";
import { colors, fonts, radius, spacing } from "../../theme/theme";

type HcaProfile = {
  id: string;
  username: string | null;
  hca: any | null;
};

type DisplaySlot = {
  raw: string;
  label: string;
};

const hiddenUnavailableSlots: Record<string, Set<string>> = {};

function prettyTime24To12(t: string) {
  const [hhStr, mm] = t.split(":");
  const hh = Number(hhStr);
  const ampm = hh >= 12 ? "PM" : "AM";
  const hour12 = ((hh + 11) % 12) + 1;
  return `${hour12}:${mm} ${ampm}`;
}

function formatPrettyDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function parsePartsInTZ(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
  };
}

function zonedDateTimeToUtcDate(dateISO: string, timeHHMM: string, timeZone: string) {
  const [y, m, d] = dateISO.split("-").map(Number);
  const [hh, mm] = timeHHMM.split(":").map(Number);

  let utcMs = Date.UTC(y, m - 1, d, hh, mm, 0, 0);

  // Iteratively correct utcMs until local wall-clock in `timeZone` matches target.
  for (let i = 0; i < 3; i += 1) {
    const p = parsePartsInTZ(new Date(utcMs), timeZone);
    const target = Date.UTC(y, m - 1, d, hh, mm, 0, 0);
    const actual = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, 0, 0);
    const diff = target - actual;
    if (diff === 0) break;
    utcMs += diff;
  }

  return new Date(utcMs);
}

function formatSlotInUserTimeZone(
  dateISO: string,
  timeHHMM: string,
  fromTimeZone: string,
  toTimeZone: string,
) {
  try {
    const utcDate = zonedDateTimeToUtcDate(dateISO, timeHHMM, fromTimeZone);
    return new Intl.DateTimeFormat(undefined, {
      timeZone: toTimeZone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(utcDate);
  } catch {
    return prettyTime24To12(timeHHMM);
  }
}

export default function HCADetail({ navigation }: any) {
  const route = useRoute<any>();

  const hcaId: string | undefined = route?.params?.id;
  const initialSelectedDay: string | null = route?.params?.selectedDay ?? null;

  const [selectedDay, setSelectedDay] = useState<string | null>(
    initialSelectedDay,
  );

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<HcaProfile | null>(null);

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [, setBookedTimes] = useState<Set<string>>(new Set());
  const [availableDays, setAvailableDays] = useState<Set<string>>(new Set());
  const [availableSlots, setAvailableSlots] = useState<DisplaySlot[]>([]);
  const [booking, setBooking] = useState<string | null>(null);
  const loadSlotsRequestRef = useRef(0);
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const hideSlotForDay = useCallback((date: string, startTime: string) => {
    if (!hcaId) return;
    const key = `${hcaId}:${date}`;
    const hiddenForDay = hiddenUnavailableSlots[key] ?? new Set<string>();
    hiddenForDay.add(startTime);
    hiddenUnavailableSlots[key] = hiddenForDay;
    setBookedTimes((prev) => new Set(prev).add(startTime));
    setAvailableSlots((prev) => prev.filter((s) => s.raw !== startTime));
  }, [hcaId]);

  // -----------------------------
  // Load profile
  // -----------------------------
  useEffect(() => {
    let alive = true;

    const load = async () => {
      if (!hcaId) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, hca")
        .eq("id", hcaId)
        .single();

      if (!alive) return;

      if (error) {
        console.error("HCADetail profile load error", error);
        setProfile(null);
        setLoading(false);
        return;
      }

      setProfile(data as HcaProfile);
      setLoading(false);
    };

    load();
    return () => {
      alive = false;
    };
  }, [hcaId]);

  const hcaName = useMemo(() => {
    return profile?.username || "Health Care Advocate";
  }, [profile]);

  useEffect(() => {
    let alive = true;

    const loadAvailableDays = async () => {
      if (!hcaId) return;

      const { data, error } = await supabase
        .from("hca_availability")
        .select("date")
        .eq("hca_id", hcaId);

      if (!alive || error) return;

      const s = new Set<string>();
      for (const row of data ?? []) {
        if (row?.date) {
          s.add(String(row.date).slice(0, 10));
        }
      }

      setAvailableDays(s);
    };

    loadAvailableDays();

    return () => {
      alive = false;
    };
  }, [hcaId]);

  // Fetches booked times and available slots in a single parallel operation,
  // eliminating the race condition where loadTimes ran with stale bookedTimes.
  const loadSlots = useCallback(async () => {
    if (!selectedDay || !hcaId) {
      setBookedTimes(new Set());
      setAvailableSlots([]);
      return;
    }

    const requestId = ++loadSlotsRequestRef.current;

    const [availResult, bookedResult] = await Promise.all([
      supabase
        .from("hca_availability")
        .select("start_time")
        .eq("hca_id", hcaId)
        .eq("date", selectedDay)
        .order("start_time", { ascending: true }),
      supabase.rpc("get_booked_appointment_slots", {
        p_date_from: selectedDay,
        p_hca_id: hcaId,
      }),
    ]);

    if (bookedResult.error) {
      console.error("[HCADetail] loadSlots booked error", bookedResult.error);
    }
    if (availResult.error) {
      console.error("[HCADetail] loadSlots avail error", availResult.error);
    }

    if (requestId !== loadSlotsRequestRef.current) return;

    const booked = new Set<string>();
    for (const row of bookedResult.data ?? []) {
      if (row?.start_time) booked.add(String(row.start_time).slice(0, 5));
    }
    setBookedTimes(booked);

    const raw = (availResult.data ?? []).map((r: any) =>
      String(r.start_time).slice(0, 5),
    );
    const hiddenKey = `${hcaId}:${selectedDay}`;
    const hiddenForDay = hiddenUnavailableSlots[hiddenKey] ?? new Set<string>();
    const oneHourFromNow = Date.now() + 60 * 60 * 1000;
    const hcaTimeZone = profile?.hca?.timeZone ?? userTimeZone;
    const filtered = raw.filter((t) => {
      if (booked.has(t)) return false;
      if (hiddenForDay.has(t)) return false;
      try {
        return zonedDateTimeToUtcDate(selectedDay, t, hcaTimeZone).getTime() >= oneHourFromNow;
      } catch {
        return true;
      }
    });
    const slots = filtered.map((t) => ({
      raw: t,
      label: formatSlotInUserTimeZone(selectedDay, t, hcaTimeZone, userTimeZone),
    }));
    setAvailableSlots(slots);
  }, [hcaId, selectedDay, profile?.hca?.timeZone, userTimeZone]);

  // -----------------------------
  // Load slots on day / profile change
  // -----------------------------
  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  // Refresh slots when screen gains focus (fixes stale data)
  useFocusEffect(
    useCallback(() => {
      loadSlots();
    }, [loadSlots]),
  );

  // -----------------------------
  // Live updates for slot locking/unlocking and new slots added by HCA
  // -----------------------------
  useEffect(() => {
    if (!hcaId || !selectedDay) return;

    const channel = supabase
      .channel(`hca-detail-slots-${hcaId}-${selectedDay}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `hca_id=eq.${hcaId}`,
        },
        (payload: any) => {
          const newDate = payload?.new?.date
            ? String(payload.new.date).slice(0, 10)
            : null;
          const oldDate = payload?.old?.date
            ? String(payload.old.date).slice(0, 10)
            : null;

          if (newDate === selectedDay || oldDate === selectedDay) {
            loadSlots();
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "hca_availability",
          filter: `hca_id=eq.${hcaId}`,
        },
        (payload: any) => {
          const newDate = payload?.new?.date
            ? String(payload.new.date).slice(0, 10)
            : null;
          const oldDate = payload?.old?.date
            ? String(payload.old.date).slice(0, 10)
            : null;

          if (newDate === selectedDay || oldDate === selectedDay) {
            loadSlots();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hcaId, selectedDay, loadSlots]);

  // -----------------------------
  // Booking
  // -----------------------------
  const book = async (startTime: string) => {
    if (!hcaId || !selectedDay || booking) return;

      setBooking(startTime);

    try {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;

      if (!uid) {
        await setLatestSessionError("Session request failed: user is not signed in.");
        Alert.alert("Not signed in", "Please sign in and try again.");
        return;
      }

      // Guard against stale UI/race conditions.
      const { data: existing } = await supabase
        .rpc("get_booked_appointment_slots", {
          p_date_from: selectedDay,
          p_hca_id: hcaId,
        });

      const matchingExisting = (existing ?? []).find(
        (row: any) => String(row?.start_time).slice(0, 5) === startTime,
      );

      if (matchingExisting?.id) {
        await setLatestSessionError(
          "Session request failed: selected time became unavailable.",
        );
        hideSlotForDay(selectedDay, startTime);
        await loadSlots();
        return;
      }

      const { data: appt, error } = await supabase
        .from("appointments")
        .insert({
          user_id: uid,
          hca_id: hcaId,
          date: selectedDay,
          start_time: `${startTime}:00`,
          status: "requested",
        })
        .select("id, conversation_id")
        .single();

      if (error) {
        // Handle race-condition duplicate booking gracefully
        if (
          error.message?.includes("duplicate key") ||
          error.message?.includes("unique constraint") ||
          error.code === "23505"
        ) {
          await setLatestSessionError(
            "Session request failed: selected time became unavailable.",
          );
          hideSlotForDay(selectedDay, startTime);
          await loadSlots();
        } else {
          await setLatestSessionError(
            `Session request failed: ${error.message ?? "Unknown error"}`,
          );
          Alert.alert("Booking failed", error.message ?? "Try again.");
        }
        return;
      }

      // Hide the slot immediately in this session.
      hideSlotForDay(selectedDay, startTime);

      navigation.navigate("SessionRequested", {
        advocateName: hcaName,
        advocateId: hcaId,
        date: selectedDay,
        time: startTime,
        appointmentId: appt?.id,
        conversationId: appt?.conversation_id,
      });
    } finally {
      setBooking(null);
    }
  };

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    availableDays.forEach((d) => {
      marks[d] = {
        marked: true,
        dotColor: colors.coral,
      };
    });

    if (selectedDay) {
      marks[selectedDay] = {
        ...(marks[selectedDay] ?? {}),
        selected: true,
        selectedColor: colors.coral,
      };
    }

    return marks;
  }, [availableDays, selectedDay]);

  // -----------------------------
  // Loading
  // -----------------------------
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream, padding: spacing.md }}>
        <Card style={styles.availabilityCard}>
          <Text muted>Loading advocate…</Text>
        </Card>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream, padding: spacing.md }}>
        <Card style={{ marginTop: spacing.md }}>
          <Text bold>No health care advocates available</Text>
        </Card>
      </View>
    );
  }

  // -----------------------------
  // Main Render
  // -----------------------------
  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: spacing.md,
          paddingBottom: spacing.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <H1>{hcaName}</H1>
          {!!profile?.hca?.languages?.length && (
            <Text muted style={{ marginTop: 4 }}>
              Languages: {(profile.hca.languages as string[]).join(", ")}
            </Text>
          )}
          {!!profile?.hca?.modalitiesOffered?.length && (
            <Text muted style={{ marginTop: 2 }}>
              Modalities: {(profile.hca.modalitiesOffered as string[]).join(", ")}
            </Text>
          )}
        </View>

        <Card style={styles.availabilityCard}>
          <Text bold style={styles.sectionHeader}>
            Availability
          </Text>

          <Text muted style={{ marginTop: spacing.sm }}>
            {selectedDay
              ? `Available times for ${formatPrettyDate(selectedDay)}`
              : "Select a date to see available times."}
          </Text>

          <View style={{ marginTop: spacing.md }}>
            <Button
              label={selectedDay ? "Change date" : "Choose a date"}
              variant="outline"
              onPress={() => setCalendarOpen(true)}
            />
          </View>

          {selectedDay && (
            <View style={{ marginTop: spacing.md }}>
              <Text bold style={styles.sectionHeader}>
                Times
              </Text>
              <Text muted style={{ marginTop: spacing.xs }}>
                Times shown in your local timezone ({userTimeZone}).
              </Text>

              {availableSlots.length === 0 ? (
                <Text muted style={{ marginTop: spacing.sm }}>
                  No available times for this date.
                </Text>
              ) : (
                <View style={{ marginTop: spacing.sm, gap: spacing.sm }}>
                  {availableSlots.map((slot) => (
                    <Button
                      key={slot.raw}
                      onPress={() => book(slot.raw)}
                      label={slot.label}
                      variant="outline"
                      style={styles.timePill}
                      labelStyle={styles.timePillLabel}
                      disabled={!!booking}
                    />
                  ))}
                </View>
              )}
            </View>
          )}
        </Card>
      </ScrollView>

      {/* Modal */}
      <Modal
        transparent
        visible={calendarOpen}
        animationType="fade"
        onRequestClose={() => setCalendarOpen(false)}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => setCalendarOpen(false)}
        >
          <Pressable style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text bold>Select date</Text>
            </View>

            <Calendar
              markedDates={markedDates}
              onDayPress={(day) => {
                setSelectedDay(day.dateString);
                setCalendarOpen(false);
              }}
              theme={{
                todayTextColor: colors.charcoal,
                arrowColor: colors.coral,
                backgroundColor: colors.cream,
                calendarBackground: colors.cream,
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  availabilityCard: {
    marginTop: spacing.md,
    marginHorizontal: spacing.xs,
  },
  sectionHeader: {
    color: colors.coral,
    fontFamily: fonts.bold,
  },
  timePill: {
    minHeight: 48,
    paddingVertical: 0,
    borderRadius: 999,
    justifyContent: "center",
  },
  timePillLabel: {
    color: colors.charcoal,
    fontFamily: fonts.medium,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.cream,
    padding: spacing.lg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  sheetHeader: {
    marginBottom: spacing.md,
  },
});
