import { Ionicons } from "@expo/vector-icons";
import type { NavigationProp } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Image, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";

import { Card, Screen, Text } from "../../components/Ui";
import { useNotifications } from "../../hooks/useNotifications";
import {
  getConversationReadMap,
  markConversationRead,
} from "../../lib/messageReadStore";
import {
  isSessionExpiredAfterDays,
  isSessionOver,
} from "../../lib/sessionWindow";
import { supabase } from "../../lib/supabase";
import type { MessagesStackParamList } from "../../navigation/MessagesStack";
import { colors, fonts, neumorph, radius, spacing } from "../../theme/theme";

type Nav = NativeStackNavigationProp<MessagesStackParamList, "MessagesHome">;
type TabKey = "sessions" | "activity";

type Thread = {
  id: string;
  username: string;
  avatarUrl?: string | null;
  subtitle: string;
  lastMessageAt: string | null;
  unread: boolean;
  sessionOver: boolean;
};

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

function getAvatarSource(avatarUrl?: string | null) {
  const avatar = avatarUrl?.trim() ?? "";
  if (!avatar) return null;
  const local = BABY_SIZE_AVATARS.find((x) => x.key === avatar);
  if (local) return local.source;
  return { uri: avatar };
}

function truncatePreview(text: string, max = 70) {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}...`;
}

function buildActivityText(n: {
  type?: string | null;
  title?: string | null;
  body?: string | null;
  entity_type?: string | null;
  actor?: { username?: string | null } | null;
}) {
  const actor = n.actor?.username?.trim() || "Someone";
  const entity = String(n.entity_type ?? "").toLowerCase();
  const type = String(n.type ?? "").toLowerCase();
  const title = String(n.title ?? "").toLowerCase();
  const body = String(n.body ?? "").toLowerCase();
  const blob = `${type} ${title} ${body}`;

  if (
    entity === "appointment" &&
    (type === "request_session" ||
      type === "session_requested" ||
      type === "appointment_requested" ||
      title === "requested a session" ||
      title === "session requested" ||
      blob.includes("requested a session") ||
      blob.includes("session requested"))
  ) {
    return `${actor} requested a session`;
  }

  if (
    type === "reply" ||
    (entity === "comment" &&
      (title === "replied to your comment" ||
        blob.includes("replied to your comment")))
  ) {
    return `${actor} replied to your comment`;
  }

  if (
    entity === "post" &&
    type === "comment" &&
    (title === "commented on your post" ||
      blob.includes("commented on your post"))
  ) {
    return `${actor} commented on your post`;
  }

  if (type === "like") {
    if (
      entity === "comment" &&
      (title === "liked your comment" || blob.includes("liked your comment"))
    ) {
      return `${actor} liked your comment`;
    }
    if (
      entity === "post" &&
      (title === "liked your post" || blob.includes("liked your post"))
    ) {
      return `${actor} liked your post`;
    }
  }

  if (
    entity === "appointment" &&
    type === "session_confirmed" &&
    (title === "confirmed your session" ||
      blob.includes("confirmed your session"))
  ) {
    return `${actor} confirmed your session`;
  }

  if (
    entity === "appointment" &&
    (type === "session_declined" || type === "session_rejected") &&
    (blob.includes("declined") || blob.includes("rejected"))
  ) {
    return `${actor} declined session`;
  }

  if (entity === "appointment" && type === "session_cancelled") {
    return `${actor} cancelled a session`;
  }

  if (entity === "appointment" && type === "session_rescheduled") {
    return `${actor} rescheduled a session`;
  }

  return null;
}

function formatCardTimestamp(ts: string) {
  return new Date(ts).toLocaleString(undefined, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function Messages() {
  const navigation = useNavigation<Nav>();
  const [activeTab, setActiveTab] = useState<TabKey>("sessions");
  const [tabRowWidth, setTabRowWidth] = useState(0);
  const sliderAnim = useRef(new Animated.Value(0)).current;
  const channelNameRef = useRef(
    `conversation-updates:${Math.random().toString(36).slice(2)}`,
  );
  const [userId, setUserId] = useState<string | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const aliveRef = useRef(true);
  useEffect(() => { return () => { aliveRef.current = false; }; }, []);
  const { notifications, markNotificationRead, refreshNotifications } =
    useNotifications(userId);

  const activity = useMemo(
    () =>
      notifications.filter((n) => {
        const t = String(n.type ?? "").toLowerCase();
        const e = String(n.entity_type ?? "").toLowerCase();
        const title = String(n.title ?? "").toLowerCase();
        const label = buildActivityText(n);

        // Exclude old-style generic notifications — all real events now have explicit types.
        if (t === "activity" || title === "new activity") return false;
        if (!label) return false;

        // Keep activity focused on forum + session state updates.
        const forumActivity =
          (t === "comment" && e === "post") ||
          (t === "reply" && e === "comment") ||
          (t === "like" && (e === "post" || e === "comment"));
        const sessionActivity = e === "appointment";

        if (!(forumActivity || sessionActivity)) return false;

        // Remove read activity items after 7 days.
        if (n.read) {
          const created = new Date(n.created_at).getTime();
          const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
          if (Number.isFinite(created) && created < cutoff) return false;
        }

        return true;
      }),
    [notifications],
  );
  const unreadActivityCount = useMemo(
    () => activity.filter((n) => !n.read).length,
    [activity],
  );
  const unreadSessionCount = useMemo(
    () => threads.filter((t) => t.unread).length,
    [threads],
  );

  const load = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id;
      if (!uid || !aliveRef.current) return;
      setUserId(uid);

      const { data: rows, error } = await supabase
        .from("conversations")
        .select(
          `
        id,
        user_id,
        hca_id,
        appointment_id,
        created_at,
        appointment:appointments!conversations_appointment_id_fkey(date, start_time),
        profiles_user:profiles!conversations_user_id_fkey(username, preferred_name, avatar_url),
        profiles_hca:profiles!conversations_hca_id_fkey(username, preferred_name, avatar_url)
      `,
        )
        .or(`user_id.eq.${uid},hca_id.eq.${uid}`)
        .order("created_at", { ascending: false });

      if (!aliveRef.current || error) {
        if (error) console.error("Messages load error", error);
        return;
      }

      const conversationIds = (rows ?? []).map((r: any) => r.id);
      const latestByConversation = new Map<
        string,
        { body: string; created_at: string; sender_id: string | null }
      >();
      const readMap = await getConversationReadMap();

      if (conversationIds.length > 0) {
        const { data: msgs, error: msgErr } = await supabase
          .from("conversation_messages")
          .select("conversation_id, body, created_at, sender_id")
          .in("conversation_id", conversationIds)
          .order("created_at", { ascending: false });

        if (msgErr) {
          console.error("Messages preview load error", msgErr);
        } else {
          for (const m of msgs ?? []) {
            const cid = String((m as any).conversation_id ?? "");
            if (!cid || latestByConversation.has(cid)) continue;
            const body = String((m as any).body ?? "").trim();
            latestByConversation.set(cid, {
              body,
              created_at: String((m as any).created_at ?? ""),
              sender_id: (m as any).sender_id ?? null,
            });
          }
        }
      }

      const mapped =
        rows
          ?.map((row: any): Thread | null => {
            const appointment = Array.isArray(row.appointment)
              ? row.appointment[0]
              : row.appointment;
            const apptDate = appointment?.date;
            const apptStart = appointment?.start_time;
            // TESTING: don't hide expired conversations
            // if (apptDate && apptStart && isSessionExpiredAfterDays(apptDate, apptStart, 7)) {
            //   return null;
            // }

            const isUser = row.user_id === uid;
            const latest = latestByConversation.get(row.id);
            const preview = latest?.body;
            const readAt = readMap[row.id];
            // TESTING: always show session as active
            const sessionOver = false;
            // apptDate && apptStart ? isSessionOver(apptDate, apptStart) : false;
            const unread = Boolean(
              latest?.created_at &&
              latest?.sender_id &&
              latest.sender_id !== uid &&
              (!readAt ||
                new Date(latest.created_at).getTime() >
                  new Date(readAt).getTime()),
            );

            return {
              id: row.id,
              username: isUser
                ? (row.profiles_hca?.preferred_name || row.profiles_hca?.username || "Health Care Advocate")
                : (row.profiles_user?.preferred_name || row.profiles_user?.username || "User"),
              avatarUrl: isUser
                ? (row.profiles_hca?.avatar_url ?? null)
                : (row.profiles_user?.avatar_url ?? null),
              subtitle: preview
                ? truncatePreview(preview)
                : "No messages yet",
              lastMessageAt: latest?.created_at ?? null,
              unread,
              sessionOver,
            };
          })
          .filter((row): row is Thread => row !== null) ?? [];

      setThreads(mapped);
    } catch (e) {
      console.error("[Messages] load error", e);
    }
  }, []);

  useEffect(() => {
    load();

    const channel = supabase.channel(channelNameRef.current);

    channel
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversation_messages" },
        () => load(),
      );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([load(), refreshNotifications()]);
    } finally {
      setRefreshing(false);
    }
  }, [load, refreshNotifications]);

  const openActivity = async (n: (typeof notifications)[number]) => {
    try {
      await markNotificationRead(n);

      const parent = navigation.getParent<NavigationProp<any>>();
      const entityType = String(n.entity_type ?? "").toLowerCase();
      const type = String(n.type ?? "").toLowerCase();
      const routeNames = parent?.getState()?.routeNames ?? [];
      const communityTabName = routeNames.includes("Community")
        ? "Community"
        : routeNames.includes("Forum")
          ? "Forum"
          : "Community";
      const dashboardTabName = routeNames.includes("Dashboard")
        ? "Dashboard"
        : routeNames.includes("Resources")
          ? "Resources"
          : null;

      if (entityType === "appointment" || type.includes("session")) {
        if (dashboardTabName === "Dashboard") {
          parent?.navigate({
            name: "Dashboard",
            params: { screen: "HcaDashboardHome" },
          });
        } else {
          parent?.navigate({
            name: "Schedule",
            params: { screen: "Appointments" },
          });
        }
        return;
      }

      if (entityType === "conversation") {
        if (!n.entity_id) return;
        navigation.navigate("UserChat", {
          conversationId: n.entity_id,
          name: n.actor?.username ?? "User",
        });
        return;
      }

      // Forum activity deep-link
      let postId =
        (n.post_id && String(n.post_id)) ||
        (entityType === "post" ? String(n.entity_id) : "");
      let commentId: string | undefined =
        entityType === "comment" && n.entity_id
          ? String(n.entity_id)
          : undefined;

      // Resolve parent post when notification carries comment entity_id.
      if (!postId && entityType === "comment" && n.entity_id) {
        const { data: commentRow } = await supabase
          .from("forum_comments")
          .select("post_id")
          .eq("id", n.entity_id)
          .maybeSingle();

        postId = String((commentRow as any)?.post_id ?? "");
      }

      // For "commented on your post" notifications where entity_type="post",
      // look up the actor's comment on that post so we can highlight it.
      if (!commentId && entityType === "post" && (type === "comment" || type === "reply" || type === "like") && n.entity_id && n.actor_id) {
        const { data: commentRow } = await supabase
          .from("forum_comments")
          .select("id")
          .eq("post_id", n.entity_id)
          .eq("user_id", n.actor_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (commentRow?.id) commentId = String(commentRow.id);
      }

      if (postId) {
        parent?.navigate({
          name: communityTabName,
          params: {
            screen: "ForumPostDetail",
            params: {
              postId,
              title: n.title || "Community Post",
              ...(commentId ? { commentId } : {}),
            },
          },
        });
        return;
      }

      // Fallback to community home.
      parent?.navigate({
        name: communityTabName,
        params: { screen: "ForumHome" },
      });
    } catch (e) {
      console.error("[Messages] openActivity error", e);
    }
  };

  return (
    <Screen style={{ paddingTop: spacing.md }}>
      <View
        style={styles.pillRow}
        onLayout={(e) => setTabRowWidth(e.nativeEvent.layout.width)}
      >
        {tabRowWidth > 0 && (
          <Animated.View
            style={[
              styles.pillSlider,
              {
                width: (tabRowWidth - 8) / 2,
                transform: [
                  {
                    translateX: sliderAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, (tabRowWidth - 8) / 2],
                    }),
                  },
                ],
              },
            ]}
          />

        )}
        {(["sessions", "activity"] as TabKey[]).map((key, i) => {
          const isActive = activeTab === key;
          const hasUnread =
            key === "sessions"
              ? unreadSessionCount > 0
              : unreadActivityCount > 0;
          return (
            <Pressable
              key={key}
              style={styles.pill}
              onPress={() => {
                setActiveTab(key);
                Animated.timing(sliderAnim, {
                  toValue: i,
                  duration: 300,
                  useNativeDriver: true,
                  easing: (t) =>
                    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
                }).start();
              }}
            >
              <View style={styles.pillLabelRow}>
                <Text
                  style={[styles.pillText, isActive && styles.pillTextActive]}
                >
                  {key === "sessions" ? "Sessions" : "Activity"}
                </Text>
                {hasUnread && <View style={styles.pillUnreadDot} />}
              </View>
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === "sessions" ? (
          threads.length === 0 ? (
            <Card style={styles.threadCard}>
              <Text muted>No messages yet.</Text>
            </Card>
          ) : (
            threads.map((t) => (
              <Pressable
                key={t.id}
                style={styles.cardPressable}
                onPress={async () => {
                  await markConversationRead(
                    t.id,
                    t.lastMessageAt ?? new Date().toISOString(),
                  );
                  setThreads((prev) =>
                    prev.map((x) =>
                      x.id === t.id ? { ...x, unread: false } : x,
                    ),
                  );

                  navigation.navigate("UserChat", {
                    conversationId: t.id,
                    name: t.username,
                  });
                }}
              >
                <Card style={styles.threadCard}>
                  <View style={styles.row}>
                    <View style={styles.avatarWrap}>
                      {getAvatarSource(t.avatarUrl) ? (
                        <Image
                          source={getAvatarSource(t.avatarUrl)!}
                          style={styles.avatarImage}
                        />
                      ) : (
                        <Ionicons
                          name="person"
                          size={18}
                          color={colors.warmGray}
                        />
                      )}
                    </View>

                    <View style={styles.textBlock}>
                      <Text bold numberOfLines={1}>
                        {t.username}
                      </Text>
                      <Text muted numberOfLines={1}>
                        {t.subtitle}
                      </Text>
                      {t.sessionOver ? (
                        <Text muted style={{ marginTop: 2, fontSize: 12 }}>
                          Session ended
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  {t.unread ? <View style={styles.unreadDotTopRight} /> : null}
                </Card>
              </Pressable>
            ))
          )
        ) : activity.length === 0 ? (
          <Card style={styles.threadCard}>
            <Text muted>No activity yet.</Text>
          </Card>
        ) : (
          activity.map((n) => (
            <Pressable
              key={n.id}
              style={styles.cardPressable}
              onPress={() => openActivity(n)}
            >
              <Card style={[styles.threadCard, styles.activityCard]}>
                <View style={styles.row}>
                  <View style={styles.avatarWrap}>
                    {getAvatarSource(n.actor?.avatar_url) ? (
                      <Image
                        source={getAvatarSource(n.actor?.avatar_url)!}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <Ionicons
                        name="notifications-outline"
                        size={18}
                        color={colors.warmGray}
                      />
                    )}
                  </View>

                  <View style={styles.textBlock}>
                    <Text bold numberOfLines={1}>
                      {buildActivityText(n)}
                    </Text>
                    {!!n.body && (
                      <Text muted numberOfLines={2}>
                        {n.body}
                      </Text>
                    )}
                    <Text muted style={{ marginTop: 2, fontSize: 12 }}>
                      {formatCardTimestamp(n.created_at)}
                    </Text>
                  </View>
                </View>
                {!n.read ? <View style={styles.unreadDotTopRight} /> : null}
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pillRow: {
    flexDirection: "row",
    backgroundColor: neumorph.bg,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.md,
    marginHorizontal: 2,
    // raised: dark shadow bottom-right
    shadowColor: "#888888",
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.55,
    shadowRadius: 7,
    elevation: 6,
  },
  pill: {
    flex: 1,
    borderRadius: radius.sm,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    zIndex: 1,
  },
  pillLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pillSlider: {
    position: "absolute",
    top: 4,
    left: 4,
    bottom: 4,
    borderRadius: radius.sm,
    backgroundColor: neumorph.bg,
    // native inset shadow (RN 0.76+)
    boxShadow: "inset 3px 3px 5px rgba(0,0,0,0.18), inset -3px -3px 5px rgba(255,255,255,0.7)",
    elevation: 0,
    shadowOpacity: 0,
  } as any,
  pillActive: {},
  pillText: {
    color: colors.warmGray,
    fontWeight: "500",
    fontSize: 13,
    fontFamily: fonts.medium,
  },
  pillTextActive: {
    color: colors.coral,
    fontWeight: "600",
    fontFamily: fonts.semiBold,
  },
  pillUnreadDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.coral,
  },
  threadCard: {
    position: "relative",
    paddingRight: spacing.xl,
  },
  activityCard: {
    position: "relative",
  },
  cardPressable: {
    marginBottom: spacing.md,
  },
  list: {
    flex: 1,
    overflow: "visible",
  },
  listContent: {
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xl,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
  },
  avatarWrap: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: colors.gray200,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
  },
  unreadDotTopRight: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.coral,
  },
});
