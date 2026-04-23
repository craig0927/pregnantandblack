import { useRoute } from "@react-navigation/native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";

import { Button, Card, Screen, Text } from "../../components/Ui";
import { supabase } from "../../lib/supabase";
import { colors, fonts, neumorph, radius, spacing } from "../../theme/theme";

type DisplaySlot = {
  raw: string;
  label: string;
};

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

export default function RescheduleAppointment({ navigation }: any) {
  const route = useRoute<any>();
  const {
    appointmentId,
    hcaId,
    hcaName,
    currentDate,
    currentTime,
  }: {
    appointmentId: string;
    hcaId: string;
    hcaName?: string;
    currentDate: string;
    currentTime: string;
  } = route.params ?? {};

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [availableDays, setAvailableDays] = useState<Set<string>>(new Set());
  const [availableSlots, setAvailableSlots] = useState<DisplaySlot[]>([]);
  const [hcaTimeZone, setHcaTimeZone] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Load HCA profile to get timezone
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("hca")
        .eq("id", hcaId)
        .single();
      if (!alive) return;
      setHcaTimeZone((data as any)?.hca?.timeZone ?? null);
    };
    load();
    return () => { alive = false; };
  }, [hcaId]);

  // Load available days for the HCA
  useEffect(() => {
    let alive = true;
    const loadDays = async () => {
      const { data, error } = await supabase
        .from("hca_availability")
        .select("date")
        .eq("hca_id", hcaId);
      if (!alive || error) return;
      const s = new Set<string>();
      for (const row of data ?? []) {
        if (row?.date) s.add(String(row.date).slice(0, 10));
      }
      setAvailableDays(s);
    };
    loadDays();
    return () => { alive = false; };
  }, [hcaId]);

  // Load available slots for the selected day
  const loadSlots = useCallback(async () => {
    if (!selectedDay) {
      setAvailableSlots([]);
      return;
    }

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

    const booked = new Set<string>();
    for (const row of bookedResult.data ?? []) {
      // Exclude the current appointment's slot so the user can re-pick the same time
      if ((row as any).id === appointmentId) continue;
      if (row?.start_time) booked.add(String(row.start_time).slice(0, 5));
    }

    const raw = (availResult.data ?? []).map((r: any) =>
      String(r.start_time).slice(0, 5),
    );
    const oneHourFromNow = Date.now() + 60 * 60 * 1000;
    const fromTZ = hcaTimeZone ?? userTimeZone;
    const filtered = raw.filter((t) => {
      if (booked.has(t)) return false;
      try {
        return zonedDateTimeToUtcDate(selectedDay, t, fromTZ).getTime() >= oneHourFromNow;
      } catch {
        return true;
      }
    });
    const slots = filtered.map((t) => ({
      raw: t,
      label: formatSlotInUserTimeZone(selectedDay, t, fromTZ, userTimeZone),
    }));
    setAvailableSlots(slots);
  }, [selectedDay, hcaId, hcaTimeZone, userTimeZone, appointmentId]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  // Real-time: refresh slots when availability or appointments change
  useEffect(() => {
    if (!hcaId || !selectedDay) return;

    const channel = supabase
      .channel(`reschedule-slots-${hcaId}-${selectedDay}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "hca_availability",
          filter: `hca_id=eq.${hcaId}`,
        },
        () => loadSlots(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `hca_id=eq.${hcaId}`,
        },
        () => loadSlots(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hcaId, selectedDay, loadSlots]);

  const reschedule = async (startTime: string) => {
    if (saving) return;
    setSaving(startTime);
    try {
      // Pre-check: verify slot is still available before updating
      const { data: conflictRows } = await supabase.rpc(
        "get_booked_appointment_slots",
        {
          p_date_from: selectedDay!,
          p_hca_id: hcaId,
        },
      );

      const conflict = (conflictRows ?? []).find(
        (row: any) =>
          String(row?.start_time).slice(0, 5) === startTime &&
          String(row?.id) !== appointmentId,
      );

      if (conflict) {
        Alert.alert(
          "Slot no longer available",
          "Someone else just booked that time. Please choose another.",
        );
        await loadSlots();
        return;
      }

      const { data: userRes } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("appointments")
        .update({
          date: selectedDay,
          start_time: `${startTime}:00`,
          updated_by: userRes.user?.id,
        })
        .eq("id", appointmentId);

      if (error) {
        if (
          error.message?.includes("duplicate key") ||
          error.message?.includes("unique constraint") ||
          error.code === "23505"
        ) {
          Alert.alert(
            "Time no longer available",
            "That time was just booked by someone else. Please choose another time.",
            [{ text: "OK", onPress: () => loadSlots() }],
          );
        } else {
          Alert.alert("Reschedule failed", error.message ?? "Please try again.");
        }
        return;
      }

      Alert.alert(
        "Session rescheduled",
        `Your session has been moved to ${formatPrettyDate(selectedDay!)} at ${
          availableSlots.find((s) => s.raw === startTime)?.label ?? startTime
        }.`,
        [{ text: "OK", onPress: () => navigation.goBack() }],
      );
    } finally {
      setSaving(null);
    }
  };

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    availableDays.forEach((d) => {
      marks[d] = { marked: true, dotColor: colors.charcoal };
    });
    if (selectedDay) {
      marks[selectedDay] = {
        ...(marks[selectedDay] ?? {}),
        selected: true,
        selectedColor: colors.charcoal,
      };
    }
    return marks;
  }, [availableDays, selectedDay]);

  return (
    <Screen>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: spacing.xl }}
        showsVerticalScrollIndicator={false}
      >
        <Card style={{ marginTop: spacing.md }}>
          <Text bold>
            Reschedule session with {hcaName ?? "your advocate"}
          </Text>
          <Text muted style={{ marginTop: spacing.sm }}>
            Current: {formatPrettyDate(currentDate)} •{" "}
            {currentTime
              ? hcaTimeZone
                ? formatSlotInUserTimeZone(
                    currentDate,
                    currentTime.slice(0, 5),
                    hcaTimeZone,
                    userTimeZone,
                  )
                : prettyTime24To12(currentTime.slice(0, 5))
              : ""}
          </Text>

          <View style={{ marginTop: spacing.md }}>
            <Button
              label={selectedDay ? "Change date" : "Choose a new date"}
              variant="outline"
              onPress={() => setCalendarOpen(true)}
            />
          </View>

          {selectedDay && (
            <View style={{ marginTop: spacing.md }}>
              <Text bold>Available times</Text>
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
                    <Pressable
                      key={slot.raw}
                      onPress={() => reschedule(slot.raw)}
                      style={[
                        styles.timePill,
                        saving === slot.raw && { opacity: 0.6 },
                      ]}
                      disabled={!!saving}
                    >
                      <Text bold style={{ color: colors.charcoal, fontFamily: fonts.bold }}>
                        {slot.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          )}
        </Card>
      </ScrollView>

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
              <Text bold>Select new date</Text>
            </View>
            <Calendar
              markedDates={markedDates}
              onDayPress={(day) => {
                setSelectedDay(day.dateString);
                setCalendarOpen(false);
              }}
              theme={{
                todayTextColor: colors.charcoal,
                arrowColor: colors.charcoal,
                backgroundColor: colors.cream,
                calendarBackground: colors.cream,
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  timePill: {
    height: 44,
    borderRadius: radius.xl,
    backgroundColor: neumorph.bg,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "4px 4px 8px rgba(0,0,0,0.15), -4px -4px 8px rgba(255,255,255,0.85)",
    elevation: 5,
  } as any,
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
    fontFamily: fonts.bold,
  },
});
