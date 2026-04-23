import { useNavigation } from "@react-navigation/native";
import React, { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { Card, Screen, Text } from "../../components/Ui";
import { colors, fonts } from "../../theme/theme";

type Resource = {
  id: string;
  title: string;
  subtitle?: string;
  tag?: string;
  trimester?: "1st" | "2nd" | "3rd";
  state?: string;
};

type Props = {
  route?: {
    params?: {
      title?: string;
      filterMode?: "trimester" | "state" | "category";
      category?: string;
      trimester?: "1st" | "2nd" | "3rd";
      state?: string; // "CA"
    };
  };
};

const CATEGORIES = [
  "Prenatal Care",
  "Postpartum",
  "Mental Health",
  "Nutrition",
  "Breastfeeding",
  "Legal / Rights",
  "Insurance",
  "Emergency",
] as const;

const MOCK: Resource[] = [
  {
    id: "1",
    title: "Support Hotline",
    subtitle: "24/7 confidential support",
    tag: "Emergency",
  },
  {
    id: "2",
    title: "Provider Rights Guide",
    subtitle: "Know what to ask and document",
    tag: "Legal / Rights",
  },
  {
    id: "3",
    title: "Doula Directory",
    subtitle: "Find certified advocates near you",
    tag: "Prenatal Care",
  },
  {
    id: "4",
    title: "Postpartum Checklist",
    subtitle: "Planning, symptoms, and support",
    tag: "Postpartum",
  },
];

export default function ResourceList({ route }: Props) {
  const navigation = useNavigation<any>();
  const filterMode = route?.params?.filterMode; // "trimester" | "state" | ...
  const initialCategory = route?.params?.category ?? "All";

  const [selectedCategory, setSelectedCategory] =
    useState<string>(initialCategory);

  const data = useMemo(() => {
    let out = MOCK;

    // (Optional) apply mode-based filtering later with real fields:
    // if (filterMode === "trimester" && route?.params?.trimester) {
    //   out = out.filter(r => r.trimester === route.params.trimester);
    // }
    // if (filterMode === "state" && route?.params?.state) {
    //   out = out.filter(r => r.state === route.params.state);
    // }

    // category filter (works now)
    if (selectedCategory !== "All") {
      out = out.filter((r) => r.tag === selectedCategory);
    }

    return out;
  }, [selectedCategory]);

  return (
    <Screen>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.filters}>
            <Text bold style={{ marginBottom: 8 }}>
              Filter by topic
            </Text>

            <View style={styles.chipRow}>
              <Chip
                label="All"
                selected={selectedCategory === "All"}
                onPress={() => setSelectedCategory("All")}
              />
              {CATEGORIES.map((c) => (
                <Chip
                  key={c}
                  label={c}
                  selected={selectedCategory === c}
                  onPress={() => setSelectedCategory(c)}
                />
              ))}
            </View>

            {/* Optional: show current mode so it’s clear */}
            {!!filterMode && (
              <Text muted style={{ marginTop: 10 }}>
                Showing:{" "}
                {filterMode === "trimester"
                  ? "by trimester"
                  : filterMode === "state"
                  ? "by state"
                  : "all"}
              </Text>
            )}

            <View style={{ height: 12 }} />
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => navigation.navigate("ResourceDetail", { resource: item })}
          >
            <Card>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text bold>{item.title}</Text>
                  {!!item.subtitle && (
                    <Text muted style={{ marginTop: 6 }}>
                      {item.subtitle}
                    </Text>
                  )}
                </View>

                {!!item.tag && (
                  <View style={styles.tag}>
                    <Text bold>{item.tag}</Text>
                  </View>
                )}
              </View>
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipActive]}
    >
      <Text style={[styles.chipText, selected ? styles.chipTextActive : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12, paddingBottom: 24 },
  filters: { marginBottom: 8 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    backgroundColor: colors.bg,
  },
  chipActive: {
    borderColor: "#000",
    backgroundColor: "#000",
  },
  chipText: { fontSize: 12, fontWeight: "600", color: "#4D4D4D" },
  chipTextActive: { color: "#FFFFFF" },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  tag: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
});
