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
import { useNavigation } from "@react-navigation/native";

import { Card, NeuInput, Text } from "../../components/Ui";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabase";
import { colors, fonts, radius, spacing, typography } from "../../theme/theme";

const CONTACT_OPTIONS = ["Video", "Chat", "Audio Call"] as const;
type ContactOption = (typeof CONTACT_OPTIONS)[number];
const OPTIONAL_CONTACT_OPTIONS = CONTACT_OPTIONS.filter((opt) => opt !== "Chat");
function normalizeModalities(values: readonly string[]): ContactOption[] {
  return Array.from(
    new Set(
      values.filter((value): value is ContactOption =>
        CONTACT_OPTIONS.includes(value as ContactOption),
      ),
    ),
  );
}
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

function Chip({
  label,
  selected,
  disabled,
  onPress,
}: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.pill, selected && styles.pillOn]}
      hitSlop={8}
    >
      <Text
        bold={selected}
        style={[styles.pillText, selected && styles.pillTextOn]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function HcaProfile() {
  const navigation = useNavigation<any>();
  const [name, setName] = useState<string>("");
  const [photoPickerOpen, setPhotoPickerOpen] = useState(false);

  const { profile, updateProfile } = useAuth();

  const email = profile?.email ?? "";

  const [bio, setBio] = useState(profile?.hca?.bio ?? "");

  const [modalities, setModalities] = useState<ContactOption[]>(
    (profile?.hca?.modalitiesOffered as ContactOption[]) ?? ["Chat"],
  );

  useEffect(() => {
    setName(profile?.username ?? "");
    setBio(profile?.hca?.bio ?? "");
    setModalities(
      normalizeModalities([
        "Chat",
        ...((profile?.hca?.modalitiesOffered as ContactOption[]) ?? []),
      ]),
    );
  }, [profile?.username, profile?.hca?.bio, profile?.hca?.modalitiesOffered]);

  const initials = useMemo(() => {
    const u = profile?.username?.trim();
    return u ? u[0].toUpperCase() : "H";
  }, [profile?.username]);

  const selectedAvatarSource = useMemo(() => {
    const avatar = profile?.avatar_url?.trim() ?? "";
    const local = BABY_SIZE_AVATARS.find((x) => x.key === avatar);
    if (local) return local.source;
    if (avatar) return { uri: avatar };
    return null;
  }, [profile?.avatar_url]);

  const toggleModality = (m: ContactOption) => {
    const next = modalities.includes(m)
      ? modalities.filter((x) => x !== m)
      : [...modalities, m];
    const enforced = normalizeModalities(["Chat", ...next]);

    setModalities(enforced);
    updateProfile?.({
      hca: {
        bio: bio.trim() || undefined,
        languages: profile?.hca?.languages ?? [],
        modalitiesOffered: enforced as ContactOption[],
      },
    });
  };

  const onBlurName = () => {
    updateProfile?.({
      username: name.trim(),
    });
  };

  const onBlurBio = () => {
    updateProfile?.({
      hca: {
        bio: bio.trim() || undefined,
        languages: profile?.hca?.languages ?? [],
        modalitiesOffered: normalizeModalities(["Chat", ...modalities]),
      },
    });
  };

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

  // Prevent removing Chat modality.
  const canToggleModality = (m: ContactOption) =>
    !(m === "Chat" && modalities.includes("Chat"));

  const onPressModality = (m: ContactOption) => {
    if (!canToggleModality(m)) return;
    toggleModality(m);
  };

  const normalizedModalities = useMemo(
    () => normalizeModalities(["Chat", ...modalities]),
    [modalities],
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.cream }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar */}
      <Card style={styles.avatarCard}>
        <View style={styles.avatarBlock}>
        <View style={styles.avatarWrap}>
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
        <Pressable
          onPress={() => setPhotoPickerOpen(true)}
          style={styles.editPhotoRow}
        >
          <Ionicons name="pencil" size={14} color={colors.charcoal} />
          <Text style={styles.editPhotoText}>Edit Profile Photo</Text>
        </Pressable>
        </View>
      </Card>

      {/* Personal Info */}
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

        <Row label="Email">
          <Text style={styles.valueRight}>{email || "—"}</Text>
        </Row>

        <Row label="Password">
          <Pressable onPress={handleForgotPassword}>
            <Text style={[styles.valueRight, styles.linkText]}>
              Reset password
            </Text>
          </Pressable>
        </Row>
      </Card>

      {/* Professional Info */}
      <Card style={[styles.panel, { marginTop: spacing.lg }]}>
        <Text bold style={styles.panelTitle}>
          Professional
        </Text>

        <View style={styles.divider} />

        <Row label="Modalities">
          <View style={styles.prefsStack}>
            <Chip
              label="Chat (Required)"
              selected
              disabled
              onPress={() => {}}
            />

            <View style={styles.prefsOptionalRow}>
              {OPTIONAL_CONTACT_OPTIONS.map((opt) => (
                <Chip
                  key={opt}
                  label={opt}
                  selected={normalizedModalities.includes(opt)}
                  onPress={() => onPressModality(opt)}
                />
              ))}
            </View>
          </View>
        </Row>

        <View style={{ marginTop: spacing.md }}>
          <Text muted style={styles.labelLeft}>
            Bio
          </Text>
          <NeuInput
            value={bio}
            onChangeText={setBio}
            onBlur={onBlurBio}
            placeholder="A short bio patients will see…"
            placeholderTextColor={colors.warmGray}
            style={styles.bio}
            multiline
          />
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
  },

  avatarCard: {
    backgroundColor: colors.cream,
    marginBottom: spacing.lg,
  },
  avatarBlock: {
    alignItems: "center",
  },
  avatarWrap: {
    position: "relative",
  },
  avatarCircle: {
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: colors.gray200,
    borderWidth: 4,
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
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
  removePhotoBtn: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "2px 2px 6px rgba(0,0,0,0.14), -2px -2px 6px rgba(255,255,255,0.85)",
    elevation: 3,
  } as any,
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

  panel: {
    backgroundColor: colors.cream,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  panelTitle: {
    color: colors.coral,
    fontFamily: fonts.bold,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray200,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  labelLeft: {
    width: 150,
    ...typography.caption,
  },
  rightCol: {
    flex: 1,
    alignItems: "flex-end",
  },

  valueRight: {
    color: colors.charcoal,
  },

  linkText: {
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
    fontFamily: fonts.regular,
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
  pillText: {
    fontSize: 12,
    color: colors.warmGray,
  },
  pillTextOn: {
    color: colors.charcoal,
    fontFamily: fonts.semiBold,
  },

  bio: {
    marginTop: spacing.sm,
    minHeight: 100,
    paddingVertical: 10,
    textAlignVertical: "top",
    fontFamily: fonts.regular,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.md,
    maxHeight: "70%",
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
    gap: 10,
  },
  avatarTile: {
    width: "22%",
    aspectRatio: 1,
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
