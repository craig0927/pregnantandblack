import { Ionicons } from "@expo/vector-icons";
import { DrawerActions } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { Pressable } from "react-native";

import Profile from "../screens/profile/Profile";

import { colors, spacing } from "../theme/theme";

export type ProfileStackParamList = {
  ProfileHome: undefined;
  Questionnaire: { mode?: "edit" | "create" };
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStack() {
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
        name="ProfileHome"
        component={Profile}
        options={({ navigation }) => ({
          title: "Profile",
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
        })}
      />
    </Stack.Navigator>
  );
}
