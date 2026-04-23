import React from "react";
import { StyleSheet, View } from "react-native";
import { colors, fonts, spacing } from "../theme/theme";
import { Card, Text } from "./Ui";

export type Trimester = "1st" | "2nd" | "3rd";

type Props = {
  trimester: Trimester;
};

type BabyInfo = {
  fruit: string;
  fruitEmoji: string;
  weeks: string;
  length: string;
  weight: string;
  progress: number;
  milestones: string[];
};

const BABY_DATA: Record<Trimester, BabyInfo> = {
  "1st": {
    fruit: "Lime",
    fruitEmoji: "🍈",
    weeks: "Weeks 1–12",
    length: "5–6 cm",
    weight: "14 g",
    progress: 30,
    milestones: [
      "Tiny fingers & toes are forming",
      "First small movements begin",
      "Thumb-sucking may start",
      "Face features becoming defined",
    ],
  },
  "2nd": {
    fruit: "Mango",
    fruitEmoji: "🥭",
    weeks: "Weeks 13–26",
    length: "16–20 cm",
    weight: "100 g",
    progress: 50,
    milestones: [
      "You may feel the first kicks",
      "Baby can hear your voice now",
      "Gender visible on ultrasound",
      "Vernix caseosa covers skin",
    ],
  },
  "3rd": {
    fruit: "Pineapple",
    fruitEmoji: "🍍",
    weeks: "Weeks 27–40",
    length: "45 cm",
    weight: "2.3 kg",
    progress: 85,
    milestones: [
      "Baby moves head-down for birth",
      "Immune system is strengthening",
      "Skin becoming smooth & soft",
      "Lungs nearly fully developed",
    ],
  },
};

export default function BabySizeCard({ trimester }: Props) {
  const baby = BABY_DATA[trimester];

  return (
    <Card style={styles.card}>
      {/* Comparison row */}
      <View style={styles.comparisonRow}>
        <View style={styles.babyCircle}>
          <Text style={styles.comparisonEmoji}>👶🏾</Text>
        </View>
        <Text style={styles.equalsSign}>≈</Text>
        <View style={styles.fruitCircle}>
          <Text style={styles.comparisonEmoji}>{baby.fruitEmoji}</Text>
        </View>
      </View>

      {/* Main info row */}
      <View style={styles.infoRow}>
        <View style={styles.fruitIllustration}>
          <Text style={styles.fruitEmoji}>{baby.fruitEmoji}</Text>
        </View>

        <View style={styles.infoText}>
          <Text style={styles.sizeLabel}>YOUR BABY IS ABOUT THE SIZE OF A</Text>
          <Text style={styles.fruitName}>{baby.fruit}</Text>
          <Text style={styles.weekRange}>{baby.weeks}</Text>

          <View style={styles.measurements}>
            <View style={styles.measurement}>
              <Text style={styles.measureIcon}>📏</Text>
              <Text style={styles.measureValue}>{baby.length}</Text>
            </View>
            <View style={styles.measurement}>
              <Text style={styles.measureIcon}>⚖️</Text>
              <Text style={styles.measureValue}>{baby.weight}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Milestones */}
      <View style={styles.milestones}>
        <Text style={styles.milestonesLabel}>WHAT'S HAPPENING</Text>
        {baby.milestones.map((milestone, index) => (
          <View key={index} style={styles.milestoneRow}>
            <View style={styles.milestoneDot} />
            <Text style={styles.milestoneText}>{milestone}</Text>
          </View>
        ))}
      </View>

      {/* Progress bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressBg}>
          <View
            style={[styles.progressFill, { width: `${baby.progress}%` }]}
          />
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabel}>Week 1</Text>
          <Text style={styles.progressLabel}>Week 40</Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    overflow: "hidden",
    padding: 0,
  },

  /* Comparison row */
  comparisonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingTop: 16,
    paddingBottom: 4,
  },
  babyCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.peach,
    alignItems: "center",
    justifyContent: "center",
  },
  fruitCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.cream,
    borderWidth: 2,
    borderColor: "rgba(224, 120, 86, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  equalsSign: {
    fontSize: 16,
    color: colors.warmGray,
    fontWeight: "600",
    fontFamily: fonts.semiBold,
  },
  comparisonEmoji: {
    fontSize: 22,
  },

  /* Info row */
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  fruitIllustration: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E8F5E2",
    alignItems: "center",
    justifyContent: "center",
  },
  fruitEmoji: {
    fontSize: 56,
  },
  infoText: {
    flex: 1,
  },
  sizeLabel: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: fonts.semiBold,
    color: colors.coral,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  fruitName: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: fonts.bold,
    color: colors.charcoal,
    lineHeight: 28,
  },
  weekRange: {
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.warmGray,
    marginTop: 2,
  },
  measurements: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  measurement: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.cream,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  measureIcon: {
    fontSize: 12,
  },
  measureValue: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: fonts.semiBold,
    color: colors.charcoal,
  },

  /* Divider */
  divider: {
    height: 1,
    marginHorizontal: 20,
    backgroundColor: colors.peach,
    opacity: 0.4,
  },

  /* Milestones */
  milestones: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 4,
  },
  milestonesLabel: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: fonts.semiBold,
    color: colors.coral,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  milestoneRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
  },
  milestoneDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.peach,
    marginTop: 6,
  },
  milestoneText: {
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.charcoal,
    lineHeight: 18,
    flex: 1,
  },

  /* Progress bar */
  progressSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  progressBg: {
    height: 6,
    backgroundColor: colors.cream,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: colors.coral,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  progressLabel: {
    fontSize: 10,
    fontFamily: fonts.medium,
    color: colors.warmGray,
  },
});
