import { Ionicons } from "@expo/vector-icons";
import { DrawerActions } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { Pressable } from "react-native";

import HcaProfile from "../screens/hca/HcaProfile";
import { colors, spacing } from "../theme/theme";

export type HcaProfileStackParamList = {
  HcaProfileHome: undefined;
};

const Stack = createNativeStackNavigator<HcaProfileStackParamList>();

export default function HcaProfileStack() {
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
        name="HcaProfileHome"
        component={HcaProfile}
        options={({ navigation }) => ({
          title: "Profile",
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
