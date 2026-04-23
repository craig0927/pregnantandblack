import { Ionicons } from "@expo/vector-icons";
import { DrawerActions } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { Image, Pressable } from "react-native";

import EducationHub from "../screens/education/EducationHub";
import DashboardResources from "../screens/resources/DashboardResources";
import ResourceDetail from "../screens/resources/ResourceDetail";
import ResourceList from "../screens/resources/ResourceList";

import { colors, spacing } from "../theme/theme";

const headerLogo = require("../../assets/images/pabLogoAccent.png");

export type ResourcesStackParamList = {
  DashboardResources: undefined;

  ResourceList: {
    title?: string;
    filterMode?: "trimester" | "state" | "category";
    category?: string;
  };

  ResourceDetail: { id: string } | { resource: any };

  EducationHub: undefined;
};

const Stack = createNativeStackNavigator<ResourcesStackParamList>();

export default function ResourcesStack() {
  return (
    <Stack.Navigator
      screenOptions={({ navigation, route }) => {
        const isRoot = route.name === "DashboardResources";

        const baseOptions = {
          headerShown: true,
          headerTitleAlign: "center" as const,
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.cream },
        };

        if (!isRoot) return baseOptions;

        return {
          ...baseOptions,
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
                marginRight: spacing.md,
                backgroundColor: "transparent",
                transform: [{ translateX: 6 }, { translateY: -5 }],
              }}
            />
          ),
        };
      }}
    >
      <Stack.Screen
        name="DashboardResources"
        component={DashboardResources}
        options={{ title: "Pregnant and Black" }}
      />

      <Stack.Screen
        name="EducationHub"
        component={EducationHub}
        options={{ title: "Education Hub", headerBackTitle: "Back" }}
      />

      <Stack.Screen
        name="ResourceList"
        component={ResourceList}
        options={({ route }) => ({
          title: route.params?.title ?? "Resources",
          headerBackTitle: "Back",
        })}
      />

      <Stack.Screen
        name="ResourceDetail"
        component={ResourceDetail}
        options={{ title: "Article", headerBackTitle: "Back" }}
      />
    </Stack.Navigator>
  );
}

