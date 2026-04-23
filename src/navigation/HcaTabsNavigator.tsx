import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { NavigatorScreenParams } from "@react-navigation/native";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useBadgeCount } from "../hooks/useBadgeCount";
import { colors, neumorph } from "../theme/theme";

import ForumStack, { ForumStackParamList } from "./ForumStack";
import HcaDashboardStack, {
  HcaDashboardStackParamList,
} from "./HcaDashboardStack";
import HcaMessagesStack, {
  HcaMessagesStackParamList,
} from "./HcaMessagesStack";
import HcaProfileStack, { HcaProfileStackParamList } from "./HcaProfileStack";
import HcaScheduleStack, {
  HcaScheduleStackParamList,
} from "./HcaScheduleStack";

export type HcaTabsParamList = {
  Dashboard: NavigatorScreenParams<HcaDashboardStackParamList>;
  Schedule: NavigatorScreenParams<HcaScheduleStackParamList>;
  Messages: NavigatorScreenParams<HcaMessagesStackParamList>;
  Community: NavigatorScreenParams<ForumStackParamList>;
  Profile: NavigatorScreenParams<HcaProfileStackParamList>;
};

const Tab = createBottomTabNavigator<HcaTabsParamList>();

function tabIcon(
  routeName: keyof HcaTabsParamList,
  focused: boolean,
): keyof typeof Ionicons.glyphMap {
  switch (routeName) {
    case "Dashboard":
      return focused ? "home" : "home-outline";
    case "Schedule":
      return focused ? "calendar" : "calendar-outline";
    case "Messages":
      return focused ? "chatbubble" : "chatbubble-outline";
    case "Community":
      return focused ? "people" : "people-outline";
    case "Profile":
      return focused ? "person" : "person-outline";
    default:
      return "ellipse-outline";
  }
}

export default function HcaTabsNavigator() {
  const messagesBadge = useBadgeCount("hca-messages-tab-badge");

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, // ✅ stacks handle headers/titles
        popToTopOnBlur: true,
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.warmGray,
        tabBarStyle: {
          backgroundColor: neumorph.bg,
          borderTopWidth: 0,
          height: 100,
          paddingBottom: 12,
          paddingTop: 12,
          paddingLeft: 5,
        },
        tabBarLabelStyle: { fontSize: 11, marginTop: 15 },
        tabBarIcon: ({ focused }) => (
          <View
            style={[
              tabStyles.iconWrap,
              focused ? tabStyles.iconWrapActive : tabStyles.iconWrapInactive,
            ]}
          >
            <Ionicons
              name={tabIcon(route.name as keyof HcaTabsParamList, focused)}
              size={22}
              color={focused ? colors.accent : colors.warmGray}
            />
          </View>
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={HcaDashboardStack} />
      <Tab.Screen name="Schedule" component={HcaScheduleStack} />
      <Tab.Screen
        name="Messages"
        component={HcaMessagesStack}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate("Messages", { screen: "MessagesHome" });
          },
        })}
        options={{
          tabBarBadge: messagesBadge,
          tabBarBadgeStyle: {
            backgroundColor: colors.accent,
            color: colors.white,
          },
        }}
      />
      <Tab.Screen
        name="Community"
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate("Community", { screen: "ForumHome" });
          },
        })}
      >
        {() => <ForumStack showHamburger={true} headerTitle="Community" />}
      </Tab.Screen>
      <Tab.Screen name="Profile" component={HcaProfileStack} />
    </Tab.Navigator>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  iconWrapInactive: {
    backgroundColor: neumorph.bg,
    boxShadow: "4px 4px 6px rgba(0,0,0,0.18), -4px -4px 6px rgba(255,255,255,0.85)",
    elevation: 4,
  } as any,
  iconWrapActive: {
    backgroundColor: neumorph.bg,
    boxShadow: "inset 3px 3px 5px rgba(0,0,0,0.18), inset -3px -3px 5px rgba(255,255,255,0.7)",
    elevation: 0,
    shadowOpacity: 0,
  } as any,
});
