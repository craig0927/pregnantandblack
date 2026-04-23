import {
  DefaultTheme,
  LinkingOptions,
  NavigationContainer,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Linking from "expo-linking";
import React from "react";
import { colors } from "../theme/theme";

import { useAuth } from "../context/AuthContext";

// Auth screens
import CreateAccountScreen from "../screens/auth/CreateAccount";
import ResetPasswordScreen from "../screens/auth/ResetPassword";
import SignInScreen from "../screens/auth/SignIn";
import UserRegistrationScreen from "../screens/auth/UserRegistration";
import WelcomeScreen from "../screens/auth/Welcome";

// App shell
import AppDrawer from "./AppDrawer";

// Global routes
import Emergency from "../screens/Emergency";
import SessionConfirmed from "../screens/session/SessionConfirmed";
import SessionRequested from "../screens/session/SessionRequested";
import VideoCallScreen from "../screens/session/VideoCall";

import type { NavigatorScreenParams } from "@react-navigation/native";
import type { AppDrawerParamList } from "./AppDrawer";

/* ============================================
   Types
============================================ */

export type RootStackParamList = {
  AuthStack: undefined;
  AppRoot: NavigatorScreenParams<AppDrawerParamList>;
  ResetPassword: { email?: string } | undefined;
  Emergency: undefined;
  SessionRequested: {
    advocateId: string;
    date: string;
    time: string;
    advocateName?: string;
  };
  SessionConfirmed: undefined;
  VideoCall: { meetLink: string; title?: string };
};

export type AuthStackParamList = {
  Welcome: undefined;
  CreateAccount: undefined;
  SignIn: undefined;
  UserRegistration: { email?: string; role?: "birthparent" | "hca" | "care_companion" } | undefined;
};

/* ============================================
   Linking
============================================ */

const linking: LinkingOptions<RootStackParamList> = {
  // Include both slash forms so the deep link is caught regardless of how
  // Supabase encodes the redirect URL (pregnantandblack:// vs pregnantandblack:///).
  prefixes: [Linking.createURL("/"), "pregnantandblack://"],
  config: {
    screens: {
      ResetPassword: "reset-password",
    },
  },
};

/* ============================================
   Navigators
============================================ */

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

function AuthStackScreen() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="CreateAccount" component={CreateAccountScreen} />
      <AuthStack.Screen name="SignIn" component={SignInScreen} />
      <AuthStack.Screen
        name="UserRegistration"
        component={UserRegistrationScreen}
        options={{
          headerShown: true,
          title: "Create Profile",
          headerBackTitle: "Back",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.bg },
        }}
      />
    </AuthStack.Navigator>
  );
}

/* ============================================
   App Navigator
============================================ */

export default function AppNavigator() {
  const { isSignedIn } = useAuth();

  const navTheme = {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, background: colors.bg },
  };

  return (
    <NavigationContainer theme={navTheme} linking={linking}>
      <RootStack.Navigator screenOptions={{ headerShown: false, headerBackTitle: "Back" }}>
        {!isSignedIn ? (
          <RootStack.Screen name="AuthStack" component={AuthStackScreen} />
        ) : (
          <>
            <RootStack.Screen name="AppRoot" component={AppDrawer} />

            <RootStack.Screen
              name="Emergency"
              component={Emergency}
              options={{
                headerShown: true,
                presentation: "modal",
              }}
            />

            <RootStack.Screen
              name="SessionRequested"
              component={SessionRequested}
              options={{
                title: "Session Requested",
                headerShown: true,
                headerTitleAlign: "center",
                headerShadowVisible: false,
                headerStyle: { backgroundColor: colors.bg },
              }}
            />

            <RootStack.Screen
              name="SessionConfirmed"
              component={SessionConfirmed}
              options={{
                headerShown: true,
                headerTitleAlign: "center",
                headerShadowVisible: false,
                headerStyle: { backgroundColor: colors.bg },
              }}
            />

            <RootStack.Screen
              name="VideoCall"
              component={VideoCallScreen}
              options={({ route }: any) => ({
                headerShown: true,
                title: route.params?.title ?? "Session",
                headerTitleAlign: "center",
                headerShadowVisible: false,
                headerStyle: { backgroundColor: colors.charcoal },
                headerTintColor: colors.white,
                presentation: "fullScreenModal",
              })}
            />
          </>
        )}
        <RootStack.Screen
          name="ResetPassword"
          component={ResetPasswordScreen}
          options={{
            headerShown: true,
            title: "Reset Password",
            headerShadowVisible: false,
            headerStyle: { backgroundColor: colors.bg },
          }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
