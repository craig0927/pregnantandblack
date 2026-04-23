import { useEffect, useState } from "react";
import { AppState } from "react-native";
import {
  dedupeNotifications,
  isVisibleActivityNotification,
  shouldKeepReplyNotification,
} from "./useNotifications";
import { getUnreadConversationCount } from "../lib/messageBadge";
import { subscribeToConversationReadChanged } from "../lib/messageReadStore";
import { subscribeToNotificationsChanged } from "../lib/notificationEvents";
import { supabase } from "../lib/supabase";

/**
 * Computes the total unread badge count (notifications + unread conversations)
 * and keeps it in sync via realtime subscriptions and local events.
 *
 * @param channelName - unique Supabase channel name per navigator instance
 */
export function useBadgeCount(channelName: string): number | undefined {
  const [badge, setBadge] = useState<number | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    let refreshInFlight = false;

    const refresh = async () => {
      if (refreshInFlight) return;
      refreshInFlight = true;
      try {
        const { data: userRes } = await supabase.auth.getUser();
        const uid = userRes.user?.id;
        if (!uid) {
          if (alive) setBadge(undefined);
          return;
        }

        const { data: unreadNotifications } = await supabase
          .from("notifications")
          .select("id, actor_id, type, title, body, entity_type, entity_id, read")
          .eq("user_id", uid)
          .eq("read", false);

        const rows = unreadNotifications ?? [];
        const keepMask = await Promise.all(
          rows.map((row) => shouldKeepReplyNotification(uid, row)),
        );
        const visibleRows = dedupeNotifications(
          rows.filter((row, idx) => keepMask[idx] && isVisibleActivityNotification(row)),
        );
        const unreadNotificationCount = visibleRows.filter((row) => !row.read).length;
        const unreadConversationCount = await getUnreadConversationCount(uid);
        const total = unreadNotificationCount + unreadConversationCount;

        if (alive) setBadge(total > 0 ? total : undefined);
      } finally {
        refreshInFlight = false;
      }
    };

    refresh();

    const queueRefresh = () => {
      setTimeout(() => {
        void refresh();
      }, 0);
    };

    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, queueRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "conversation_messages" }, queueRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, queueRefresh)
      .subscribe();

    // Keep auth callback synchronous. Supabase awaits these callbacks internally,
    // and async handlers can wedge unrelated auth operations.
    const authSub = supabase.auth.onAuthStateChange(() => {
      queueRefresh();
    });
    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state === "active") queueRefresh();
    });
    const unsubNotifications = subscribeToNotificationsChanged(queueRefresh);
    const unsubConversations = subscribeToConversationReadChanged(queueRefresh);

    return () => {
      alive = false;
      appStateSub.remove();
      unsubNotifications();
      unsubConversations();
      authSub.data.subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [channelName]);

  return badge;
}
