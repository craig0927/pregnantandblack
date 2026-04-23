import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });
}

function isValidEmail(email: string) {
  return /^\S+@\S+\.\S+$/.test(email);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const supportToEmail = Deno.env.get("SUPPORT_TO_EMAIL") ?? "support@pregnantandblack.com";
  const supportFromEmail = Deno.env.get("SUPPORT_FROM_EMAIL") ?? "support@pregnantandblack.com";

  if (!supabaseUrl || !supabaseAnonKey || !resendApiKey) {
    return json({ error: "Function env vars are missing" }, 500);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing Authorization" }, 401);

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
    error: userErr,
  } = await userClient.auth.getUser();

  if (userErr || !user) return json({ error: "Unauthorized" }, 401);

  let payload: {
    rating?: number | null;
    category?: string | null;
    message?: string | null;
    contactEmail?: string | null;
    quickInfo?: {
      role?: string;
      platform?: string;
    };
  };

  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON payload" }, 400);
  }

  const message = payload.message?.trim() ?? "";
  const rating = payload.rating ?? null;
  const category = payload.category?.trim() ?? "";
  const contactEmail = payload.contactEmail?.trim() ?? "";

  const hasSignal = Boolean(rating) || message.length > 0;
  if (!hasSignal) {
    return json({ error: "Provide rating and/or message" }, 400);
  }

  if (contactEmail && !isValidEmail(contactEmail)) {
    return json({ error: "Invalid contactEmail" }, 400);
  }

  const { data: profile } = await userClient
    .from("profiles")
    .select("role, username")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role ?? payload.quickInfo?.role ?? "unknown";
  const username = profile?.username ?? "unknown";
  const platform = payload.quickInfo?.platform ?? "unknown";

  const lines = [
    "Feedback",
    "",
    `Rating: ${rating ?? "not provided"}`,
    `Category: ${category || "not provided"}`,
    "",
    "Message",
    message || "not provided",
    "",
    "Quick Info",
    `User ID: ${user.id}`,
    `Account Email: ${user.email ?? "unknown"}`,
    `Preferred Reply Email: ${contactEmail || "(use account email)"}`,
    `Username: ${username}`,
    `Role: ${role}`,
    `Platform: ${platform}`,
  ];

  const text = lines.join("\n");

  const resendResp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: supportFromEmail,
      to: [supportToEmail],
      subject: `[PWB Feedback] ${category || "General"}`,
      text,
      reply_to: [contactEmail || user.email || supportToEmail],
    }),
  });

  if (!resendResp.ok) {
    const errText = await resendResp.text();
    return json({ error: "Email provider error", details: errText }, 502);
  }

  return json({ ok: true });
});
