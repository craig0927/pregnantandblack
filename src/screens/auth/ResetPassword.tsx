import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, NeuInput, Text } from "../../components/Ui";
import { useAuth } from "../../context/AuthContext";
import { setPasswordResetInProgress } from "../../lib/passwordResetState";
import { supabase } from "../../lib/supabase";
import { colors, fonts, spacing } from "../../theme/theme";

export default function ResetPasswordScreen({
  route,
}: {
  route?: { params?: { email?: string } };
}) {
  const navigation = useNavigation<any>();
  const { signOut, isSignedIn } = useAuth();
  const email = route?.params?.email ?? "";

  const [step, setStep] = useState<"otp" | "password">("otp");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingSignIn, setPendingSignIn] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const stepRef = useRef(step);
  const passwordUpdatedRef = useRef(passwordUpdated);

  useEffect(() => {
    if (pendingSignIn && !isSignedIn) {
      navigation.reset({
        index: 0,
        routes: [{ name: "AuthStack" as never, state: { index: 0, routes: [{ name: "SignIn" }] } }],
      });
    }
  }, [pendingSignIn, isSignedIn, navigation]);

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    passwordUpdatedRef.current = passwordUpdated;
  }, [passwordUpdated]);

  useEffect(() => {
    return () => {
      const shouldClearRecoverySession =
        stepRef.current === "password" && !passwordUpdatedRef.current;
      setPasswordResetInProgress(false);
      if (shouldClearRecoverySession) {
        void signOut();
      }
    };
  }, [signOut]);

  const finishResetFlow = (title: string, message: string) => {
    setPasswordUpdated(true);
    Alert.alert(title, message, [
      {
        text: "Sign In",
        onPress: async () => {
          setPasswordResetInProgress(false);
          setPendingSignIn(true);
          await signOut();
        },
      },
    ]);
  };

  const handleVerifyOtp = async () => {
    const code = otp.trim();
    if (!code) {
      Alert.alert("Enter the code from your email.");
      return;
    }

    setLoading(true);
    setPasswordResetInProgress(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "recovery",
      });

      if (error) {
        setPasswordResetInProgress(false);
        Alert.alert("Invalid code", error.message);
        return;
      }

      setStep("password");
    } catch (e: any) {
      setPasswordResetInProgress(false);
      Alert.alert("Error", e?.message ?? "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (password.length < 6) {
      Alert.alert("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      finishResetFlow(
        "Password updated",
        "Your password has been updated.",
      );
    } catch (e: any) {
      setPasswordResetInProgress(false);
      Alert.alert("Error", e?.message ?? "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          {step === "otp" ? (
            <>
              <Text bold style={{ marginBottom: spacing.sm }}>
                Enter your code
              </Text>
              <Text muted style={{ marginBottom: spacing.lg }}>
                We sent a code to {email || "your email"}.
              </Text>

              <NeuInput
                placeholder="Code from email"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={8}
                autoFocus
              />

              <Button
                label={loading ? "Verifying..." : "Verify Code"}
                onPress={handleVerifyOtp}
                disabled={loading}
                variant="outline"
                style={{ marginTop: spacing.lg }}
                labelStyle={{ color: colors.coral }}
              />
            </>
          ) : (
            <>
              <Text bold style={{ marginBottom: spacing.lg }}>
                Set New Password
              </Text>

              <NeuInput
                placeholder="New password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                rightElement={
                  <Pressable
                    onPress={() => setShowPassword((p) => !p)}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={colors.warmGray}
                    />
                  </Pressable>
                }
              />

              <NeuInput
                placeholder="Confirm new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                style={{ marginTop: spacing.md }}
                rightElement={
                  <Pressable
                    onPress={() => setShowConfirmPassword((p) => !p)}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={
                        showConfirmPassword ? "eye-off-outline" : "eye-outline"
                      }
                      size={20}
                      color={colors.warmGray}
                    />
                  </Pressable>
                }
              />

              <Button
                label={loading ? "Updating..." : "Update Password"}
                onPress={handleUpdatePassword}
                disabled={loading}
                variant="outline"
                style={{ marginTop: spacing.lg }}
                labelStyle={{ color: colors.coral }}
              />
            </>
          )}
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  container: {
    flex: 1,
    padding: spacing.lg,
  },
});
