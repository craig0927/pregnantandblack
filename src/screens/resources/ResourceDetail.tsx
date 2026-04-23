import React from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { H1, Text } from "../../components/Ui";
import { colors, spacing } from "../../theme/theme";

type Resource = {
  id: string;
  title: string;
  subtitle?: string;
  body?: string;
  tag?: string;
  description?: string;
  sourceName?: string;
  url?: string;
};

export default function ResourceDetail({
  route,
}: {
  route?: { params?: { resource?: Resource } };
}) {
  const insets = useSafeAreaInsets();
  const resource = route?.params?.resource;
  if (!resource) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream, justifyContent: "center", alignItems: "center" }}>
        <Text muted>Resource not found.</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.md,
          paddingTop: spacing.md,
          paddingBottom: spacing.xl + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
      >
        <H1>{resource.title}</H1>
        {!!resource.subtitle && <Text muted>{resource.subtitle}</Text>}
        <Text style={{ marginTop: spacing.md }}>{resource.body}</Text>
      </ScrollView>
    </View>
  );
}
