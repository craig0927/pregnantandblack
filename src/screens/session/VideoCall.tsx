import { useRoute, useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Text } from "../../components/Ui";
import { colors, fonts, spacing } from "../../theme/theme";

export default function VideoCallScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { meetLink } = route.params as { meetLink: string };
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>Unable to load the meeting.</Text>
        <Button
          label="Go Back"
          onPress={() => navigation.goBack()}
          variant="outline"
          style={styles.errorBtn}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <WebView
        source={{ uri: meetLink }}
        style={styles.webview}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
        onHttpError={() => setHasError(true)}
        onError={() => setHasError(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.charcoal },
  webview: { flex: 1 },
  errorContainer: {
    flex: 1,
    backgroundColor: colors.charcoal,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  errorText: {
    color: colors.white,
    textAlign: "center",
    fontSize: 16,
    fontFamily: fonts.regular,
  },
  errorBtn: {
    borderColor: colors.white,
    minWidth: 140,
  },
});
