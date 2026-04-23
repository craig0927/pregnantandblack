import { useHeaderHeight } from "@react-navigation/elements";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { isSessionOver, isSessionStarted } from "../../lib/sessionWindow";
import { format24To12, formatTimeInUserTimeZone } from "../../utils/time";

import { Button, Card, NeuInput, Text } from "../../components/Ui";
import { supabase } from "../../lib/supabase";
import { colors, fonts, radius, spacing } from "../../theme/theme";

type ChatStatus = "pending" | "active" | "ended" | "no-session";

type Props = {
  conversationId: string;
  viewerRole: "birthparent" | "hca" | "care_companion";
  title?: string;
  onBack?: () => void;
  chatEnabled?: boolean;
  sessionDate?: string;
  sessionStartTime?: string;
  hcaTimeZone?: string;
};

type Msg = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export default function ChatThread({
  conversationId,
  viewerRole,
  chatEnabled,
  sessionDate,
  sessionStartTime,
  hcaTimeZone,
}: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const headerHeight = useHeaderHeight();
  const channelNameRef = useRef(
    `messages:${conversationId}:${Math.random().toString(36).slice(2)}`,
  );

  const computeStatus = useCallback((): ChatStatus => {
    if (!sessionDate || !sessionStartTime) return "no-session";
    // TESTING: skip time window checks so chat is always active
    return "active";
    // if (isSessionOver(sessionDate, sessionStartTime, hcaTimeZone)) return "ended";
    // if (isSessionStarted(sessionDate, sessionStartTime, hcaTimeZone)) return "active";
    // return "pending";
  }, [sessionDate, sessionStartTime, hcaTimeZone]);

  const [chatStatus, setChatStatus] = useState<ChatStatus>(computeStatus);

  useEffect(() => {
    setChatStatus(computeStatus());
    const interval = setInterval(
      () => setChatStatus((prev) => { const next = computeStatus(); return prev === next ? prev : next; }),
      30_000,
    );
    return () => clearInterval(interval);
  }, [computeStatus]);

  const isInputEnabled =
    chatEnabled !== undefined
      ? chatEnabled
      : chatStatus === "active" || chatStatus === "no-session";

  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [myUid, setMyUid] = useState<string | null>(null);

  /** LOAD USER + MESSAGES */
  useEffect(() => {
    if (!conversationId) return;

    let alive = true;

    const load = async () => {
      try {
        const { data: userRes } = await supabase.auth.getUser();
        const uid = userRes.user?.id ?? null;
        if (!uid) return;

        setMyUid(uid);

        const { data, error } = await supabase
          .from("conversation_messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        if (!alive) return;

        if (error) {
          console.error("[Chat] load error", error);
          return;
        }

        setMessages(data ?? []);
      } catch (e) {
        console.error("[Chat] load error", e);
      }
    };

    load();

    return () => {
      alive = false;
    };
  }, [conversationId]);

  /** REALTIME */
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase.channel(channelNameRef.current);

    channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversation_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: any) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        },
      );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  /** SEND */
  const send = async () => {
    if (!isInputEnabled) return;
    if (!draft.trim() || !myUid) return;

    const body = draft.trim();
    const tempId = `tmp_${Date.now()}`;


    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        sender_id: myUid,
        body,
        created_at: new Date().toISOString(),
      },
    ]);

    setDraft("");

    try {
      const { data, error } = await supabase
        .from("conversation_messages")
        .insert({
          conversation_id: conversationId,
          sender_id: myUid,
          body,
        })
        .select()
        .single();

      if (error) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        return;
      }

      // Realtime may have already added the real message — deduplicate before replacing temp.
      setMessages((prev) => {
        const withoutReal = prev.filter((m) => m.id !== data.id);
        return withoutReal.map((m) => (m.id === tempId ? data : m));
      });
    } catch (e) {
      console.error("[Chat] send error", e);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.safe}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={headerHeight}
    >
      {chatStatus === "pending" && sessionStartTime && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Session starts at{" "}
            {hcaTimeZone && sessionDate
              ? formatTimeInUserTimeZone(
                  sessionDate,
                  sessionStartTime,
                  hcaTimeZone,
                  Intl.DateTimeFormat().resolvedOptions().timeZone,
                )
              : format24To12(sessionStartTime)}
          </Text>
        </View>
      )}

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
      >
        {chatStatus === "active" && messages.length === 0 && (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>Start the conversation!</Text>
          </View>
        )}

        {messages.map((m) => {
          const mine = m.sender_id === myUid;

          return (
            <View
              key={m.id}
              style={[styles.row, mine ? styles.rowRight : styles.rowLeft]}
            >
              <Card style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                <Text style={[mine && styles.textMine]}>{m.body}</Text>
              </Card>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.composer}>
        <NeuInput
          value={draft}
          onChangeText={setDraft}
          placeholder={
            chatStatus === "ended"
              ? "Session ended"
              : chatStatus === "pending"
              ? "Chat opens at session start"
              : "Message..."
          }
          placeholderTextColor={
            chatStatus === "ended" ? colors.gray400 : colors.muted
          }
          style={styles.input}
          multiline
          editable={isInputEnabled}
        />

        <Button
          onPress={send}
          label="Send"
          variant="outline"
          disabled={!isInputEnabled || !draft.trim()}
          style={styles.sendBtn}
          labelStyle={styles.sendBtnLabel}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  container: { padding: spacing.md },
  row: { flexDirection: "row", marginBottom: spacing.sm },
  rowLeft: { justifyContent: "flex-start" },
  rowRight: { justifyContent: "flex-end" },
  bubble: {
    maxWidth: "84%",
    padding: spacing.md,
    borderRadius: radius.lg,
  },
  mine: { backgroundColor: colors.charcoal, borderColor: colors.charcoal },
  theirs: { backgroundColor: colors.cream },
  textMine: { color: colors.white },
  banner: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: "center",
  },
  bannerText: {
    color: colors.warmGray,
    fontSize: 13,
    fontFamily: fonts.regular,
  },
  composer: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  input: {
    flex: 1,
    minHeight: 44,
    paddingTop: 12,
    paddingBottom: 12,
  },
  sendBtn: {
    height: 44,
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  sendBtnLabel: {
    fontSize: 15,
  },
});
