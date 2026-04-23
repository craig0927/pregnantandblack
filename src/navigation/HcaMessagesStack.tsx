import { Ionicons } from "@expo/vector-icons";
import { DrawerActions } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { Pressable } from "react-native";

import { SessionHeaderActions } from "../components/SessionHeaderActions";
import Messages from "../screens/messages/Messages";
import UserChat from "../screens/messages/UserChat";
import { colors, spacing } from "../theme/theme";

export type HcaMessagesStackParamList = {
  MessagesHome: undefined;
  UserChat: { conversationId: string; name: string };
};

const Stack = createNativeStackNavigator<HcaMessagesStackParamList>();


export default function HcaMessagesStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerTitleAlign: "center",
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.cream },
        headerBackTitle: "Back",
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
                navigation.getParent()?.dispatch(DrawerActions.toggleDrawer())
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

      <Stack.Screen
        name="UserChat"
        component={UserChat}
        options={({ route }) => ({
          title: route.params?.name ?? "Chat",
          headerRight: () => (
            <SessionHeaderActions conversationId={route.params.conversationId} />
          ),
        })}
      />
    </Stack.Navigator>
  );
}
