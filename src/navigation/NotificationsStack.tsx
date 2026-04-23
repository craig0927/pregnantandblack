import { Ionicons } from "@expo/vector-icons";
import type { DrawerNavigationProp } from "@react-navigation/drawer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { Pressable } from "react-native";

import Notifications from "../screens/notifications/Notifications";
import { colors, spacing } from "../theme/theme";
import type { AppDrawerParamList } from "./AppDrawer";

export type NotificationsStackParamList = {
  NotificationsHome: undefined;
};

const Stack = createNativeStackNavigator<NotificationsStackParamList>();

export default function NotificationsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="NotificationsHome"
        component={Notifications}
        options={({ navigation }) => ({
          title: "Community",
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
    </Stack.Navigator>
  );
}
