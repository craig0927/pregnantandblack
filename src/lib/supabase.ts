import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env and fill in your values before starting the app.",
  );
}

let supabaseProjectRef: string;
try {
  supabaseProjectRef = new URL(supabaseUrl).hostname.split(".")[0];
} catch {
  throw new Error(
    "Invalid EXPO_PUBLIC_SUPABASE_URL. Set it in .env using your full Supabase project URL, for example https://your-project-ref.supabase.co.",
  );
}

const supabaseAuthStorageKey = `sb-${supabaseProjectRef}-auth-token`;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

async function clearPersistedSupabaseSession() {
  await Promise.all([
    AsyncStorage.removeItem(supabaseAuthStorageKey),
    AsyncStorage.removeItem(`${supabaseAuthStorageKey}-code-verifier`),
    AsyncStorage.removeItem(`${supabaseAuthStorageKey}-user`),
  ]);
}

export async function forceClearSupabaseSession() {
  const auth = supabase.auth as any;

  try {
    auth.lockAcquired = false;
    if (Array.isArray(auth.pendingInLock)) {
      auth.pendingInLock = [];
    }
  } catch {}

  try {
    if (typeof auth._removeSession === "function") {
      await auth._removeSession();
      return;
    }
  } catch (e) {
    console.log("[Auth] forceClearSupabaseSession _removeSession failed:", e);
  }

  await clearPersistedSupabaseSession();
}
