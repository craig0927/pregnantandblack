import { Ionicons } from "@expo/vector-icons";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
} from "@react-navigation/drawer";
import { CommonActions, DrawerActions } from "@react-navigation/native";
import React, { useEffect, useRef } from "react";
import {
  Alert,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import { Text } from "../components/Ui";
import { useAuth } from "../context/AuthContext";
import { colors, spacing, typography } from "../theme/theme";

import type { NavigatorScreenParams } from "@react-navigation/native";
import FeedbackScreen from "../screens/feedback/Feedback";

import SupportScreen from "../screens/support/Support";
import type { Role } from "../types";
import HcaTabsNavigator from "./HcaTabsNavigator";
import TabsNavigator from "./TabsNavigator";

const logo = require("../../assets/images/pabLogoAccent.png");

export type AppDrawerParamList = {
  // NOTE: MainTabs can be user Tabs OR HCA Tabs, so allow nested params.
  MainTabs: NavigatorScreenParams<any> | undefined;

  Support: undefined;
  Feedback: undefined;
};

const Drawer = createDrawerNavigator<AppDrawerParamList>();

/** Single source of truth for "go home" */
function resetToHome(navigation: any, role: Role) {
  const params =
    role === "hca"
      ? {
          // HCA: go to Dashboard tab, then the dashboard stack home screen
          screen: "Dashboard",
          params: { screen: "HcaDashboardHome" },
        }
      : {
          // User & Care Companion: go to Resources tab, then the resources stack home screen
          screen: "Resources",
          params: { screen: "DashboardResources" },
        };

  navigation.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [
        {
          name: "MainTabs",
          params,
        },
      ],
    }),
  );
}

function HeaderHamburgerButton({ navigation }: { navigation: any }) {
  const openMenu = () => navigation.dispatch(DrawerActions.toggleDrawer());

  return (
    <Pressable
      onPress={openMenu}
      style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}
      hitSlop={10}
    >
      <Ionicons name="menu" size={22} color={colors.charcoal} />
    </Pressable>
  );
}

function AppDrawerContent(props: any) {
  const { signOut, role, profile } = useAuth();

  const close = () => props.navigation.dispatch(DrawerActions.closeDrawer());

  const go = (routeName: keyof AppDrawerParamList) => {
    props.navigation.navigate(routeName);
    close();
  };

  const goHome = () => {
    close();
    requestAnimationFrame(() => resetToHome(props.navigation, role));
  };

  const call911 = () => {
    Alert.alert("Call 911", "This will place an emergency call.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Call",
        style: "destructive",
        onPress: async () => {
          try {
            await Linking.openURL("tel:911");
          } catch {
            Alert.alert("Unable to call", "Your device couldn't start a call.");
          }
        },
      },
    ]);
  };

  const doSignOut = () => {
    Alert.alert("Sign out?", "You’ll be returned to the welcome screen.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          close();
          await signOut();
        },
      },
    ]);
  };

  const Item = ({
    icon,
    label,
    onPress,
    danger,
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
    danger?: boolean;
  }) => (
    <Pressable onPress={onPress} style={styles.item} hitSlop={10}>
      <Ionicons
        name={icon}
        size={18}
        color={danger ? colors.accent : colors.charcoal}
      />
      <Text style={[styles.itemText, danger && { color: colors.accent }]}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.drawerContainer}
    >
      {/* Header */}
      <View style={styles.drawerHeader}>
        <View style={styles.logoWrap}>
          <Image source={logo} style={styles.brandLogo} resizeMode="contain" />
        </View>
        <Text muted style={styles.drawerSubtitle}>
          {profile?.preferredName
            ? `Hi, ${profile.preferredName}${profile.lastInitial ? ` ${profile.lastInitial}.` : ""}`
            : profile?.username
              ? `Hi, ${profile.username}`
              : "Welcome"}
        </Text>
      </View>

      <View style={styles.section}>
        <Item icon="home-outline" label="Home" onPress={goHome} />
      </View>

      <View style={styles.section}>
        <Item
          icon="warning-outline"
          label="Emergency / Call 911"
          onPress={call911}
          danger
        />
      </View>

      <View style={styles.section}>
        <Item
          icon="help-circle-outline"
          label="Report Issue / Support"
          onPress={() => go("Support")}
        />
        <Item
          icon="chatbox-ellipses-outline"
          label="Feedback"
          onPress={() => go("Feedback")}
        />
      </View>

      <View style={styles.section}>
        <Item
          icon="log-out-outline"
          label="Sign out"
          onPress={doSignOut}
          danger
        />
      </View>
    </DrawerContentScrollView>
  );
}

export default function AppDrawer() {
  const { role, isSignedIn } = useAuth();

  // ✅ Safety net: if role flips (user -> hca) after registration,
  // reset tab state so you don't stay stuck in the prior tabs navigation state.
  const navRef = useRef<any>(null);
  const lastRoleRef = useRef<Role>(role);

  useEffect(() => {
    // Only run after signed-in state is true and navigation exists.
    if (!isSignedIn) return;
    if (!navRef.current) return;

    if (lastRoleRef.current !== role) {
      lastRoleRef.current = role;

      // Reset into the correct home for the new role.
      // This prevents "I still see user dashboard" when role updates after signup.
      resetToHome(navRef.current, role);
    }
  }, [role, isSignedIn]);

  return (
    <Drawer.Navigator
      drawerContent={(props) => <AppDrawerContent {...props} />}
      screenOptions={({ route, navigation }) => {
        const isMainTabs = route.name === "MainTabs";

        return {
          drawerType: "front",
          drawerStyle: { backgroundColor: colors.cream },

          // Tabs manage their own headers in their stacks
          headerShown: !isMainTabs,
          headerTitleAlign: "center",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.cream },

          // ✅ Drawer-only screens show hamburger (not Home) in the header
          headerLeft: !isMainTabs
            ? () => <HeaderHamburgerButton navigation={navigation} />
            : undefined,
        };
      }}
    >
      <Drawer.Screen
        name="MainTabs"
        component={role === "hca" ? HcaTabsNavigator : TabsNavigator}
        options={{ title: "Home" }}
      />

      {/* Drawer-only screens with headers + hamburger */}
      <Drawer.Screen
        name="Support"
        component={SupportScreen}
        options={{ title: "Support" }}
      />
      <Drawer.Screen
        name="Feedback"
        component={FeedbackScreen}
        options={{ title: "Feedback" }}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  logoWrap: {
    alignItems: "center",
    marginTop: -30,
    marginBottom: 0,
  },
  brandLogo: {
    width: 200,
    height: 200,
  },
  drawerContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },

  drawerHeader: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.inputBorder,
    marginBottom: spacing.md,
  },
  drawerTitle: {
    ...typography.h2,
    color: colors.charcoal,
  },
  drawerSubtitle: {
    marginTop: 4,
  },

  section: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  itemText: {
    color: colors.charcoal,
    fontWeight: "600",
  },

  placeholder: {
    flex: 1,
    backgroundColor: colors.white,
    padding: spacing.md,
    justifyContent: "center",
  },
  placeholderTitle: {
    ...typography.h2,
    color: colors.charcoal,
  },
});
