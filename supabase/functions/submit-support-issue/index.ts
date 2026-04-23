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

  if (!supabaseUrl || !supabaseAnonKey) {
    return json({ error: "Supabase env vars are missing" }, 500);
  }

  if (!resendApiKey) {
    return json({ error: "RESEND_API_KEY is not configured" }, 500);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return json({ error: "Missing Authorization header" }, 401);
  }

  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });

  const {
    data: { user },
    error: userErr,
  } = await userClient.auth.getUser();

  if (userErr || !user) {
    return json({ error: "Unauthorized" }, 401);
  }

  let payload: {
    subject?: string;
    details?: string;
    quickInfo?: {
      role?: string;
      platform?: string;
      sessionError?: string;
    };
  };

  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON payload" }, 400);
  }

  const subject = payload.subject?.trim() ?? "";
  const details = payload.details?.trim() ?? "";

  if (!subject || !details) {
    return json({ error: "subject and details are required" }, 400);
  }

  const { data: profile } = await userClient
    .from("profiles")
    .select("role, username")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role ?? payload.quickInfo?.role ?? "unknown";
  const username = profile?.username ?? "unknown";
  const platform = payload.quickInfo?.platform ?? "unknown";
  const sessionError = payload.quickInfo?.sessionError?.trim() ?? "";

  const lines = [
    "Report an Issue",
    "",
    `Subject: ${subject}`,
    "",
    "What happened?",
    details,
    "",
    "Quick Info",
    `User ID: ${user.id}`,
    `Email: ${user.email ?? "unknown"}`,
    `Username: ${username}`,
    `Role: ${role}`,
    `Platform: ${platform}`,
    ...(sessionError ? [`Session Error: ${sessionError}`] : []),
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
      subject: `[PWB Support] ${subject}`,
      text,
      reply_to: user.email ? [user.email] : undefined,
    }),
  });

  if (!resendResp.ok) {
    const errText = await resendResp.text();
    return json({ error: "Email provider error", details: errText }, 502);
  }

  return json({ ok: true });
});
