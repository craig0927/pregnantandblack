import { Ionicons } from "@expo/vector-icons";
import { DrawerActions } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { Image, Pressable } from "react-native";

import HcaDashboard from "../screens/hca/HCADashboard";
import RescheduleAppointment from "../screens/schedule/RescheduleAppointment";
import { colors, spacing } from "../theme/theme";

export type HcaDashboardStackParamList = {
  HcaDashboardHome: undefined;
  HcaReschedule: {
    appointmentId: string;
    hcaId: string;
    hcaName?: string;
    currentDate: string;
    currentTime: string;
  };
};

const Stack = createNativeStackNavigator<HcaDashboardStackParamList>();
const headerLogo = require("../../assets/images/pabLogoAccent.png");

export default function HcaDashboardStack() {
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
        name="HcaDashboardHome"
        component={HcaDashboard}
        options={({ navigation }) => ({
          title: "Pregnant and Black",
          headerLeft: () => (
            <Pressable
              onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
              style={{
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
              }}
              hitSlop={10}
            >
              <Ionicons name="menu" size={22} color={colors.charcoal} />
            </Pressable>
          ),
          headerRight: () => (
            <Image
              source={headerLogo}
              resizeMode="contain"
              style={{
                width: 50,
                height: 42,
                marginRight: spacing.sm,
                backgroundColor: "transparent",
                transform: [{ translateX: 5 }, { translateY: -4 }],
              }}
            />
          ),
        })}
      />
      <Stack.Screen
        name="HcaReschedule"
        component={RescheduleAppointment}
        options={{
          title: "Reschedule Session",
          headerBackTitle: "Back",
        }}
      />
    </Stack.Navigator>
  );
}
