import { supabase } from "../lib/supabase";
import { useCallback, useEffect, useRef, useState } from "react";
import { emitNotificationsChanged } from "../lib/notificationEvents";

export type Notification = {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  actor_id?: string | null;
  entity_type: string;
  entity_id: string;
  post_id?: string | null;
  appointment_id?: string | null;
  read: boolean;
  created_at: string;
  raw_ids?: string[];

  actor?: {
    username?: string | null;
    avatar_url?: string | null;
  } | null;
};

export const NOTIFICATION_SELECT = `
  *,
  actor:profiles!notifications_actor_id_fkey(username, avatar_url)
`;

export function isReplyNotification(row: any) {
  const type = String(row?.type ?? "").toLowerCase();
  const title = String(row?.title ?? "").toLowerCase();
  const body = String(row?.body ?? "").toLowerCase();
  const entityType = String(row?.entity_type ?? "").toLowerCase();
  const blob = `${type} ${title} ${body}`;
  return entityType === "comment" && (blob.includes("reply") || blob.includes("replied"));
}

export async function shouldKeepReplyNotification(
  userId: string,
  row: any,
): Promise<boolean> {
  try {
    if (!isReplyNotification(row)) return true;
    if (!row?.entity_id) return true;

    const { data: comment } = await supabase
      .from("forum_comments")
      .select("id, author_id, parent_comment_id")
      .eq("id", row.entity_id)
      .maybeSingle();

    // If referenced comment is missing, do not hide by default.
    if (!comment) return true;

    if ((comment as any).author_id === userId) return true;

    const parentId = (comment as any).parent_comment_id as string | null;
    if (!parentId) return false;

    const { data: parentComment } = await supabase
      .from("forum_comments")
      .select("id, author_id")
      .eq("id", parentId)
      .maybeSingle();

    if (!parentComment) return false;

    return (parentComment as any).author_id === userId;
  } catch (e) {
    console.error("[Notifications] shouldKeepReplyNotification error", e);
    return true;
  }
}

export function isVisibleActivityNotification(row: any) {
  const type = String(row?.type ?? "").toLowerCase();
  const title = String(row?.title ?? "").toLowerCase();
  const body = String(row?.body ?? "").toLowerCase();
  const entityType = String(row?.entity_type ?? "").toLowerCase();
  const blob = `${type} ${title} ${body}`;

  if (type === "activity" || title === "new activity") return false;

  if (
    entityType === "appointment" &&
    (type === "request_session" ||
      type === "session_requested" ||
      type === "appointment_requested" ||
      (type === "session_confirmed" &&
        (title === "confirmed your session" || blob.includes("confirmed your session"))) ||
      ((type === "session_declined" || type === "session_rejected") &&
        (blob.includes("declined") || blob.includes("rejected"))) ||
      type === "session_cancelled" ||
      type === "session_rescheduled" ||
      title === "requested a session" ||
      title === "session requested" ||
      blob.includes("requested a session") ||
      blob.includes("session requested"))
  ) {
    return true;
  }

  if (type === "comment" && (entityType === "post" || entityType === "comment") && (title === "commented on your post" || blob.includes("commented on your post"))) {
    return true;
  }

  if (type === "reply" && (entityType === "comment" || entityType === "post") && (title === "replied to your comment" || blob.includes("replied to your comment"))) {
    return true;
  }

  if (type === "like" && entityType === "comment" && (title === "liked your comment" || blob.includes("liked your comment"))) {
    return true;
  }

  if (type === "like" && entityType === "post" && (title === "liked your post" || blob.includes("liked your post"))) {
    return true;
  }

  return false;
}

function buildNotificationDedupKey(row: any) {
  const type = String(row?.type ?? "").toLowerCase();
  const entityType = String(row?.entity_type ?? "").toLowerCase();
  const entityId = String(row?.entity_id ?? "");
  const actorId = String(row?.actor_id ?? "");

  // All appointment notifications for the same appointment + actor collapse into one,
  // regardless of how the DB trigger phrases the title/body.
  if (entityType === "appointment") {
    return `appointment|${entityId}|${actorId}`;
  }

  const title = String(row?.title ?? "").toLowerCase();
  const body = String(row?.body ?? "").toLowerCase();
  return `${type}|${entityType}|${entityId}|${actorId}|${title}|${body}`;
}

export function dedupeNotifications<T extends { id?: string; read?: boolean; created_at?: string }>(
  rows: T[],
): (T & { raw_ids: string[] })[] {
  const byKey = new Map<string, T & { raw_ids: string[] }>();

  for (const row of rows) {
    const key = buildNotificationDedupKey(row);
    const existing = byKey.get(key);
    const rowId = String((row as any)?.id ?? "");

    if (!existing) {
      byKey.set(key, {
        ...(row as T),
        raw_ids: rowId ? [rowId] : [],
      });
      continue;
    }

    const existingTime = new Date(String((existing as any).created_at ?? 0)).getTime();
    const nextTime = new Date(String((row as any).created_at ?? 0)).getTime();
    const nextIds = rowId ? [...existing.raw_ids, rowId] : [...existing.raw_ids];
    const mergedBase =
      Number.isFinite(nextTime) && nextTime >= existingTime
        ? { ...(existing as any), ...(row as any) }
        : { ...(row as any), ...(existing as any) };

    byKey.set(key, {
      ...mergedBase,
      read: Boolean(existing.read) && Boolean((row as any)?.read),
      raw_ids: Array.from(new Set(nextIds)),
    });
  }

  return Array.from(byKey.values()).sort(
    (a, b) =>
      new Date(String((b as any).created_at ?? 0)).getTime() -
      new Date(String((a as any).created_at ?? 0)).getTime(),
  );
}

export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const loadSeqRef = useRef(0);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const loadNotifications = useCallback(async () => {
    if (!userId) return;

    const seq = ++loadSeqRef.current;

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select(NOTIFICATION_SELECT)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!aliveRef.current || seq !== loadSeqRef.current) return;

      if (error) {
        console.error("Notifications load error:", error);
        return;
      }

      const rows = data ?? [];
      const keepMask = await Promise.all(
        rows.map((row) => shouldKeepReplyNotification(userId, row)),
      );

      if (!aliveRef.current || seq !== loadSeqRef.current) return;

      const filtered = rows.filter((_, idx) => keepMask[idx]);
      setNotifications(dedupeNotifications(filtered as Notification[]));
      emitNotificationsChanged();
    } catch (e) {
      console.error("[Notifications] load error", e);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    loadNotifications();

    const channel = supabase.channel(
      `notifications:${userId}:${Math.random().toString(36).slice(2)}`,
    );

    channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => loadNotifications(),
      );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadNotifications, userId]);

  const markNotificationRead = async (target: Notification | string) => {
    if (!userId) return;
    const ids =
      typeof target === "string"
        ? [target]
        : target.raw_ids?.length
          ? target.raw_ids
          : [target.id];

    const prev = notifications;
    setNotifications((prev) =>
      prev.map((n) =>
        ids.some((id) => n.raw_ids?.includes(id) || n.id === id)
          ? { ...n, read: true }
          : n,
      ),
    );
    emitNotificationsChanged();

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .in("id", ids)
      .eq("user_id", userId);

    if (error) {
      console.error("Mark notification read error:", error);
      setNotifications(prev);
      emitNotificationsChanged();
      return;
    }

    emitNotificationsChanged();
  };

  const markAllRead = async () => {
    if (!userId) return;
    const unreadIds = notifications
      .filter((n) => !n.read)
      .flatMap((n) => (n.raw_ids?.length ? n.raw_ids : [n.id]));
    if (!unreadIds.length) return;

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .in("id", unreadIds)
      .eq("user_id", userId);

    if (error) {
      console.error("[Notifications] markAllRead error:", error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    markNotificationRead,
    markAllRead,
    refreshNotifications: loadNotifications,
  };
}
