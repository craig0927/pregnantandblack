import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { Card, Text } from "../../components/Ui";
import { supabase } from "../../lib/supabase";
import type { HcaMessagesStackParamList } from "../../navigation/HcaMessagesStack";
import { colors, fonts, radius, spacing, typography } from "../../theme/theme";

type Props = NativeStackScreenProps<
  HcaMessagesStackParamList,
  "MessagesHome"
>;

type Thread = {
  id: string;
  userName: string;
  lastMessage: string;
  time: string;
};

export default function HcaMessages({ navigation }: Props) {
  const [query, setQuery] = useState("");
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) return;

    const res = await supabase
      .from("conversations")
      .select(`
        id, updated_at, is_closed, kind,
        profiles_user:profiles!conversations_user_id_fkey(username)
      `)
      .eq("hca_id", uid)
      .order("created_at", { ascending: false });

    if (res.error) {
      console.error("HCA messages load error", res.error);
      setLoading(false);
      return;
    }

    setThreads(
      (res.data ?? []).map((c: any) => {
        const userProfile = Array.isArray(c.profiles_user)
          ? c.profiles_user[0]
          : c.profiles_user;
        return {
          id: c.id,
          userName: userProfile?.username ?? "User",
          lastMessage: c.is_closed ? "Chat closed" : "Open conversation",
          time: "",
        };
      }),
    );

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const filteredThreads = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return threads;

    return threads.filter((t) =>
      `${t.userName} ${t.lastMessage}`.toLowerCase().includes(q),
    );
  }, [query, threads]);

  const openThread = (thread: Thread) => {
    navigation.navigate("UserChat", {
      conversationId: thread.id,
      name: thread.userName,
    });
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.cream }}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.searchWrap}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search messages"
          style={styles.search}
          placeholderTextColor={colors.warmGray}
        />
      </View>

      <View style={{ marginTop: spacing.md }}>
        {loading ? (
          <Card style={styles.cardGap}>
            <Text muted>Loading conversations…</Text>
          </Card>
        ) : filteredThreads.length === 0 ? (
          <Card style={styles.cardGap}>
            <Text muted>No conversations yet.</Text>
          </Card>
        ) : (
          filteredThreads.map((t) => (
            <Pressable key={t.id} onPress={() => openThread(t)}>
              <Card style={[styles.definedCard, styles.threadCard]}>
                <View style={styles.threadTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text bold>{t.userName}</Text>
                    <Text muted style={{ marginTop: 2 }} numberOfLines={1}>
                      {t.lastMessage}
                    </Text>
                  </View>
                  <Text muted style={styles.timeText}>
                    {t.time}
                  </Text>
                </View>
              </Card>
            </Pressable>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md },
  searchWrap: {},
  search: {
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.md,
    fontFamily: fonts.regular,
  },
  definedCard: { borderWidth: 1, borderColor: colors.gray200 },
  cardGap: { marginTop: spacing.md, padding: spacing.md },
  threadCard: { marginTop: spacing.md, padding: spacing.md },
  threadTopRow: { flexDirection: "row", justifyContent: "space-between" },
  timeText: { ...typography.caption, fontFamily: fonts.regular },
});
