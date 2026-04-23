import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useBadgeCount } from "../hooks/useBadgeCount";
import { colors, neumorph } from "../theme/theme";

import ForumStack from "./ForumStack";
import MessagesStack from "./MessagesStack";
import ProfileStack from "./ProfileStack";
import ResourcesStack from "./ResourcesStack";
import ScheduleStack from "./ScheduleStack";

import type { NavigatorScreenParams } from "@react-navigation/native";
import type { ForumStackParamList } from "./ForumStack";
import type { MessagesStackParamList } from "./MessagesStack";
import type { ProfileStackParamList } from "./ProfileStack";
import type { ResourcesStackParamList } from "./ResourcesStack";
import type { ScheduleStackParamList } from "./ScheduleStack";

export type TabsParamList = {
  Resources: NavigatorScreenParams<ResourcesStackParamList>;
  Schedule: NavigatorScreenParams<ScheduleStackParamList>;
  Community: NavigatorScreenParams<ForumStackParamList>;
  Messages: NavigatorScreenParams<MessagesStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

const Tab = createBottomTabNavigator<TabsParamList>();

function tabIcon(
  routeName: keyof TabsParamList,
  focused: boolean,
): keyof typeof Ionicons.glyphMap {
  switch (routeName) {
    case "Resources":
      return focused ? "grid" : "grid-outline";
    case "Schedule":
      return focused ? "calendar" : "calendar-outline";
    case "Community":
      return focused ? "people" : "people-outline";
    case "Messages":
      return focused ? "chatbubble" : "chatbubble-outline";
    case "Profile":
      return focused ? "person" : "person-outline";
    default:
      return "ellipse-outline";
  }
}

export default function TabsNavigator() {
  const messagesBadge = useBadgeCount("messages-tab-badge");

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
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
        tabBarLabelStyle: {
          fontSize: 11,
          marginTop: 15,
        },
        tabBarIcon: ({ focused }) => (
          <View
            style={[
              tabStyles.iconWrap,
              focused ? tabStyles.iconWrapActive : tabStyles.iconWrapInactive,
            ]}
          >
            <Ionicons
              name={tabIcon(route.name, focused)}
              size={22}
              color={focused ? colors.accent : colors.warmGray}
            />
          </View>
        ),
      })}
    >
      <Tab.Screen name="Resources" component={ResourcesStack} />
      <Tab.Screen name="Schedule" component={ScheduleStack} />
      <Tab.Screen
        name="Community"
        component={ForumStack}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate("Community", { screen: "ForumHome" });
          },
        })}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesStack}
        options={{
          tabBarBadge: messagesBadge,
          tabBarBadgeStyle: {
            backgroundColor: colors.accent,
            color: colors.white,
          },
        }}
      />
      <Tab.Screen name="Profile" component={ProfileStack} />
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
