import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Alert, Linking, Pressable, View } from "react-native";

import { computeSessionPermissions } from "../lib/sessionPermissions";
import { setLatestSessionError } from "../lib/sessionErrorStore";
import { supabase } from "../lib/supabase";
import { colors, spacing } from "../theme/theme";

export function SessionHeaderActions({
  conversationId,
}: {
  conversationId: string;
}) {
  const [sessionOver, setSessionOver] = useState(false);
  const [phoneEnabled, setPhoneEnabled] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      const { data } = await supabase
        .from("appointments")
        .select("date, start_time, status, user_id, hca_id")
        .eq("conversation_id", conversationId)
        .maybeSingle();

      if (!alive) return;

      if (data?.date && data?.start_time) {
        setSessionOver(false); // TESTING: isSessionOver(data.date, data.start_time)

        const userId = data.user_id ? String(data.user_id) : "";
        const hcaId = data.hca_id ? String(data.hca_id) : "";
        if (!userId || !hcaId) {
          setPhoneEnabled(false);
          setVideoEnabled(false);
          return;
        }

        const { data: profileRows } = await supabase
          .from("profiles")
          .select("id, contact_preferences, hca")
          .in("id", [userId, hcaId]);

        if (!alive) return;

        const userProfile = (profileRows ?? []).find((p: any) => p.id === userId);
        const hcaProfile = (profileRows ?? []).find((p: any) => p.id === hcaId);

        const userPrefs = (userProfile as any)?.contact_preferences ?? [];
        const hcaPrefs =
          (hcaProfile as any)?.hca?.modalitiesOffered ??
          (hcaProfile as any)?.contact_preferences ??
          [];

        const perms = computeSessionPermissions(
          userPrefs,
          hcaPrefs,
          String(data.date),
          String(data.start_time).slice(0, 5),
          data.status ?? null,
        );

        setPhoneEnabled(Boolean(perms.phoneEnabled));
        setVideoEnabled(Boolean(perms.videoEnabled));
      } else {
        setSessionOver(false);
        setPhoneEnabled(false);
        setVideoEnabled(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [conversationId]);

  const openMeet = async (type: "call" | "video") => {
    const blocked =
      sessionOver || (type === "call" ? !phoneEnabled : !videoEnabled);
    if (blocked) {
      Alert.alert(
        "Unavailable",
        `${
          type === "call" ? "Audio Call" : "Video"
        } is only available when both parties selected it for this active session.`,
      );
      return;
    }

    try {
      const { data, error } = await supabase
        .from("appointments")
        .select("meet_link")
        .eq("conversation_id", conversationId)
        .single();

      if (error || !data?.meet_link) {
        await setLatestSessionError(
          `Session ${type} failed: no meeting link found for this session.`,
        );
        Alert.alert(
          type === "call" ? "Unable to call" : "Unable to start video",
          "No meeting link found for this session.",
        );
        return;
      }

      const meetLink = data.meet_link;
      Alert.alert(
        type === "call" ? "Starting call" : "Starting video",
        "You'll be redirected to join the Jitsi meeting in your browser. You may turn off your camera prior to joining.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Continue",
            onPress: () => Linking.openURL(meetLink),
          },
        ],
      );
    } catch (e: any) {
      await setLatestSessionError(
        `Session ${type} failed: ${e?.message ?? "Unknown error"}`,
      );
      Alert.alert(
        type === "call" ? "Unable to call" : "Unable to start video",
        "Please try again.",
      );
    }
  };

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.xs,
        marginRight: spacing.sm,
      }}
    >
      <Pressable
        onPress={() => openMeet("call")}
        disabled={sessionOver || !phoneEnabled}
        style={{
          width: 32,
          height: 36,
          justifyContent: "center",
          alignItems: "center",
          opacity: sessionOver || !phoneEnabled ? 0.4 : 1,
        }}
      >
        <Ionicons
          name="call-outline"
          size={22}
          color={sessionOver || !phoneEnabled ? colors.warmGray : colors.charcoal}
        />
      </Pressable>

      <Pressable
        onPress={() => openMeet("video")}
        disabled={sessionOver || !videoEnabled}
        style={{
          width: 32,
          height: 36,
          justifyContent: "center",
          alignItems: "center",
          opacity: sessionOver || !videoEnabled ? 0.4 : 1,
        }}
      >
        <Ionicons
          name="videocam-outline"
          size={22}
          color={sessionOver || !videoEnabled ? colors.warmGray : colors.charcoal}
        />
      </Pressable>
    </View>
  );
}
