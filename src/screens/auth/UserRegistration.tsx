import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button, Card, NeuInput } from "../../components/Ui";
import type { ContactOption } from "../../context/AuthContext";
import { useAuth } from "../../context/AuthContext";
import { colors, fonts, spacing } from "../../theme/theme";
import type { Role } from "../../types";

const CONTACT_OPTIONS: ContactOption[] = ["Video", "Chat", "Audio Call"];

const RELATIONSHIP_OPTIONS = [
  "Partner / Spouse",
  "Parent",
  "Sibling",
  "Friend",
  "Other family member",
  "Other",
];

const SUPPORT_NEEDS = [
  "Understanding symptoms",
  "Navigating appointments / what to ask",
  "Finding an advocate",
  "Mental health & emotional support",
  "Postpartum preparation",
  "Nutrition & wellness",
  "Birth plan guidance",
  "Knowing my rights as a patient",
  "High-risk pregnancy support",
  "Breastfeeding & lactation",
  "Partner / family involvement",
];

export default function UserRegistrationScreen({ route }: any) {
  const { completeRegistration } = useAuth();

  const role: Role = route?.params?.role ?? "birthparent";
  const email = route?.params?.email ?? "";
  const authProvider: "email" | "social" =
    route?.params?.authProvider === "social" ? "social" : "email";
  const isSocialRegistration = authProvider === "social";

  const [userName, setUserName] = useState("");
  const [preferredName, setPreferredName] = useState("");
  const [lastInitial, setLastInitial] = useState("");
  const [pw, setPw] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [supportNeeds, setSupportNeeds] = useState<string[]>([]);
  const [contactPreferences, setContactPreferences] = useState<ContactOption[]>(
    ["Chat"],
  );

  const [relationshipToUser, setRelationshipToUser] = useState("");

  const [bio, setBio] = useState("");
  const [languages, setLanguages] = useState("");
  const [modalitiesOffered, setModalitiesOffered] = useState<ContactOption[]>([
    "Chat",
  ]);

  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedConsent, setAgreedConsent] = useState(false);

  const canSubmit = useMemo(() => {
    if (!userName.trim()) return false;
    if (!isSocialRegistration && pw.trim().length < 6) return false;
    if (!agreedTerms || !agreedConsent) return false;
    return true;
  }, [userName, pw, agreedTerms, agreedConsent, isSocialRegistration]);

  const toggleSupportNeed = (value: string) => {
    setSupportNeeds((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value],
    );
  };

  const toggleContactPreference = (opt: ContactOption) => {
    if (opt === "Chat") return;
    setContactPreferences((prev) =>
      prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt],
    );
  };

  const toggleModalities = (opt: ContactOption) => {
    if (opt === "Chat") return;
    setModalitiesOffered((prev) =>
      prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt],
    );
  };

  const parseCsv = (s: string) =>
    s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

  const onFinish = async () => {
    try {
      await completeRegistration({
        role,
        password: isSocialRegistration ? undefined : pw,
        email,
        username: userName,
        preferredName: preferredName.trim() || undefined,
        lastInitial: lastInitial.trim() || undefined,

        ...(role === "birthparent"
          ? {
              contactPreferences: Array.from(
                new Set(["Chat", ...contactPreferences]),
              ),
              questionnaire: {
                supportNeeds,
              },
            }
          : role === "care_companion"
            ? {
                contactPreferences: Array.from(
                  new Set(["Chat", ...contactPreferences]),
                ),
                careCompanion: {
                  relationshipToUser: relationshipToUser || undefined,
                },
              }
            : {
                hca: {
                  bio: bio.trim() || undefined,
                  languages: parseCsv(languages),
                  modalitiesOffered: Array.from(
                    new Set(["Chat", ...modalitiesOffered]),
                  ),
                },
              }),
      });
    } catch (e: any) {
      Alert.alert("Registration failed", e?.message ?? "Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Basic Info</Text>

          <NeuInput
            placeholder="Username"
            value={userName}
            onChangeText={setUserName}
            style={styles.input}
            placeholderTextColor={colors.gray400}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.nameLabel}>What should we call you?</Text>
          <NeuInput
            placeholder="First name"
            value={preferredName}
            onChangeText={setPreferredName}
            style={styles.input}
            placeholderTextColor={colors.gray400}
            autoCapitalize="words"
            autoCorrect={false}
          />
          <NeuInput
            placeholder="Last initial (optional)"
            value={lastInitial}
            onChangeText={(t) => setLastInitial(t.slice(0, 1).toUpperCase())}
            style={styles.input}
            placeholderTextColor={colors.gray400}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={1}
          />
          <Text style={styles.nameHint}>
            We use your first name to personalize your experience.
          </Text>

          {isSocialRegistration ? (
            <Text style={styles.helper}>
              Password is managed by your Google/Apple account.
            </Text>
          ) : (
            <View style={styles.passwordInputWrap}>
              <NeuInput
                placeholder="Password (min 6 chars)"
                secureTextEntry={!showPassword}
                value={pw}
                onChangeText={setPw}
                style={[styles.input, styles.passwordInput]}
                placeholderTextColor={colors.gray400}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable
                onPress={() => setShowPassword((p) => !p)}
                hitSlop={8}
                style={styles.eyeButton}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.warmGray}
                />
              </Pressable>
            </View>
          )}
        </Card>

        {role === "birthparent" && (
          <>
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionHeader}>Support Needs</Text>

              <View style={styles.chipWrap}>
                {SUPPORT_NEEDS.map((s) => (
                  <Chip
                    key={s}
                    label={s}
                    selected={supportNeeds.includes(s)}
                    onPress={() => toggleSupportNeed(s)}
                  />
                ))}
              </View>
            </Card>

            <Card style={styles.sectionCard}>
              <Text style={styles.sectionHeader}>Preferred Contact</Text>

              <Text style={styles.disclaimer}>
                Chat is the default contact method and cannot be removed. You
                may select additional contact methods if desired. You can change
                these later in your profile settings.
              </Text>

              <View style={styles.pillsRow}>
                {CONTACT_OPTIONS.map((opt) => {
                  const selected = contactPreferences.includes(opt);
                  const isLocked = opt === "Chat";

                  return (
                    <Pressable
                      key={opt}
                      onPress={() => toggleContactPreference(opt)}
                      disabled={isLocked}
                      style={[
                        styles.pill,
                        selected && styles.pillActive,
                        isLocked && { opacity: 0.8 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          selected && styles.pillTextActive,
                        ]}
                      >
                        {opt === "Chat" ? "Chat (Required)" : opt}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          </>
        )}

        {role === "care_companion" && (
          <>
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionHeader}>
                Your Relationship
              </Text>
              <Text style={styles.disclaimer}>
                How are you connected to the person you're supporting?
              </Text>

              <View style={styles.chipWrap}>
                {RELATIONSHIP_OPTIONS.map((r) => (
                  <Chip
                    key={r}
                    label={r}
                    selected={relationshipToUser === r}
                    onPress={() =>
                      setRelationshipToUser((prev) => (prev === r ? "" : r))
                    }
                  />
                ))}
              </View>
            </Card>

            <Card style={styles.sectionCard}>
              <Text style={styles.sectionHeader}>Preferred Contact</Text>

              <Text style={styles.disclaimer}>
                Chat is the default contact method and cannot be removed. You
                may select additional contact methods if desired. You can change
                these later in your profile settings.
              </Text>

              <View style={styles.pillsRow}>
                {CONTACT_OPTIONS.map((opt) => {
                  const selected = contactPreferences.includes(opt);
                  const isLocked = opt === "Chat";

                  return (
                    <Pressable
                      key={opt}
                      onPress={() => toggleContactPreference(opt)}
                      disabled={isLocked}
                      style={[
                        styles.pill,
                        selected && styles.pillActive,
                        isLocked && { opacity: 0.8 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          selected && styles.pillTextActive,
                        ]}
                      >
                        {opt === "Chat" ? "Chat (Required)" : opt}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          </>
        )}

        {role === "hca" && (
          <>
            <Card style={styles.sectionCard}>
              <Text style={styles.sectionHeader}>Bio</Text>

              <NeuInput
                placeholder="Short bio"
                value={bio}
                onChangeText={setBio}
                style={[styles.input, { height: 120 }]}
                placeholderTextColor={colors.gray400}
                multiline
              />
            </Card>

            <Card style={styles.sectionCard}>
              <Text style={styles.sectionHeader}>
                Languages (comma separated)
              </Text>

              <NeuInput
                placeholder="English, Spanish"
                value={languages}
                onChangeText={setLanguages}
                style={styles.input}
                placeholderTextColor={colors.gray400}
              />
            </Card>

            <Card style={styles.sectionCard}>
              <Text style={styles.sectionHeader}>Modalities Offered</Text>
              <Text style={styles.disclaimer}>
                Chat is the default contact method and cannot be removed. You
                may select additional contact methods if desired. You can change
                these later in your profile settings.
              </Text>

              <View style={styles.pillsRow}>
                {CONTACT_OPTIONS.map((opt) => {
                  const selected = modalitiesOffered.includes(opt);
                  const isLocked = opt === "Chat";

                  return (
                    <Pressable
                      key={opt}
                      onPress={() => toggleModalities(opt)}
                      disabled={isLocked}
                      style={[
                        styles.pill,
                        selected && styles.pillActive,
                        isLocked && { opacity: 0.8 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.pillText,
                          selected && styles.pillTextActive,
                        ]}
                      >
                        {opt === "Chat" ? "Chat (Required)" : opt}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          </>
        )}

        <Card style={styles.sectionCard}>
          <Pressable
            style={styles.checkboxRow}
            onPress={() => setAgreedTerms((p) => !p)}
          >
            <View
              style={[styles.checkbox, agreedTerms && styles.checkboxActive]}
            />
            <Text style={styles.helper}>
              I agree to the{" "}
              <Text
                style={styles.helperLink}
                onPress={(e) => { e.stopPropagation(); Linking.openURL("https://www.pregnantandblack.com/terms-conditions"); }}
              >Terms of Service</Text>
              {" & "}
              <Text
                style={styles.helperLink}
                onPress={(e) => { e.stopPropagation(); Linking.openURL("https://www.pregnantandblack.com/privacy-policy"); }}
              >Privacy Policy</Text>
            </Text>
          </Pressable>

          <Pressable
            style={styles.checkboxRow}
            onPress={() => setAgreedConsent((p) => !p)}
          >
            <View
              style={[styles.checkbox, agreedConsent && styles.checkboxActive]}
            />
            <Text style={styles.helper}>
              I confirm I am 18 or older and consent to platform communications
            </Text>
          </Pressable>
        </Card>

        <Button
          label="Finish Registration"
          disabled={!canSubmit}
          onPress={onFinish}
          variant="outline"
          style={styles.cta}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipActive]}
      hitSlop={6}
    >
      <Text style={[styles.chipText, selected && styles.chipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  scroll: { flex: 1, backgroundColor: colors.cream },

  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },

  disclaimer: {
    fontSize: 12,
    color: colors.warmGray,
    fontFamily: fonts.regular,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    textAlign: "center",
  },

  sectionHeader: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: fonts.bold,
    color: colors.coral,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  sectionCard: {
    backgroundColor: colors.cream,
    gap: spacing.sm,
  },

  helper: {
    fontSize: 12,
    color: colors.warmGray,
    fontFamily: fonts.regular,
    lineHeight: 16,
  },
  helperLink: {
    color: colors.coral,
    textDecorationLine: "underline",
    fontFamily: fonts.semiBold,
  },

  nameLabel: {
    fontSize: 14,
    fontFamily: fonts.semiBold,
    color: colors.charcoal,
    marginBottom: spacing.xs,
  },
  nameHint: {
    fontSize: 11,
    color: colors.warmGray,
    fontFamily: fonts.regular,
    marginBottom: spacing.sm,
  },

  input: {
    height: 44,
    marginBottom: spacing.md,
  },

  passwordInputWrap: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 44,
  },
  eyeButton: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    width: 24,
    justifyContent: "center",
    alignItems: "center",
    transform: [{ translateY: -6 }],
  },

  pillsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    flexWrap: "wrap",
    justifyContent: "center",
  },

  pill: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.cream,
  },

  pillActive: {
    borderColor: colors.coral,
    backgroundColor: colors.peach,
  },

  pillText: {
    color: colors.warmGray,
    fontWeight: "600",
    fontFamily: fonts.semiBold,
  },

  pillTextActive: {
    color: colors.charcoal,
  },

  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  chip: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.cream,
  },

  chipActive: {
    borderColor: colors.coral,
    backgroundColor: colors.coral,
  },

  chipText: {
    color: colors.warmGray,
    fontSize: 12,
    fontWeight: "600",
    fontFamily: fonts.semiBold,
  },

  chipTextActive: {
    color: colors.white,
  },

  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 4,
  },

  checkboxActive: {
    backgroundColor: colors.coral,
    borderColor: colors.coral,
  },

  cta: {
    marginTop: spacing.lg,
  },
});
