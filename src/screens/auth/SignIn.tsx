import { useNavigation } from "@react-navigation/native";
import * as Linking from "expo-linking";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";
import { Button, NeuInput, Text } from "../../components/Ui";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { colors, fonts, spacing, typography } from "../../theme/theme";

const logo = require("../../../assets/images/pabLogoAccent.png");

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
}

export default function SignInScreen() {
  const navigation = useNavigation<any>();
  const { signInWithPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const disabledCta = useMemo(() => {
    return !isValidEmail(email) || !password.trim();
  }, [email, password]);

  const handleForgotPassword = async () => {
    const cleanEmail = email?.trim();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      Alert.alert("Enter a valid email address.");
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail);

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }
    } catch {
      Alert.alert(
        "Network error",
        "Unable to send reset email. Please try again.",
      );
      return;
    }

    Alert.alert(
      "Check your email",
      "Enter the code from your email to reset your password.",
    );
    navigation.navigate("ResetPassword", { email: cleanEmail });
  };

  const handleSignIn = async () => {
    const cleanEmail = email.trim();

    if (!cleanEmail || !password.trim()) {
      Alert.alert("Enter email and password.");
      return;
    }

    try {
      setLoading(true);
      await signInWithPassword(cleanEmail, password);
    } catch (e: any) {
      Alert.alert("Sign in failed", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <View style={styles.logoWrap}>
            <Image source={logo} style={styles.brandLogo} resizeMode="contain" />
          </View>

          <View style={styles.content}>
            <Text style={styles.h2}>Already have an account?</Text>
            <Text style={styles.subtitle}>
              Enter your email and password to sign in
            </Text>

            <NeuInput
              value={email}
              onChangeText={(text) => setEmail(text.toLowerCase())}
              placeholder="email@domain.com"
              placeholderTextColor={colors.gray400}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              style={styles.input}
            />

            <NeuInput
              value={password}
              onChangeText={setPassword}
              placeholder="password"
              placeholderTextColor={colors.gray400}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              style={styles.input}
              rightElement={
                <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={18}
                    color={colors.gray400}
                  />
                </Pressable>
              }
            />

            <Pressable
              onPress={handleForgotPassword}
              style={{ alignSelf: "flex-end" }}
            >
              <Text
                style={{ color: colors.warmGray, textDecorationLine: "underline", fontFamily: fonts.regular }}
              >
                Forgot password?
              </Text>
            </Pressable>

            <Button
              label={loading ? "Please wait..." : "Continue"}
              onPress={handleSignIn}
              disabled={disabledCta || loading}
              variant="outline"
              style={styles.primaryBtn}
              labelStyle={styles.primaryBtnLabel}
            />

            <Button
              label="Create a New Account"
              onPress={() => navigation.navigate("CreateAccount")}
              variant="outline"
              style={styles.primaryBtn}
              labelStyle={styles.primaryBtnLabel}
            />

            <Text style={styles.terms}>
              By clicking continue, you agree to our{" "}
              <Text style={styles.termsBold} onPress={() => Linking.openURL("https://www.pregnantandblack.com/terms-conditions")}>Terms of Service</Text> and{" "}
              <Text style={styles.termsBold} onPress={() => Linking.openURL("https://www.pregnantandblack.com/privacy-policy")}>Privacy Policy</Text>
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  container: {
    flex: 1,
    backgroundColor: colors.cream,
    paddingHorizontal: spacing.xl,
    paddingTop: 0,
    paddingBottom: 0,
  },
  logoWrap: {
    alignItems: "center",
    marginTop: 0,
    marginBottom: 0,
  },
  brandLogo: {
    width: 230,
    height: 230,
  },
  content: {
    marginTop: spacing.sm,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  h2: {
    ...typography.h2,
    textAlign: "center",
    color: colors.charcoal,
    fontFamily: fonts.semiBold,
  },
  subtitle: {
    ...typography.body,
    textAlign: "center",
    color: colors.warmGray,
    fontFamily: fonts.regular,
    marginTop: -6,
  },
  input: {
    height: 44,
    marginTop: spacing.sm,
  },
  primaryBtn: {
    marginTop: spacing.sm,
  },
  primaryBtnLabel: {
    textAlign: "center",
  },
  terms: {
    ...typography.caption,
    color: colors.warmGray,
    textAlign: "center",
    fontFamily: fonts.regular,
    marginTop: spacing.lg,
    lineHeight: 18,
  },
  termsBold: {
    color: colors.coral,
    fontWeight: "700",
    fontFamily: fonts.bold,
  },
});
