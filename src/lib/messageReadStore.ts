import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "pwb:conversation_last_read_at";
const listeners = new Set<() => void>();

export async function getConversationReadMap(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}

export async function markConversationRead(
  conversationId: string,
  readAtIso: string,
): Promise<void> {
  if (!conversationId) return;
  // mergeItem performs an atomic JSON merge, avoiding a read-modify-write race.
  await AsyncStorage.mergeItem(KEY, JSON.stringify({ [conversationId]: readAtIso }));
  for (const listener of listeners) listener();
}

export function subscribeToConversationReadChanged(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
