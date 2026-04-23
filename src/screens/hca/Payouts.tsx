import React, { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";

import { Card, Text } from "../../components/Ui";
import { colors, fonts, radius, spacing, typography } from "../../theme/theme";

type PayoutRow = {
  id: string;
  label: string;
  value: string;
};
type Payout = {
  id: string;
  amount: string; // "$84.00"
  date: string; // "Feb 9, 2026"
  method: string; // "Bank •••• 1234"
  status: "Paid" | "Pending" | "Failed";
};

export default function PayoutsScreen() {
  // MOCK until backend wiring
  const [payoutMethodSet, setPayoutMethodSet] = useState(false);

  const stats = useMemo<PayoutRow[]>(
    () => [{ id: "1", label: "Pending", value: "$0.00" }],
    [],
  );

  const setupPayouts = () => {
    Alert.alert(
      "Coming soon",
      "We’ll wire this to Stripe (or your payout provider) when backend is ready.",
    );
    setPayoutMethodSet(true);
  };

  const history = useMemo<Payout[]>(
    () => [
      {
        id: "p1",
        amount: "$84.00",
        date: "Feb 9, 2026",
        method: "Bank •••• 1234",
        status: "Paid",
      },
      {
        id: "p2",
        amount: "$42.00",
        date: "Feb 2, 2026",
        method: "Bank •••• 1234",
        status: "Paid",
      },
      {
        id: "p3",
        amount: "$18.50",
        date: "Jan 28, 2026",
        method: "Bank •••• 1234",
        status: "Pending",
      },
    ],
    [],
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.cream }}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl }}
      showsVerticalScrollIndicator={false}
    >
      <Text muted style={styles.subtitle}>
        View your earnings and payout details. Payouts will be enabled once we
        connect the backend.
      </Text>

      {/* Summary cards */}
      <View style={styles.kpiRow}>
        {stats.map((row) => (
          <Card key={row.id} style={[styles.card, styles.kpiCard]}>
            <Text muted style={styles.kpiLabel}>
              {row.label}
            </Text>
            <Text bold style={styles.kpiValue}>
              {row.value}
            </Text>
          </Card>
        ))}
      </View>

      {/* Payout method */}
      <Card style={styles.card}>
        <Text bold style={styles.cardTitle}>
          Payout method
        </Text>

        <View style={styles.divider} />

        <Text muted>
          {payoutMethodSet
            ? "Payout method saved (mock)."
            : "No payout method on file."}
        </Text>

        <Pressable onPress={setupPayouts} style={styles.primaryBtn}>
          <Text bold style={styles.primaryBtnText}>
            {payoutMethodSet ? "Update payout method" : "Set up payouts"}
          </Text>
        </Pressable>
      </Card>

      {/* Actions */}
      {/* Payout history */}
      <Card style={styles.card}>
        <Text bold style={styles.cardTitle}>
          Payout history
        </Text>

        <View style={styles.divider} />

        {history.length === 0 ? (
          <Text muted>No payouts yet.</Text>
        ) : (
          <View style={styles.historyList}>
            {history.map((p, idx) => (
              <View key={p.id}>
                <View style={styles.historyRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyPrimary}>{p.amount}</Text>
                    <Text muted style={styles.historySecondary}>
                      {p.date} • {p.method}
                    </Text>
                  </View>

                  <View style={styles.historyRight}>
                    <Text
                      style={[
                        styles.statusPill,
                        p.status === "Paid" && styles.statusPaid,
                        p.status === "Pending" && styles.statusPending,
                        p.status === "Failed" && styles.statusFailed,
                      ]}
                    >
                      {p.status}
                    </Text>
                  </View>
                </View>

                {idx !== history.length - 1 ? (
                  <View style={styles.rowDivider} />
                ) : null}
              </View>
            ))}
          </View>
        )}
      </Card>

      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    ...typography.caption,
    color: colors.warmGray,
    lineHeight: 18,
    marginBottom: spacing.md,
    fontFamily: fonts.regular,
  },

  card: {
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    padding: spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    marginBottom: spacing.md, // ✅ more spacing between cards
  },

  cardTitle: {
    color: colors.coral,
    fontFamily: fonts.bold,
  },

  divider: {
    height: 1,
    backgroundColor: colors.gray200,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },

  kpiRow: {
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  kpiCard: {},
  kpiLabel: { ...typography.caption, fontFamily: fonts.regular },
  kpiValue: { fontSize: 22, marginTop: 4, color: colors.charcoal, fontFamily: fonts.bold },

  primaryBtn: {
    marginTop: spacing.md,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.charcoal,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: colors.white, fontFamily: fonts.semiBold },

  rowButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 10,
  },
  rowButtonText: { color: colors.charcoal, fontWeight: "700", fontFamily: fonts.bold },

  rowDivider: {
    height: 1,
    backgroundColor: colors.gray200,
    marginVertical: spacing.sm,
  },
  historyList: {
    gap: 0,
  },

  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: spacing.sm,
  },

  historyPrimary: {
    color: colors.charcoal,
    fontWeight: "800",
    fontFamily: fonts.bold,
  },

  historySecondary: {
    marginTop: 2,
  },

  historyRight: {
    alignItems: "flex-end",
  },

  statusPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    color: colors.warmGray,
    fontSize: 12,
    fontWeight: "700",
    backgroundColor: colors.gray100,
    fontFamily: fonts.semiBold,
  },

  statusPaid: {
    color: colors.charcoal,
    borderColor: colors.gray300,
  },

  statusPending: {
    color: colors.warmGray,
    borderColor: colors.gray300,
  },

  statusFailed: {
    color: "#DC2626",
    borderColor: "#FCA5A5",
    backgroundColor: "#FEE2E2",
  },
});
