import { useNavigation } from "@react-navigation/native";
import * as Linking from "expo-linking";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, NeuInput } from "../../components/Ui";
import { useAuth } from "../../context/AuthContext";
import { colors, fonts, spacing, typography } from "../../theme/theme";
import type { Role } from "../../types";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
}

const logo = require("../../../assets/images/pabLogoAccent.png");

export default function CreateAccountScreen({ route }: any) {
  const navigation = useNavigation<any>();
  const { isHcaApproved } = useAuth();
  const initialEmail = route?.params?.email ?? "";

  const [email, setEmail] = useState(initialEmail);

  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
  }, [initialEmail]);

  const emailOk = useMemo(() => isValidEmail(email), [email]);
  const disabledCta = !emailOk;

  /**
   * Navigate to registration (used directly for HCA path)
   */
  const goToRegistration = (targetRole: Role, overrideEmail?: string) => {
    const finalEmail = (overrideEmail ?? email).trim();
    navigation.navigate("UserRegistration", {
      email: finalEmail,
      role: targetRole,
      authProvider: "email",
    });
  };


  /**
   * HCA eligibility gate
   */
  const handleHcaContinue = async (overrideEmail?: string) => {
    const cleanEmail = (overrideEmail ?? email).trim();
    if (!cleanEmail) return;

    try {
      const approved = await isHcaApproved(cleanEmail);

      if (!approved) {
        Alert.alert(
          "Not approved",
          "Register to be a Health Care Advocate at pregnantandblack.com",
          [
            {
              text: "Open Website",
              onPress: () => {
                Linking.openURL("https://pregnantandblack.com").catch(() => {
                  Alert.alert(
                    "Unable to open website",
                    "Please visit pregnantandblack.com in your browser.",
                  );
                });
              },
            },
            { text: "OK", style: "cancel" },
          ],
        );
        return;
      }

      goToRegistration("hca", cleanEmail);
    } catch (err) {
      console.error("HCA approval check failed:", err);
      Alert.alert("Error", "Unable to verify approval status.");
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
          <Text style={styles.h2}>Create an account</Text>
          <Text style={styles.subtitle}>
            Enter your email to sign up for this app
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

          {/* BIRTHPARENT BUTTON */}
          <Button
            label="Continue as Birthparent"
            disabled={disabledCta}
            onPress={() => goToRegistration("birthparent")}
            variant="outline"
            style={styles.primaryBtn}
            labelStyle={styles.primaryBtnLabel}
          />

          {/* CARE COMPANION BUTTON */}
          <Button
            label="Continue as Care Companion"
            disabled={disabledCta}
            onPress={() => goToRegistration("care_companion")}
            variant="outline"
            style={styles.primaryBtn}
            labelStyle={styles.primaryBtnLabel}
          />

          {/* HCA BUTTON (GATED) */}
          <Button
            label="Continue as Health Care Advocate (HCA)"
            disabled={disabledCta}
            onPress={() => handleHcaContinue()}
            variant="outline"
            style={styles.primaryBtn}
            labelStyle={styles.primaryBtnLabel}
          />

          <View style={styles.haveAccount}>
            <Text style={styles.haveAccountText}>Already have an account?</Text>
            <Pressable onPress={() => navigation.navigate("SignIn")}>
              <Text style={styles.signInLink}>Sign in</Text>
            </Pressable>
          </View>

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

  brand: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: colors.charcoal,
    fontFamily: fonts.bold,
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

  content: { marginTop: spacing.sm, gap: spacing.md, paddingBottom: spacing.xl },

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

  haveAccount: { alignItems: "center", marginTop: spacing.lg, gap: spacing.sm },
  haveAccountText: {
    ...typography.body,
    color: colors.charcoal,
    fontWeight: "600",
    fontFamily: fonts.semiBold,
  },
  signInLink: {
    color: colors.coral,
    textDecorationLine: "underline",
    fontSize: 13,
    fontWeight: "600",
    fontFamily: fonts.semiBold,
  },

  terms: {
    ...typography.caption,
    color: colors.warmGray,
    textAlign: "center",
    fontFamily: fonts.regular,
    marginTop: spacing.lg,
    lineHeight: 18,
  },
  termsBold: { color: colors.coral, fontWeight: "700", fontFamily: fonts.bold },
});
