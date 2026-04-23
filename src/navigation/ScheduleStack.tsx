import { Ionicons } from "@expo/vector-icons";
import type { DrawerNavigationProp } from "@react-navigation/drawer";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { Pressable } from "react-native";

import HCADetail from "../screens/hca/HCADetail";
import HCAList from "../screens/hca/HCAList";
import AppointmentDetail from "../screens/schedule/AppointmentDetail";
import Appointments from "../screens/schedule/Appointments";
import RescheduleAppointment from "../screens/schedule/RescheduleAppointment";
import SessionRequested from "../screens/session/SessionRequested";

import { colors, spacing } from "../theme/theme";
import type { AppDrawerParamList } from "./AppDrawer";

export type ScheduleStackParamList = {
  Appointments: undefined;
  AppointmentDetail: { id?: string } | undefined;
  HCAList: undefined;
  HCADetail: { id: string };
  RescheduleAppointment: {
    appointmentId: string;
    hcaId: string;
    hcaName?: string;
    currentDate: string;
    currentTime: string;
  };
  SessionRequested: {
    advocateId: string;
    date: string;
    time: string;
    advocateName?: string;
  };
};

const Stack = createNativeStackNavigator<ScheduleStackParamList>();

export default function ScheduleStack() {
  return (
    <Stack.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerTitleAlign: "center",
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.cream },
        headerBackTitle: "Back",
        title:
          route.name === "Appointments"
            ? "Schedule"
            : route.name === "HCAList"
              ? "Find an Advocate"
              : route.name === "HCADetail"
                ? "Advocate Details"
                : route.name === "AppointmentDetail"
                  ? "Appointment Details"
                  : route.name === "RescheduleAppointment"
                    ? "Reschedule Session"
                    : route.name === "SessionRequested"
                      ? "Session Requested"
                      : "Schedule",
      })}
    >
      <Stack.Screen
        name="Appointments"
        component={Appointments}
        options={({ navigation }) => ({
          title: "Schedule",
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

      <Stack.Screen name="HCAList" component={HCAList} />
      <Stack.Screen name="HCADetail" component={HCADetail} />
      <Stack.Screen
        name="SessionRequested"
        component={SessionRequested}
      />
      <Stack.Screen name="AppointmentDetail" component={AppointmentDetail} />
      <Stack.Screen name="RescheduleAppointment" component={RescheduleAppointment} />
    </Stack.Navigator>
  );
}
