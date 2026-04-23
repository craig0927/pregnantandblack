import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { Card, Text } from "../../components/Ui";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { colors, fonts, radius, spacing, typography } from "../../theme/theme";

import { useNavigation } from "@react-navigation/native";

const CONTACT_OPTIONS = ["Video", "Chat", "Audio Call"] as const;
type ContactOption = (typeof CONTACT_OPTIONS)[number];
const OPTIONAL_CONTACT_OPTIONS = CONTACT_OPTIONS.filter((opt) => opt !== "Chat");
const BABY_SIZE_AVATARS = [
  {
    key: "babySize/apple-pixabay.jpg",
    source: require("../../../assets/babySize/apple-pixabay.jpg"),
  },
  {
    key: "babySize/avocado-thought-catalog.jpg",
    source: require("../../../assets/babySize/avocado-thought-catalog.jpg"),
  },
  {
    key: "babySize/banana-shvets.jpg",
    source: require("../../../assets/babySize/banana-shvets.jpg"),
  },
  {
    key: "babySize/blueberry-fotios.jpg",
    source: require("../../../assets/babySize/blueberry-fotios.jpg"),
  },
  {
    key: "babySize/cabbage-ellie-burgin.jpg",
    source: require("../../../assets/babySize/cabbage-ellie-burgin.jpg"),
  },
  {
    key: "babySize/coconut-cottonbro.jpg",
    source: require("../../../assets/babySize/coconut-cottonbro.jpg"),
  },
  {
    key: "babySize/grape-gilmerdiaz.jpg",
    source: require("../../../assets/babySize/grape-gilmerdiaz.jpg"),
  },
  {
    key: "babySize/lemon-goumbik.jpg",
    source: require("../../../assets/babySize/lemon-goumbik.jpg"),
  },
  {
    key: "babySize/lime-farlight.jpg",
    source: require("../../../assets/babySize/lime-farlight.jpg"),
  },
  {
    key: "babySize/mango-rcwired.jpg",
    source: require("../../../assets/babySize/mango-rcwired.jpg"),
  },
  {
    key: "babySize/peach-laker.jpg",
    source: require("../../../assets/babySize/peach-laker.jpg"),
  },
  {
    key: "babySize/pineapple-psco.jpg",
    source: require("../../../assets/babySize/pineapple-psco.jpg"),
  },
  {
    key: "babySize/sesame-cottonbro.jpg",
    source: require("../../../assets/babySize/sesame-cottonbro.jpg"),
  },
  {
    key: "babySize/strawberry-nietjuhart.jpg",
    source: require("../../../assets/babySize/strawberry-nietjuhart.jpg"),
  },
  {
    key: "babySize/watermelon-pixabay.jpg",
    source: require("../../../assets/babySize/watermelon-pixabay.jpg"),
  },
] as const;

function isContactOption(value: unknown): value is ContactOption {
  return CONTACT_OPTIONS.includes(value as ContactOption);
}

/**
 * Enforces:
 * - Only valid ContactOption values
 * - Always includes "Chat"
 */
function sanitizeContactPrefs(raw: unknown): ContactOption[] {
  if (!Array.isArray(raw)) return ["Chat"];

  const filtered = raw.filter(isContactOption);

  return Array.from(new Set<ContactOption>(["Chat", ...filtered]));
}

export default function Profile() {
  const { profile, updateProfile } = useAuth();
  const navigation = useNavigation<any>();

  const [name, setName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastInit, setLastInit] = useState("");
  const [contactPrefs, setContactPrefs] = useState<ContactOption[]>(["Chat"]);
  const [photoPickerOpen, setPhotoPickerOpen] = useState(false);

  // 🔄 Hydrate from profile
  useEffect(() => {
    setName(profile?.username ?? "");
    setFirstName(profile?.preferredName ?? "");
    setLastInit(profile?.lastInitial ?? "");
    setContactPrefs(sanitizeContactPrefs(profile?.contactPreferences));
  }, [profile?.username, profile?.preferredName, profile?.lastInitial, profile?.contactPreferences]);

  const email = profile?.email ?? "";

  const togglePref = (opt: ContactOption) => {
    if (opt === "Chat") return;

    const next = contactPrefs.includes(opt)
      ? contactPrefs.filter((x) => x !== opt)
      : [...contactPrefs, opt];

    const enforced = sanitizeContactPrefs(next);

    setContactPrefs(enforced);

    updateProfile?.({
      contactPreferences: enforced,
    });
  };

  const toggleSupportNeed = (opt: string) => {
    const current = profile?.questionnaire?.supportNeeds ?? [];

    const next = current.includes(opt)
      ? current.filter((x) => x !== opt)
      : [...current, opt];

    updateProfile?.({
      questionnaire: {
        ...(profile?.questionnaire ?? {}),
        supportNeeds: next,
      },
    });
  };

  const onBlurName = () => {
    updateProfile?.({ username: name.trim() });
  };

  const onBlurFirstName = () => {
    updateProfile?.({ preferredName: firstName.trim() });
  };

  const onBlurLastInit = () => {
    updateProfile?.({ lastInitial: lastInit.trim() });
  };

  const initials = useMemo(() => {
    const pn = profile?.preferredName?.trim();
    if (pn) return pn[0].toUpperCase();
    const u = profile?.username?.trim();
    return u ? u[0].toUpperCase() : "P";
  }, [profile?.preferredName, profile?.username]);

  const selectedAvatarSource = useMemo(() => {
    const avatar = profile?.avatar_url?.trim() ?? "";
    const local = BABY_SIZE_AVATARS.find((x) => x.key === avatar);
    if (local) return local.source;
    if (avatar) return { uri: avatar };
    return null;
  }, [profile?.avatar_url]);

  const selectProfilePhoto = async (avatarKey: string) => {
    try {
      await updateProfile?.({ avatar_url: avatarKey });
      setPhotoPickerOpen(false);
    } catch (e: any) {
      Alert.alert("Unable to update photo", e?.message ?? "Please try again.");
    }
  };

  const removeProfilePhoto = async () => {
    try {
      await updateProfile?.({ avatar_url: null as any });
    } catch (e: any) {
      Alert.alert("Unable to remove photo", e?.message ?? "Please try again.");
    }
  };

  const handleForgotPassword = async () => {
    const cleanEmail = email?.trim();

    if (!cleanEmail) {
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
      Alert.alert("Network error", "Unable to send reset email. Please try again.");
      return;
    }

    Alert.alert(
      "Check your email",
      "Enter the code from your email to reset your password.",
    );
    navigation.navigate("ResetPassword", { email: cleanEmail });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar */}
      <Card style={styles.avatarCard}>
        <View style={styles.avatarBlock}>
          <View style={styles.avatarShell}>
            <View style={styles.avatarCircle}>
              {selectedAvatarSource ? (
                <Image source={selectedAvatarSource} style={styles.avatarImage} />
              ) : (
                <Text bold style={styles.avatarInitials}>
                  {initials}
                </Text>
              )}
            </View>

            {selectedAvatarSource ? (
              <Pressable
                onPress={removeProfilePhoto}
                style={styles.removePhotoBtn}
                hitSlop={8}
              >
                <Ionicons name="close" size={14} color={colors.charcoal} />
              </Pressable>
            ) : null}
          </View>

          <Pressable onPress={() => setPhotoPickerOpen(true)} style={styles.editPhotoRow}>
            <Ionicons name="pencil" size={14} color={colors.charcoal} />
            <Text style={styles.editPhotoText}>Edit Profile Photo</Text>
          </Pressable>
        </View>
      </Card>

      <Card style={styles.panel}>
        <Text bold style={styles.panelTitle}>
          Personal Information
        </Text>

        <View style={styles.divider} />

        <Row label="Username">
          <TextInput
            value={name}
            onChangeText={setName}
            onBlur={onBlurName}
            placeholder="Your username"
            placeholderTextColor={colors.warmGray}
            style={styles.inputRight}
            returnKeyType="done"
          />
        </Row>

        <Row label="First Name">
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            onBlur={onBlurFirstName}
            placeholder="What should we call you?"
            placeholderTextColor={colors.warmGray}
            style={styles.inputRight}
            returnKeyType="done"
            autoCapitalize="words"
          />
        </Row>

        <Row label="Last Initial">
          <TextInput
            value={lastInit}
            onChangeText={(t) => setLastInit(t.slice(0, 1).toUpperCase())}
            onBlur={onBlurLastInit}
            placeholder="Optional"
            placeholderTextColor={colors.warmGray}
            style={styles.inputRight}
            returnKeyType="done"
            maxLength={1}
            autoCapitalize="characters"
          />
        </Row>

        <Row label="Email">
          <Text style={styles.valueRight}>{email || "—"}</Text>
        </Row>

        <Row label="Password">
          <Pressable onPress={handleForgotPassword}>
            <Text style={[styles.valueRight, styles.linkRight]}>
              Reset password
            </Text>
          </Pressable>
        </Row>

        {/* Contact Preferences */}
        <Row label="Contact Preferences">
          <View style={styles.prefsStack}>
            <Pressable disabled style={[styles.pill, styles.requiredPill, styles.pillOn]}>
              <Text bold style={[styles.pillText, styles.pillTextOn]}>
                Chat (Required)
              </Text>
            </Pressable>

            <View style={styles.prefsOptionalRow}>
              {OPTIONAL_CONTACT_OPTIONS.map((opt) => {
                const selected = contactPrefs.includes(opt);

                return (
                  <Pressable
                    key={opt}
                    onPress={() => togglePref(opt)}
                    style={[styles.pill, selected && styles.pillOn]}
                  >
                    <Text
                      bold={selected}
                      style={[styles.pillText, selected && styles.pillTextOn]}
                    >
                      {opt}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Row>

        {/* Support Needs */}
        <View style={{ marginTop: spacing.lg }}>
          <Text muted style={[styles.labelLeft, { marginBottom: spacing.sm }]}>
            Support Needs
          </Text>

          <View style={styles.prefsWrap}>
            {[
              "Understanding symptoms",
              "Navigating appointments / what to ask",
              "Finding an advocate",
            ].map((opt) => {
              const selected =
                profile?.questionnaire?.supportNeeds?.includes(opt);

              return (
                <Pressable
                  key={opt}
                  onPress={() => toggleSupportNeed(opt)}
                  style={[styles.pill, selected && styles.pillOn]}
                >
                  <Text
                    bold={selected}
                    style={[styles.pillText, selected && styles.pillTextOn]}
                  >
                    {opt}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Card>

      <View style={{ height: spacing.xl }} />

      <Modal
        visible={photoPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoPickerOpen(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setPhotoPickerOpen(false)}
        >
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text bold>Choose Profile Photo</Text>
              <Pressable onPress={() => setPhotoPickerOpen(false)}>
                <Text muted>Close</Text>
              </Pressable>
            </View>

            <View style={styles.avatarGrid}>
              {BABY_SIZE_AVATARS.map((item) => {
                const selected = profile?.avatar_url === item.key;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => selectProfilePhoto(item.key)}
                    style={[styles.avatarTile, selected && styles.avatarTileSelected]}
                  >
                    <Image source={item.source} style={styles.avatarTileImage} />
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <Text muted style={styles.labelLeft}>
        {label}
      </Text>
      <View style={styles.rightCol}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    backgroundColor: colors.cream,
  },

  avatarBlock: {
    alignItems: "center",
  },
  avatarCard: {
    marginBottom: spacing.lg,
    backgroundColor: colors.cream,
    alignItems: "center",
  },
  avatarShell: {
    position: "relative",
  },

  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 999,
    borderWidth: 4,
    borderColor: colors.white,
    backgroundColor: colors.gray200,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  avatarInitials: {
    fontSize: 40,
    color: colors.warmGray,
    fontFamily: fonts.bold,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
  },

  editPhotoRow: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  editPhotoText: {
    color: colors.charcoal,
    ...typography.body,
    fontFamily: fonts.medium,
  },
  removePhotoBtn: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  panel: {
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    padding: spacing.md,
  },

  panelTitle: { color: colors.coral },

  divider: {
    height: 1,
    backgroundColor: colors.gray200,
    marginVertical: spacing.md,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },

  labelLeft: {
    width: 150,
    ...typography.caption,
    fontFamily: fonts.regular,
  },

  rightCol: {
    flex: 1,
    alignItems: "flex-end",
  },

  valueRight: { color: colors.charcoal },

  linkRight: {
    color: colors.charcoal,
    textDecorationLine: "underline",
  },

  inputRight: {
    minWidth: 160,
    textAlign: "right",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: radius.md,
    color: colors.charcoal,
    backgroundColor: colors.cream,
    boxShadow: "inset 3px 3px 5px rgba(0,0,0,0.18), inset -3px -3px 5px rgba(255,255,255,0.7)",
  } as any,


  prefsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 8,
  },

  prefsStack: {
    alignItems: "flex-end",
    gap: 8,
  },

  prefsOptionalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },

  pill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.cream,
  },

  pillOn: {
    borderColor: colors.charcoal,
    backgroundColor: colors.gray100,
  },

  requiredPill: {
    opacity: 0.9,
  },

  pillText: {
    fontSize: 12,
    color: colors.warmGray,
    fontFamily: fonts.medium,
  },

  pillTextOn: { color: colors.charcoal },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.md,
    maxHeight: "75%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  avatarTile: {
    width: 72,
    height: 72,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  avatarTileSelected: {
    borderColor: colors.charcoal,
    borderWidth: 2,
  },
  avatarTileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
  },
});
