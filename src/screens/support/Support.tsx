import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
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
import { getLatestSessionError } from "../../lib/sessionErrorStore";
import { colors, fonts, spacing, typography } from "../../theme/theme";

export default function SupportScreen({
  route,
}: {
  route?: { params?: { sessionError?: string } };
}) {
  const { role } = useAuth();
  const routeSessionError = route?.params?.sessionError?.trim() ?? "";
  const [storedSessionError, setStoredSessionError] = useState("");
  const sessionError = routeSessionError || storedSessionError;

  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");

  const canSubmit = useMemo(() => {
    return subject.trim().length > 0 && details.trim().length > 0;
  }, [subject, details]);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      const load = async () => {
        const e = await getLatestSessionError();
        if (!alive) return;
        setStoredSessionError(e?.trim() ?? "");
      };
      load();
      return () => {
        alive = false;
      };
    }, []),
  );

  const onSubmit = () => {
    const cleanSubject = subject.trim();
    const cleanDetails = details.trim();
    if (!cleanSubject || !cleanDetails) return;

    Alert.alert(
      "Send to Support",
      "This will open your email app with your report pre-filled.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Open Email",
          onPress: () => {
            const to = "info@pregnantandblack.com";
            const bodyLines = [
              `Subject: ${cleanSubject}`,
              `Role: ${role}`,
              `Platform: ${Platform.OS}`,
              sessionError ? `Session Error: ${sessionError}` : null,
              "",
              cleanDetails,
            ]
              .filter((l) => l !== null)
              .join("\n");
            const url = `mailto:${to}?subject=${encodeURIComponent(
              `PWB Support: ${cleanSubject}`,
            )}&body=${encodeURIComponent(bodyLines)}`;
            Linking.openURL(url).catch(() =>
              Alert.alert("Email not available", "No email app is configured."),
            );
            setSubject("");
            setDetails("");
          },
        },
      ],
    );
  };

  const emailSupport = async () => {
    const to = "info@pregnantandblack.com";
    const body = encodeURIComponent(
      `Role: ${role}\nPlatform: ${Platform.OS}\n\nDescribe what happened:\n`,
    );
    const url = `mailto:${to}?subject=${encodeURIComponent(
      "PWB Support",
    )}&body=${body}`;

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        Alert.alert("Email not available", "No email app is configured.");
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert("Unable to open email", "Please try again.");
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.stack}>
        <Text muted style={styles.subtitle}>
          For app issues, bugs, or help. If this is an emergency, use “Call
          911”.
        </Text>

        <Card style={styles.card}>
          <Text bold style={styles.cardTitle}>
            Contact Support
          </Text>

          <View style={styles.divider} />

          <Pressable
            onPress={emailSupport}
            style={styles.rowButton}
            hitSlop={10}
          >
            <Text style={styles.rowButtonText}>Email support</Text>
            <Text muted>Typically within 24 hours</Text>
          </Pressable>
        </Card>

        <Card style={styles.card}>
          <Text bold style={styles.cardTitle}>
            Report an Issue
          </Text>

          <View style={styles.divider} />

          <View style={styles.field}>
            <Text muted style={styles.label}>
              Subject
            </Text>
            <NeuInput
              value={subject}
              onChangeText={setSubject}
              placeholder="e.g. Can’t open messages"
              placeholderTextColor={colors.gray400}
              style={styles.input}
              autoCapitalize="sentences"
              returnKeyType="next"
            />
          </View>

          <View style={styles.field}>
            <Text muted style={styles.label}>
              What happened?
            </Text>
            <NeuInput
              value={details}
              onChangeText={setDetails}
              placeholder="Steps to reproduce, what you expected, what you saw…"
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
    gap: spacing.md, // ✅ increases spacing between cards
  },

  title: {
    ...typography.h2,
    color: colors.charcoal,
    textAlign: "center",
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

  rowButton: {
    paddingVertical: 10,
  },
  rowButtonText: {
    color: colors.charcoal,
    fontWeight: "700",
    marginBottom: 2,
    fontFamily: fonts.bold,
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

  kvRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  k: { color: colors.warmGray, fontFamily: fonts.regular },
  v: { color: colors.charcoal, fontWeight: "600", fontFamily: fonts.semiBold },
  errorBlock: {
    marginTop: spacing.sm,
    gap: 6,
  },
  errorText: {
    color: colors.charcoal,
    ...typography.caption,
    lineHeight: 17,
    fontFamily: fonts.regular,
  },
});
