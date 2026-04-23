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
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const supportFromEmail = Deno.env.get("SUPPORT_FROM_EMAIL") ?? "support@pregnantandblack.com";

  if (!supabaseUrl || !supabaseServiceKey || !resendApiKey) {
    return json({ error: "Missing env vars" }, 500);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

  // Verify the caller is an authenticated user.
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authErr } = await userClient.auth.getUser();
  if (authErr || !user) return json({ error: "Unauthorized" }, 401);

  let payload: { userId?: string; cancelCount?: number };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  // Use service role to fetch full user details.
  const adminClient = createClient(supabaseUrl, supabaseServiceKey);

  const [profileResult, authUserResult] = await Promise.all([
    adminClient.from("profiles").select("username, role").eq("id", user.id).maybeSingle(),
    adminClient.auth.admin.getUserById(user.id),
  ]);

  const username = (profileResult.data as any)?.username ?? "unknown";
  const role = (profileResult.data as any)?.role ?? "unknown";
  const email = authUserResult.data?.user?.email ?? "unknown";
  const cancelCount = payload.cancelCount ?? "unknown";

  const text = [
    "Frequent Cancellation Flag",
    "",
    `User ID: ${user.id}`,
    `Email: ${email}`,
    `Username: ${username}`,
    `Role: ${role}`,
    `Total cancellations: ${cancelCount}`,
    "",
    "This user has exceeded the cancellation threshold (3+).",
  ].join("\n");

  const resendResp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: supportFromEmail,
      to: ["info@pregnantandblack.com"],
      subject: `[PWB] Frequent canceller flagged: ${username}`,
      text,
    }),
  });

  if (!resendResp.ok) {
    const errText = await resendResp.text();
    return json({ error: "Email provider error", details: errText }, 502);
  }

  return json({ ok: true });
});
