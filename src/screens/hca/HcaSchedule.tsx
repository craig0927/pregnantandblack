// src/screens/hca/HcaSchedule.tsx

import { Picker } from "@react-native-picker/picker";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Calendar } from "react-native-calendars";

import { Button, Card, Text } from "../../components/Ui";
import { supabase } from "../../lib/supabase";
import { colors, fonts, radius, spacing } from "../../theme/theme";

type SlotRow = {
  date: string; // YYYY-MM-DD
  start_time: string; // "09:00:00" or "09:00"
};

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map((n) => Number(n));
  return h * 60 + m;
}

function fromMinutes(min: number) {
  const h = String(Math.floor(min / 60)).padStart(2, "0");
  const m = String(min % 60).padStart(2, "0");
  return `${h}:${m}`;
}

function format12(hhmm: string) {
  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return hhmm;
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${String(m).padStart(2, "0")} ${ampm}`;
}

function buildSlots(startHHMM: string, endHHMM: string, step = 30) {
  const a = toMinutes(startHHMM);
  const b = toMinutes(endHHMM);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a >= b) return [];
  const out: string[] = [];
  for (let cur = a; cur + step <= b; cur += step) out.push(fromMinutes(cur));
  return out;
}

function buildTimeOptions(step = 30) {
  const out: string[] = [];
  for (let cur = 0; cur < 24 * 60; cur += step) out.push(fromMinutes(cur));
  return out;
}

function formatDateMMDDYYYY(isoDate: string) {
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return isoDate;
  return `${month}/${day}/${year}`;
}

export default function HcaSchedule() {
  const isIOS = Platform.OS === "ios";
  const [uid, setUid] = useState<string | null>(null);

  const [selectedDay, setSelectedDay] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });

  const displayDate = useMemo(() => {
    if (!selectedDay) return "";
    return formatDateMMDDYYYY(selectedDay);
  }, [selectedDay]);

  const [start, setStart] = useState("09:00"); // internal 24h
  const [end, setEnd] = useState("17:00");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [slots, setSlots] = useState<SlotRow[]>([]);
  const timeOptions = useMemo(() => buildTimeOptions(30), []);

  const { timeZone } = Intl.DateTimeFormat().resolvedOptions();
  const tzSavedRef = React.useRef(false);

  const friendlyTz = useMemo(() => {
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat(undefined, {
        timeZone,
        timeZoneName: "short",
      });

      const parts = formatter.formatToParts(now);
      const tzPart = parts.find((p) => p.type === "timeZoneName");

      return tzPart?.value ?? timeZone;
    } catch {
      return timeZone;
    }
  }, [timeZone]);

  /** Load my uid once */
  useEffect(() => {
    let alive = true;

    const loadUid = async () => {
      const { data } = await supabase.auth.getUser();
      const id = data.user?.id ?? null;
      if (!alive) return;
      setUid(id);
    };

    loadUid();
    return () => {
      alive = false;
    };
  }, []);

  /** Load slots for selected day */
  useEffect(() => {
    if (!uid || !selectedDay) return;

    let alive = true;

    const load = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("hca_availability")
        .select("date, start_time")
        .eq("hca_id", uid)
        .eq("date", selectedDay)
        .order("start_time", { ascending: true });

      if (!alive) return;

      if (error) {
        console.error("[HcaSchedule] load slots error", error);
        setSlots([]);
        setLoading(false);
        return;
      }

      setSlots((data ?? []) as any);
      setLoading(false);
    };

    load();

    return () => {
      alive = false;
    };
  }, [uid, selectedDay]);

  const saveTimeZone = async () => {
    if (!uid || tzSavedRef.current) return;

    // store tz in profiles.hca.timeZone (no weeklyAvailability)
    const { data: profile } = await supabase
      .from("profiles")
      .select("hca")
      .eq("id", uid)
      .single();

    const next = {
      ...(profile?.hca ?? {}),
      timeZone,
    };

    const { error } = await supabase
      .from("profiles")
      .update({ hca: next })
      .eq("id", uid);

    if (error) {
      console.error("[HcaSchedule] tz update error", error);
    } else {
      tzSavedRef.current = true;
    }
  };

  const addSlots = async () => {
    if (!uid) {
      Alert.alert("Not signed in");
      return;
    }
    if (saving) return;

    const s = start;
    const e = end;
    if (!s || !e) {
      Alert.alert("Invalid time", "Use HH:MM like 09:00");
      return;
    }

    const generated = buildSlots(s, e, 30);
    if (generated.length === 0) {
      Alert.alert("No slots generated", "End must be after start.");
      return;
    }

    setSaving(true);
    try {
      await saveTimeZone();

      const rows = generated.map((t) => ({
        hca_id: uid,
        date: selectedDay,
        start_time: t,
      }));

      // Requires unique index on (hca_id, date, start_time) if you want true dedupe.
      const { error } = await supabase.from("hca_availability").upsert(rows, {
        onConflict: "hca_id,date,start_time",
      });

      console.log("[HcaSchedule] selectedDay =", selectedDay);
      console.log("[HcaSchedule] generated slots =", generated);

      if (error) {
        console.error("[HcaSchedule] upsert error", error);
        Alert.alert("Save failed", error.message);
        return;
      }

      // reload
      const { data, error: reloadErr } = await supabase
        .from("hca_availability")
        .select("date, start_time")
        .eq("hca_id", uid)
        .eq("date", selectedDay)
        .order("start_time", { ascending: true });

      if (!reloadErr) setSlots((data ?? []) as any);

      Alert.alert(
        "Saved",
        `Added ${generated.length} slots for ${formatDateMMDDYYYY(selectedDay)}.`,
      );
    } finally {
      setSaving(false);
    }
  };

  const removeSlot = async (startTimeHHMM: string) => {
    if (!uid) return;

    const fullTime = `${startTimeHHMM}:00`;

    const { error } = await supabase
      .from("hca_availability")
      .delete()
      .eq("hca_id", uid)
      .eq("date", selectedDay)
      .eq("start_time", fullTime);

    if (error) {
      Alert.alert("Delete failed", error.message);
      return;
    }

    setSlots((prev) =>
      prev.filter((s) => String(s.start_time).slice(0, 5) !== startTimeHHMM),
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.cream }}
      contentContainerStyle={{
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        paddingBottom: spacing.xl,
      }}
    >
      <Card style={{ marginTop: spacing.md }}>
        <Text bold style={styles.cardHeader}>
          Set Availability
        </Text>
        <Text muted style={{ marginTop: spacing.sm }}>
          Pick a date, then add 30-minute slots.
        </Text>

        <Text muted style={{ marginTop: 4 }}>
          Your availability is shown in {friendlyTz}.
        </Text>
      </Card>

      <Card style={{ marginTop: spacing.md }}>
        <Text bold style={[styles.cardHeader, { marginBottom: spacing.sm }]}>
          Date: {displayDate}
        </Text>

        <Calendar
          markedDates={{
            [selectedDay]: { selected: true, selectedColor: colors.coral },
          }}
          onDayPress={(day) => setSelectedDay(day.dateString)}
          theme={{
            todayTextColor: colors.charcoal,
            arrowColor: colors.charcoal,
            backgroundColor: colors.cream,
            calendarBackground: colors.cream,
          }}
        />
      </Card>

      <Card style={{ marginTop: spacing.md }}>
        <Text bold style={styles.cardHeader}>
          Time range
        </Text>

        <View style={[styles.timeRow, isIOS && styles.timeRowIOS]}>
          <View style={{ flex: 1 }}>
            <Text muted>Start ({format12(start)})</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={start}
                onValueChange={(value) => setStart(String(value))}
                style={styles.picker}
                itemStyle={styles.pickerItem}
                {...(isIOS ? {} : { mode: "dropdown" as const })}
              >
                {timeOptions.map((t) => (
                  <Picker.Item
                    key={`start-${t}`}
                    label={format12(t)}
                    value={t}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <Text muted>End ({format12(end)})</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={end}
                onValueChange={(value) => setEnd(String(value))}
                style={styles.picker}
                itemStyle={styles.pickerItem}
                {...(isIOS ? {} : { mode: "dropdown" as const })}
              >
                {timeOptions.map((t) => (
                  <Picker.Item key={`end-${t}`} label={format12(t)} value={t} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        <View style={{ marginTop: spacing.md }}>
          <Button
            label={saving ? "Saving..." : "Add slots"}
            onPress={addSlots}
            variant="outline"
          />
        </View>
      </Card>

      <Card style={{ marginTop: spacing.md }}>
        <Text bold style={styles.cardHeader}>
          Slots for {formatDateMMDDYYYY(selectedDay)}
        </Text>

        {loading ? (
          <Text muted style={{ marginTop: spacing.sm }}>
            Loading…
          </Text>
        ) : slots.length === 0 ? (
          <Text muted style={{ marginTop: spacing.sm }}>
            No slots yet for this date.
          </Text>
        ) : (
          <View style={{ marginTop: spacing.sm, gap: spacing.md }}>
            {slots.map((s) => {
              const hhmm = String(s.start_time).slice(0, 5);
              const key = `${selectedDay}-${hhmm}`;

              return (
                <View key={key} style={styles.slotRow}>
                  <Text bold>{format12(hhmm)}</Text>

                  <Button
                    label="Remove"
                    onPress={() => removeSlot(hhmm)}
                    variant="outline"
                    style={{ paddingVertical: 8, paddingHorizontal: 12 }}
                    labelStyle={{ fontSize: 14 }}
                  />
                </View>
              );
            })}
          </View>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  timeRow: {
    marginTop: spacing.md,
    flexDirection: "row",
    gap: spacing.sm,
  },
  timeRowIOS: {
    flexDirection: "column",
  },
  pickerWrap: {
    marginTop: 4,
    height: Platform.OS === "ios" ? 170 : 52,
    borderRadius: radius.md,
    backgroundColor: colors.gray100,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    overflow: "hidden",
  },
  picker: {
    width: "100%",
    height: Platform.OS === "ios" ? 170 : 52,
    color: colors.charcoal,
    fontFamily: fonts.regular,
  },
  pickerItem: {
    fontSize: 17,
    color: colors.charcoal,
    fontFamily: fonts.regular,
  },
  cardHeader: {
    color: colors.coral,
    fontFamily: fonts.bold,
  },
  slotRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  deleteBtn: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: colors.charcoal,
    alignItems: "center",
    justifyContent: "center",
  },
});
