import { Ionicons } from "@expo/vector-icons";
import { DrawerActions } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { Pressable } from "react-native";

import HcaSchedule from "../screens/hca/HcaSchedule";
import { colors, spacing } from "../theme/theme";

export type HcaScheduleStackParamList = {
  HcaScheduleHome: undefined;
  // later:
  // AppointmentDetail: { id: string };
  // Availability: undefined;
};

const Stack = createNativeStackNavigator<HcaScheduleStackParamList>();

export default function HcaScheduleStack() {
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
        name="HcaScheduleHome"
        component={HcaSchedule}
        options={({ navigation }) => ({
          title: "Schedule",
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
    </Stack.Navigator>
  );
}
