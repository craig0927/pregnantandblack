import { Ionicons } from "@expo/vector-icons";
import type { DrawerNavigationProp } from "@react-navigation/drawer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { Pressable } from "react-native";

import { SessionHeaderActions } from "../components/SessionHeaderActions";
import Messages from "../screens/messages/Messages";
import UserChat from "../screens/messages/UserChat";
import { colors, spacing } from "../theme/theme";
import type { AppDrawerParamList } from "./AppDrawer";

export type MessagesStackParamList = {
  MessagesHome: undefined;

  UserChat: {
    conversationId: string;
    name?: string;
    openFromNotification?: boolean;
  };
};

const Stack = createNativeStackNavigator<MessagesStackParamList>();


export default function MessagesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerTitleAlign: "center",
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.cream },
      }}
    >
      <Stack.Screen
        name="MessagesHome"
        component={Messages}
        options={({ navigation }) => ({
          title: "Messages",
          headerLeft: () => (
            <Pressable
              onPress={() =>
                (
                  navigation.getParent() as DrawerNavigationProp<AppDrawerParamList>
                )?.toggleDrawer()
              }
              style={{
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
              }}
              hitSlop={10}
            >
              <Ionicons name="menu" size={22} color={colors.charcoal} />
            </Pressable>
          ),
        })}
      />

      {/* ✅ Chat screen lives here */}
      <Stack.Screen
        name="UserChat"
        component={UserChat}
        options={({ navigation, route }) => ({
          headerTitle: route.params?.name ?? "Chat",

          headerLeft: () => (
            <Pressable
              onPress={() => navigation.navigate("MessagesHome")}
              style={{ paddingHorizontal: spacing.md }}
            >
              <Ionicons name="chevron-back" size={26} color={colors.charcoal} />
            </Pressable>
          ),
          headerRight: () => (
            <SessionHeaderActions conversationId={route.params.conversationId} />
          ),
        })}
      />
    </Stack.Navigator>
  );
}
