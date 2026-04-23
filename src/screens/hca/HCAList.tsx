// src/screens/hca/HCAList.tsx

import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";

import { Card, NeuInput, Text } from "../../components/Ui";
import { supabase } from "../../lib/supabase";
import { colors, fonts, radius, spacing, typography } from "../../theme/theme";

type HCA = {
  id: string;
  name: string;
};

function monthRange(yyyy: number, mm1: number) {
  // mm1 is 1-12
  const start = new Date(Date.UTC(yyyy, mm1 - 1, 1));
  const end = new Date(Date.UTC(yyyy, mm1, 0)); // last day of month
  const isoStart = start.toISOString().slice(0, 10);
  const isoEnd = end.toISOString().slice(0, 10);
  return { isoStart, isoEnd };
}

function formatMMDDYYYY(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${m}-${d}-${y}`;
}

export default function HCAList({ navigation }: any) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
  });

  const [loading, setLoading] = useState(false);
  const [hcas, setHcas] = useState<HCA[]>([]);

  const [dotsLoading, setDotsLoading] = useState(false);
  const [availableDays, setAvailableDays] = useState<Set<string>>(new Set());

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    availableDays.forEach((d) => {
      marks[d] = { marked: true, dotColor: colors.coral };
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

  /** load dots for month shown (only days with at least one truly open slot) */
  const loadDotsForMonth = useCallback(async (year: number, month: number) => {
    setDotsLoading(true);
    try {
      const { isoStart, isoEnd } = monthRange(year, month);

      const { data: availability, error: availabilityError } = await supabase
        .from("hca_availability")
        .select("date, hca_id, start_time")
        .gte("date", isoStart)
        .lte("date", isoEnd);

      if (availabilityError) {
        console.error("[HCAList] dots error", availabilityError);
        setAvailableDays(new Set());
        return;
      }

      const { data: appointments, error: apptError } = await supabase
        .rpc("get_booked_appointment_slots", {
          p_date_from: isoStart,
          p_date_to: isoEnd,
        });

      if (apptError) {
        console.error("[HCAList] dots appointments error", apptError);
        setAvailableDays(new Set());
        return;
      }

      const booked = new Set<string>();
      for (const r of appointments ?? []) {
        const d = r?.date ? String(r.date).slice(0, 10) : null;
        const h = r?.hca_id ? String(r.hca_id) : null;
        const t = r?.start_time ? String(r.start_time).slice(0, 5) : null;
        if (d && h && t) booked.add(`${d}|${h}|${t}`);
      }

      const s = new Set<string>();
      for (const r of availability ?? []) {
        const d = r?.date ? String(r.date).slice(0, 10) : null;
        const h = r?.hca_id ? String(r.hca_id) : null;
        const t = r?.start_time ? String(r.start_time).slice(0, 5) : null;
        if (!d || !h || !t) continue;
        if (!booked.has(`${d}|${h}|${t}`)) s.add(d);
      }
      setAvailableDays(s);
    } catch (e) {
      console.error("[HCAList] loadDotsForMonth error", e);
      setAvailableDays(new Set());
    } finally {
      setDotsLoading(false);
    }
  }, []);

  const loadHcasForDay = useCallback(async () => {
    if (!selectedDay) {
      setHcas([]);
      return;
    }

    setLoading(true);

    try {
      const { data: availability, error } = await supabase
        .from("hca_availability")
        .select(
          `
        hca_id,
        start_time,
        profiles ( username )
      `,
        )
        .eq("date", selectedDay);

      if (error) {
        console.error("[HCAList] availability error", error);
        setHcas([]);
        return;
      }

      const { data: appointments, error: apptError } = await supabase
        .rpc("get_booked_appointment_slots", {
          p_date_from: selectedDay,
        });

      if (apptError) {
        console.error("[HCAList] appointments error", apptError);
        setHcas([]);
        return;
      }

      const booked = new Set<string>();
      for (const r of appointments ?? []) {
        const h = r?.hca_id ? String(r.hca_id) : null;
        const t = r?.start_time ? String(r.start_time).slice(0, 5) : null;
        if (h && t) booked.add(`${h}|${t}`);
      }

      // dedupe by hca_id while only counting rows that still have open times
      const byId = new Map<string, HCA>();
      for (const r of availability ?? []) {
        const id = r?.hca_id ? String(r.hca_id) : null;
        const t = r?.start_time ? String(r.start_time).slice(0, 5) : null;
        if (!id || !t) continue;
        if (booked.has(`${id}|${t}`)) continue;

        if (!byId.has(id)) {
          const p = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
          const name = p?.username ? String(p.username) : null;
          if (!name) continue;
          byId.set(id, { id, name });
        }
      }

      setHcas(Array.from(byId.values()));
    } catch (e) {
      console.error("[HCAList] loadHcasForDay error", e);
      setHcas([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDay]);

  /** load list for selected day */
  useEffect(() => {
    loadHcasForDay();
  }, [loadHcasForDay]);

  useEffect(() => {
    loadDotsForMonth(visibleMonth.year, visibleMonth.month);
  }, [loadDotsForMonth, visibleMonth.month, visibleMonth.year]);

  // Realtime: keep dots and day list synced as requests are created/accepted/declined.
  useEffect(() => {
    const channel = supabase
      .channel("hca-list-live-availability")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        () => {
          loadDotsForMonth(visibleMonth.year, visibleMonth.month);
          loadHcasForDay();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "hca_availability" },
        () => {
          loadDotsForMonth(visibleMonth.year, visibleMonth.month);
          loadHcasForDay();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadDotsForMonth, loadHcasForDay, visibleMonth.month, visibleMonth.year]);

  return (
    <View style={styles.screen}>
      {/* Disclaimer (restored) */}
      <Card style={styles.disclaimer}>
        <Ionicons
          name="information-circle-outline"
          size={18}
          color={colors.warmGray}
          style={{ marginTop: 1 }}
        />
        <Text style={styles.disclaimerText}>
          This app is for informational purposes only and is not a substitute
          for professional medical advice, diagnosis, or treatment. If you are
          experiencing a medical emergency, call 911 or go to your nearest
          emergency department immediately.
        </Text>
      </Card>

      {/* Search */}
      <Card style={styles.searchWrap}>
        <Ionicons name="search" size={16} color={colors.warmGray} />
        <NeuInput
          value={query}
          editable={false}
          onChangeText={(text) => setQuery(text)}
          placeholder="Select calendar icon"
          placeholderTextColor={colors.gray400}
          style={styles.searchInput}
          keyboardType="numbers-and-punctuation"
          autoCapitalize="none"
        />
        <Pressable
          onPress={() => {
            setCalendarOpen(true);
          }}
          hitSlop={10}
        >
          <Ionicons name="calendar-outline" size={18} color={colors.coral} />
        </Pressable>
      </Card>

      {/* Available header (restored) */}
      <View style={styles.availableRow}>
        <Text bold>Available:</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {dotsLoading ? <Text muted>…</Text> : null}
        </View>
      </View>

      {/* Calendar modal */}
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
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHeader}>
              <Text bold>Available days</Text>
              <Pressable
                onPress={() => {
                  setSelectedDay(null);
                  setQuery("");
                  setCalendarOpen(false);
                }}
                hitSlop={10}
              >
                <Text muted>Clear</Text>
              </Pressable>
            </View>

            <View style={{ marginTop: spacing.md }}>
              <Calendar
                markedDates={markedDates}
                onMonthChange={(m) => {
                  // m.month is 1-12
                  setVisibleMonth({ year: m.year, month: m.month });
                }}
                onDayPress={(day) => {
                  setSelectedDay(day.dateString);
                  setQuery(formatMMDDYYYY(day.dateString));
                  setCalendarOpen(false);
                }}
                theme={{
                  todayTextColor: colors.charcoal,
                  arrowColor: colors.coral,
                  backgroundColor: colors.cream,
                  calendarBackground: colors.cream,
                }}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* States */}
      {!selectedDay ? (
        <Card style={[styles.card, { marginTop: spacing.md }]}>
          <Text muted>Select a date (MM-DD-YYYY)</Text>
        </Card>
      ) : loading ? (
        <Card style={[styles.card, { marginTop: spacing.md }]}>
          <Text muted>Checking availability…</Text>
        </Card>
      ) : hcas.length === 0 ? (
        <Card style={[styles.card, { marginTop: spacing.md }]}>
          <Text bold>No health care advocates available</Text>
          <Text muted style={{ marginTop: spacing.sm }}>
            Try another date.
          </Text>
        </Card>
      ) : (
        <FlatList
          data={hcas}
          keyExtractor={(i) => i.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                navigation.navigate("HCADetail", {
                  id: item.id,
                  selectedDay,
                })
              }
            >
              <Card style={[styles.hcaCard, styles.card]}>
                <View style={styles.hcaRow}>
                  <View style={styles.avatarWrap}>
                    <Ionicons name="person" size={18} color={colors.warmGray} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text bold style={{ color: colors.charcoal }}>
                      {item.name}
                    </Text>
                    <Text muted style={{ marginTop: 2 }}>
                      Tap to schedule appointment
                    </Text>
                  </View>
                </View>
              </Card>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.cream,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },

  disclaimer: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  disclaimerText: {
    flex: 1,
    ...typography.caption,
    lineHeight: 16,
    fontFamily: fonts.regular,
  },

  searchWrap: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    fontFamily: fonts.regular,
  },

  availableRow: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  card: {
  },

  hcaCard: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.xs,
  },
  list: {
    marginHorizontal: -spacing.xs,
  },
  listContent: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xs,
  },

  hcaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  avatarWrap: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: colors.gray200,
    alignItems: "center",
    justifyContent: "center",
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
