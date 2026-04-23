import { getConversationReadMap } from "./messageReadStore";
import { isSessionExpiredAfterDays } from "./sessionWindow";
import { supabase } from "./supabase";

export async function getUnreadConversationCount(userId: string) {
  if (!userId) return 0;

  const { data: rows, error } = await supabase
    .from("conversations")
    .select(
      `
      id,
      user_id,
      hca_id,
      appointment:appointments!conversations_appointment_id_fkey(date, start_time)
    `,
    )
    .or(`user_id.eq.${userId},hca_id.eq.${userId}`);

  if (error || !(rows?.length)) return 0;

  const activeRows = (rows ?? []).filter((row: any) => {
    const appointment = Array.isArray(row.appointment)
      ? row.appointment[0]
      : row.appointment;
    const apptDate = appointment?.date;
    const apptStart = appointment?.start_time;
    if (!apptDate || !apptStart) return true;
    return !isSessionExpiredAfterDays(apptDate, apptStart, 7);
  });

  const conversationIds = activeRows.map((row: any) => row.id).filter(Boolean);
  if (!conversationIds.length) return 0;

  const { data: msgs, error: msgErr } = await supabase
    .from("conversation_messages")
    .select("conversation_id, created_at, sender_id")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false });

  if (msgErr) return 0;

  const latestByConversation = new Map<
    string,
    { created_at: string; sender_id: string | null }
  >();

  for (const m of msgs ?? []) {
    const cid = String((m as any).conversation_id ?? "");
    if (!cid || latestByConversation.has(cid)) continue;
    latestByConversation.set(cid, {
      created_at: String((m as any).created_at ?? ""),
      sender_id: (m as any).sender_id ?? null,
    });
  }

  const readMap = await getConversationReadMap();

  return activeRows.filter((row: any) => {
    const latest = latestByConversation.get(String(row.id));
    const readAt = readMap[String(row.id)];
    return Boolean(
      latest?.created_at &&
        latest?.sender_id &&
        latest.sender_id !== userId &&
        (!readAt ||
          new Date(latest.created_at).getTime() >
            new Date(readAt).getTime()),
    );
  }).length;
}
