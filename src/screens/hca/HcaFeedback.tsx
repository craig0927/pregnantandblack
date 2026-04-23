import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Card, Text } from "../../components/Ui";
import { colors, spacing } from "../../theme/theme";

export default function HcaFeedback() {
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.cream }}
      contentContainerStyle={styles.container}
    >
      <Card style={styles.card}>
        <Text bold>Feedback</Text>
        <Text muted style={{ marginTop: spacing.sm }}>
          Add quick feedback capture here (rating + text).
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md },
  card: { padding: spacing.md },
});
