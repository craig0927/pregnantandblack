import React from "react";
import { Alert, Linking, StyleSheet, View } from "react-native";
import { Button, Card, H1, Screen, Text } from "../components/Ui";
import { spacing } from "../theme/theme";

export default function Emergency() {
  const dial911 = async () => {
    const url = "tel:911";
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
      else
        Alert.alert(
          "Cannot place call",
          "Dialer is not available on this device."
        );
    } catch {
      Alert.alert("Error", "Failed to initiate call.");
    }
  };

  return (
    <Screen>
      <H1 style={{ textAlign: "center" }}>Emergency</H1>

      <Card style={styles.card}>
        <Text bold>If you need immediate help, dial 911.</Text>
        <Text muted style={{ marginTop: spacing.sm }}>
          This will open your phone dialer.
        </Text>

        <View style={{ marginTop: spacing.lg }}>
          <Button label="Call 911" onPress={dial911} />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.lg },
});
