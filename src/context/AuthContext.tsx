import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  isPasswordResetInProgress,
  setPasswordResetInProgress,
} from "../lib/passwordResetState";
import { forceClearSupabaseSession, supabase } from "../lib/supabase";
import type { Role } from "../types";

export type ContactOption = "Video" | "Chat" | "Audio Call";
type ContactOptionDbValue = "video" | "chat" | "phone";

/**
 * ================================
 * TYPES
 * ================================
 */

export type UserProfile = {
  id: string;
  email: string;
  role: Role;

  username: string;
  preferredName?: string;
  lastInitial?: string;

  avatar_url?: string | null;

  // user-specific
  questionnaire?: {
    supportNeeds: string[];
  };

  // hca-specific
  hca?: {
    bio?: string;
    languages: string[];
    modalitiesOffered: ContactOption[];
  };

  // care_companion-specific
  careCompanion?: {
    relationshipToUser?: string;
  };

  contactPreferences?: ContactOption[];
};

// Registration payload (no id yet)
export type UserProfileInput = Omit<UserProfile, "id">;

type AuthContextValue = {
  isSignedIn: boolean;
  role: Role;
  profile: UserProfile | null;

  signInWithPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;

  isHcaApproved: (email: string) => Promise<boolean>;

  completeRegistration: (
    p: UserProfileInput & { role: Role; password?: string },
  ) => Promise<void>;

  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * ================================
 * DB MAPPER
 * ================================
 */

function fromDbProfile(row: any): { role: Role; profile: UserProfile } {
  const role = (row?.role as Role) ?? "birthparent";

  const profile: UserProfile = {
    id: row.id,
    email: row.email ?? "",
    role,

    username: row.username ?? row.user_name ?? "",
    preferredName: row.preferred_name ?? undefined,
    lastInitial: row.last_initial ?? undefined,

    avatar_url: row.avatar_url ?? null,

    contactPreferences:
      role === "birthparent" || role === "care_companion"
        ? sanitizeContactOptions(row.contact_preferences)
        : undefined,
    questionnaire: row.questionnaire ?? undefined,
    hca: row.hca ? sanitizeHca(row.hca) : undefined,
    careCompanion: row.care_companion ?? undefined,
  };

  return { role, profile };
}

/**
 * ================================
 * UTILITIES
 * ================================
 */

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseContactOption(value: unknown): ContactOption | null {
  if (typeof value !== "string") return null;

  switch (value.trim().toLowerCase()) {
    case "video":
      return "Video";
    case "chat":
      return "Chat";
    case "phone":
    case "audio call":
      return "Audio Call";
    default:
      return null;
  }
}

function sanitizeContactOptions(
  raw: unknown,
  options: { includeChat?: boolean } = {},
): ContactOption[] {
  const { includeChat = true } = options;
  const filtered = Array.isArray(raw)
    ? raw
        .map(parseContactOption)
        .filter((x): x is ContactOption => x !== null)
    : [];

  const unique = Array.from(new Set<ContactOption>(filtered));

  return includeChat ? Array.from(new Set<ContactOption>(["Chat", ...unique])) : unique;
}

function contactOptionToDbValue(option: ContactOption): ContactOptionDbValue {
  switch (option) {
    case "Video":
      return "video";
    case "Chat":
      return "chat";
    case "Audio Call":
      return "phone";
  }
}

function serializeContactOptions(
  raw: unknown,
  options?: { includeChat?: boolean },
): ContactOptionDbValue[] {
  return sanitizeContactOptions(raw, options).map(contactOptionToDbValue);
}

function serializeUserContactOptions(raw: unknown): ContactOptionDbValue[] {
  return Array.from(
    new Set<ContactOptionDbValue>([
      "chat",
      ...serializeContactOptions(raw, { includeChat: false }),
    ]),
  );
}

function sanitizeHca(raw: unknown): UserProfile["hca"] {
  const base = (raw ?? {}) as any;

  return {
    bio: base?.bio,
    languages: Array.isArray(base?.languages) ? base.languages : [],
    modalitiesOffered: sanitizeContactOptions(base?.modalitiesOffered),
  };
}

async function withTimeout<T>(p: PromiseLike<T>, ms: number, label: string) {
  let t: any;

  const timeout = new Promise<never>((_, rej) => {
    t = setTimeout(() => rej(new Error(`${label} timed out (${ms}ms)`)), ms);
  });

  const realPromise = new Promise<T>((resolve, reject) => {
    p.then(resolve, reject);
  });

  try {
    return await Promise.race([realPromise, timeout]);
  } finally {
    clearTimeout(t);
  }
}

async function waitForUserId(maxMs: number) {
  const started = Date.now();
  while (Date.now() - started < maxMs) {
    const { data } = await supabase.auth.getSession();
    const id = data.session?.user?.id;
    if (id) return id;
    await sleep(250);
  }
  return null;
}

async function getValidatedAuthUserId(): Promise<string | null> {
  try {
    const res = await withTimeout(supabase.auth.getUser(), 15000, "Supabase getUser");
    return res.data.user?.id ?? null;
  } catch (e) {
    console.log("[Auth] getUser failed while resolving user id:", e);
    return null;
  }
}

/**
 * ================================
 * PROVIDER
 * ================================
 */

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [role, setRole] = useState<Role>("birthparent");
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const resetAuthState = () => {
    setIsSignedIn(false);
    setRole("birthparent");
    setProfile(null);
  };

  /**
   * LOAD PROFILE
   */
  const loadProfile = async (userId: string) => {
    let res = await withTimeout(
      supabase.from("profiles").select("*").eq("id", userId).single(),
      30000,
      "profiles select",
    );

    // Retry once on transient failure.
    if (res.error) {
      await new Promise((r) => setTimeout(r, 1500));
      res = await withTimeout(
        supabase.from("profiles").select("*").eq("id", userId).single(),
        30000,
        "profiles select retry",
      );
    }

    if (res.error) throw res.error;

    const parsed = fromDbProfile(res.data);

    setRole(parsed.role);
    setProfile(parsed.profile);
    setIsSignedIn(true);
  };

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      console.log("[Auth] Bootstrapping session...");

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      console.log("[Auth] Session result:", session ? "active" : "none", error ? "error" : "ok");

      if (!isMounted) return;

      if (session?.user) {
        try {
          await loadProfile(session.user.id);
        } catch (e) {
          console.log("[Auth] Failed to load profile on boot:", e);
          resetAuthState();
        }
      } else {
        resetAuthState();
      }
    };

    bootstrap().catch((err) => {
      console.error("[Auth] Bootstrap failed:", err);
      if (isMounted) resetAuthState();
    });

    // NOTE: callback must be synchronous — Supabase v2 awaits async callbacks,
    // which deadlocks auth operations (e.g. updateUser) that emit events.
    // Async work is queued via setTimeout to run outside the callback.
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("[Auth] Auth state change:", event);

        if (!isMounted) return;

        // SIGNED_OUT or token refresh failure → clear everything immediately
        if (event === "SIGNED_OUT" || (event === "TOKEN_REFRESHED" && !session?.user)) {
          resetAuthState();
          return;
        }

        // PASSWORD_RECOVERY is handled by ResetPassword screen — skip here
        if (event === "PASSWORD_RECOVERY") return;

        // Only handle sign-in type events (skip during OTP password-reset flow)
        if (
          (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") &&
          !isPasswordResetInProgress() &&
          session?.user
        ) {
          const uid = session.user.id;
          // Queue async work outside the synchronous callback to avoid deadlock
          setTimeout(async () => {
            if (!isMounted) return;
            try {
              const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", uid)
                .maybeSingle();

              if (!isMounted) return;

              if (error) {
                console.error("[Auth] Profile load error:", error);
                return;
              }

              if (!data) {
                console.log("[Auth] Profile not ready yet.");
                return;
              }

              const { role, profile } = fromDbProfile(data);
              setIsSignedIn(true);
              setRole(role);
              setProfile(profile);
            } catch (e) {
              console.error("[Auth] Unexpected profile load failure:", e);
            }
          }, 0);
        }
      },
    );

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  /**
   * SIGN IN
   */
  const signInWithPassword = async (email: string, password: string) => {
    setPasswordResetInProgress(false);

    const {
      data: { session: existingSession },
    } = await supabase.auth.getSession();

    if (existingSession?.user) {
      try {
        await withTimeout(
          supabase.auth.signOut({ scope: "local" }),
          15000,
          "Supabase pre-sign-in signOut",
        );
      } catch (e) {
        console.log("[Auth] pre-sign-in signOut error (ignored):", e);
        await forceClearSupabaseSession();
      }
    }

    const res = await withTimeout(
      supabase.auth.signInWithPassword({ email: email.trim(), password }),
      30000,
      "Supabase signInWithPassword",
    );

    if (res.error) throw res.error;

    const userId = res.data.session?.user?.id ?? (await waitForUserId(15000));
    if (!userId) throw new Error("Signed in but no session/user id found.");

    await loadProfile(userId);
  };

  /**
   * SIGN OUT
   */
  const signOut = async () => {
    setPasswordResetInProgress(false);
    resetAuthState();
    try {
      await withTimeout(
        supabase.auth.signOut({ scope: "local" }),
        15000,
        "Supabase signOut",
      );
    } catch (e) {
      console.log("[Auth] signOut error (ignored):", e);
      await forceClearSupabaseSession();
    }
  };

  /**
   * HCA APPROVAL
   */
  const isHcaApproved = async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const res = await withTimeout(
      supabase.rpc("is_hca_approved", { check_email: normalizedEmail }),
      15000,
      "is_hca_approved rpc",
    );

    if (res.error) throw res.error;
    return res.data === true;
  };

  /**
   * COMPLETE REGISTRATION
   */
  const completeRegistration: AuthContextValue["completeRegistration"] = async (
    p,
  ) => {
    const email = p.email.trim();
    if (!email) throw new Error("Email required");

    let userId = await getValidatedAuthUserId();

    if (!userId) {
      if (!p.password) {
        throw new Error(
          "Missing auth session. Please continue with Google/Apple again, or register with email/password.",
        );
      }

      const signUpRes = await withTimeout(
        supabase.auth.signUp({ email, password: p.password }),
        45000,
        "Supabase signUp",
      );

      if (signUpRes.error) {
        if (
          (signUpRes.error as any)?.message
            ?.toLowerCase()
            .includes("already registered")
        ) {
          throw new Error(
            "An account with this email already exists. Please sign in instead.",
          );
        } else {
          throw signUpRes.error;
        }
      }

      userId ||= signUpRes.data.user?.id ?? (await waitForUserId(20000));
    }

    if (!userId) throw new Error("Sign up succeeded but no user id.");

    if (p.role === "hca") {
      const approved = await isHcaApproved(email);
      if (!approved) {
        throw new Error(
          "This email is not approved for HCA registration. Please register as a user or request HCA approval first.",
        );
      }
    }

    const dbRow = {
      id: userId,
      role: p.role,
      email: email.toLowerCase(),
      username: p.username ?? null,
      preferred_name: p.preferredName ?? null,
      last_initial: p.lastInitial ?? null,
      contact_preferences:
        p.role === "birthparent" || p.role === "care_companion"
          ? serializeUserContactOptions(p.contactPreferences)
          : serializeContactOptions([], { includeChat: false }),
      questionnaire: p.role === "birthparent" ? (p.questionnaire ?? {}) : {},
      hca: p.role === "hca" ? sanitizeHca(p.hca) : {},
      care_companion: p.role === "care_companion" ? (p.careCompanion ?? {}) : {},
    };

    const upsertRes = await withTimeout(
      supabase.from("profiles").upsert(dbRow, { onConflict: "id" }),
      30000,
      "profiles upsert",
    );

    if (upsertRes.error) throw upsertRes.error;

    await loadProfile(userId);
  };

  /**
   * UPDATE PROFILE
   */
  const updateProfile = async (patch: Partial<UserProfile>) => {
    const { data } = await supabase.auth.getUser();
    const userId = data.user?.id;
    if (!userId) throw new Error("Not signed in");

    const dbPatch: any = {};

    if (patch.username !== undefined) dbPatch.username = patch.username ?? null;
    if (patch.preferredName !== undefined) dbPatch.preferred_name = patch.preferredName ?? null;
    if (patch.lastInitial !== undefined) dbPatch.last_initial = patch.lastInitial ?? null;

    if (patch.email !== undefined)
      dbPatch.email = patch.email?.toLowerCase() ?? null;

    if (patch.avatar_url !== undefined)
      dbPatch.avatar_url = patch.avatar_url ?? null;

    if (patch.contactPreferences !== undefined && ((profile?.role ?? role) === "birthparent" || (profile?.role ?? role) === "care_companion"))
      dbPatch.contact_preferences = serializeUserContactOptions(
        patch.contactPreferences,
      );

    if (patch.questionnaire !== undefined)
      dbPatch.questionnaire = patch.questionnaire ?? {};

    if (patch.hca !== undefined) dbPatch.hca = sanitizeHca(patch.hca);
    if (patch.careCompanion !== undefined) dbPatch.care_companion = patch.careCompanion ?? {};

    const res = await withTimeout(
      supabase.from("profiles").update(dbPatch).eq("id", userId),
      30000,
      "profiles update",
    );

    if (res.error) throw res.error;

    await loadProfile(userId);
  };

  const value = {
    isSignedIn,
    role,
    profile,
    signInWithPassword,
    signOut,
    isHcaApproved,
    completeRegistration,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
