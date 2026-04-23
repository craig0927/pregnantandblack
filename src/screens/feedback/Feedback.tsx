import React, { useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import { Button, Card, NeuInput, Text } from "../../components/Ui";
import { useAuth } from "../../context/AuthContext";
import { colors, fonts, spacing, typography } from "../../theme/theme";

const CATEGORIES = [
  "Bug",
  "Feature request",
  "UI/UX",
  "Performance",
  "Content/Resources",
  "Other",
] as const;

type Category = (typeof CATEGORIES)[number];

function Pill({
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
      style={[styles.pill, selected && styles.pillOn]}
      hitSlop={8}
    >
      <Text
        bold={selected}
        style={[styles.pillText, selected && styles.pillTextOn]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Star({ filled, onPress }: { filled: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} style={styles.starBtn}>
      <Text style={[styles.star, filled && styles.starOn]}>
        {filled ? "★" : "☆"}
      </Text>
    </Pressable>
  );
}

export default function FeedbackScreen() {
  const { role } = useAuth();

  const [rating, setRating] = useState<number | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [message, setMessage] = useState("");
  const canSubmit = useMemo(() => {
    const hasSignal = !!rating || message.trim().length > 0;
    return hasSignal;
  }, [rating, message]);

  const onSubmit = () => {
    Alert.alert(
      "Send Feedback",
      "This will open your email app with your feedback pre-filled.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Open Email",
          onPress: () => {
            const bodyLines = [
              rating ? `Rating: ${rating}/5` : null,
              category ? `Category: ${category}` : null,
              `Role: ${role}`,
              `Platform: ${Platform.OS}`,
              "",
              message.trim() || "(no message)",
            ]
              .filter((l) => l !== null)
              .join("\n");
            const url = `mailto:info@pregnantandblack.com?subject=${encodeURIComponent(
              "PWB App Feedback",
            )}&body=${encodeURIComponent(bodyLines)}`;
            Linking.openURL(url).catch(() =>
              Alert.alert("Email not available", "No email app is configured."),
            );
            setRating(null);
            setCategory(null);
            setMessage("");
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.cream }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.stack}>
        <Text muted style={styles.subtitle}>
          Help us improve. Share what’s working, what’s broken, or what you want
          next.
        </Text>

        <Card style={styles.card}>
          <Text bold style={styles.cardTitle}>
            Rate your experience
          </Text>

          <View style={styles.divider} />

          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                filled={(rating ?? 0) >= n}
                onPress={() => setRating(n)}
              />
            ))}
          </View>

          <Text muted style={{ marginTop: spacing.sm }}>
            {rating ? `You selected ${rating}/5` : "Tap a star (optional)."}
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text bold style={styles.cardTitle}>
            Category
          </Text>

          <View style={styles.divider} />

          <View style={styles.pillsWrap}>
            {CATEGORIES.map((c) => (
              <Pill
                key={c}
                label={c}
                selected={category === c}
                onPress={() => setCategory((prev) => (prev === c ? null : c))}
              />
            ))}
          </View>

          <Text muted style={{ marginTop: spacing.sm }}>
            Optional — helps us route it to the right place.
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text bold style={styles.cardTitle}>
            Tell us more
          </Text>

          <View style={styles.divider} />

          <View style={styles.field}>
            <Text muted style={styles.label}>
              Message
            </Text>
            <NeuInput
              value={message}
              onChangeText={setMessage}
              placeholder="What happened? What should we change?"
              placeholderTextColor={colors.gray400}
              style={[styles.input, styles.textarea]}
              multiline
              textAlignVertical="top"
            />
          </View>

          <Button
            label="Submit"
            disabled={!canSubmit}
            onPress={onSubmit}
            variant="outline"
            style={styles.primaryBtn}
          />
        </Card>

        <Card style={styles.card}>
          <Text bold style={styles.cardTitle}>
            Quick Info
          </Text>

          <View style={styles.divider} />

          <View style={styles.kvRow}>
            <Text muted style={styles.k}>
              Role
            </Text>
            <Text style={styles.v}>{role}</Text>
          </View>
          <View style={styles.kvRow}>
            <Text muted style={styles.k}>
              Platform
            </Text>
            <Text style={styles.v}>{Platform.OS}</Text>
          </View>

        </Card>

        <View style={{ height: spacing.xl }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  stack: {
    gap: spacing.md,
  },

  subtitle: {
    marginTop: spacing.sm,
    textAlign: "center",
    color: colors.warmGray,
    lineHeight: 18,
    fontFamily: fonts.regular,
  },

  card: {
    backgroundColor: colors.cream,
  },

  cardTitle: {
    color: colors.coral,
  },

  divider: {
    height: 1,
    backgroundColor: colors.gray200,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },

  field: {
    gap: 6,
    marginBottom: spacing.md,
  },

  label: {
    ...typography.caption,
    color: colors.warmGray,
    fontFamily: fonts.regular,
  },

  input: {
    height: 44,
  },

  textarea: {
    height: 120,
    paddingTop: 12,
    paddingBottom: 12,
  },

  primaryBtn: {
    marginTop: spacing.sm,
  },

  pillsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  pill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.cream,
  },

  pillOn: {
    borderColor: colors.charcoal,
    backgroundColor: colors.gray100,
  },

  pillText: {
    fontSize: 12,
    color: colors.warmGray,
    fontFamily: fonts.regular,
  },

  pillTextOn: {
    color: colors.charcoal,
    fontFamily: fonts.medium,
  },

  starsRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },

  starBtn: {
    padding: 4,
  },

  star: {
    fontSize: 26,
    color: colors.warmGray,
    lineHeight: 28,
  },

  starOn: {
    color: colors.coral,
  },

  kvRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },

  k: {
    ...typography.caption,
    fontFamily: fonts.regular,
  },

  v: {
    color: colors.charcoal,
    fontWeight: "600",
    fontFamily: fonts.semiBold,
  },
});
