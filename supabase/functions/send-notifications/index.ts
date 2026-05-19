import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import webpush from "npm:web-push";
import { createClient } from "npm:@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || Deno.env.get("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const CRON_SECRET = Deno.env.get("CRON_SECRET");
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
const VAPID_PUBLIC_KEY = Deno.env.get("NEXT_PUBLIC_VAPID_PUBLIC_KEY");
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@example.com";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing Supabase config: SUPABASE_URL or SERVICE_ROLE_KEY");
}

if (VAPID_PRIVATE_KEY && VAPID_PUBLIC_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} else {
  console.warn("VAPID keys not fully provided; send attempts will fail");
}

const admin = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!, { global: { fetch } });

serve(async (req: Request) => {
  try {
    const auth = req.headers.get("authorization");
    if (!auth || !CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    // Accept JSON body: { payload?: { title, body, url }, targetUserId?: string }
    const body = await req.json().catch(() => ({}));
    const payload = body.payload || { title: "تذكير", body: "تذكير من نوض تصلي", url: "/" };
    const targetUserId = body.targetUserId || null;

    let query = admin.from("push_subscriptions").select("subscription,endpoint,user_id");
    if (targetUserId) query = query.eq("user_id", targetUserId);

    const { data: subs, error } = await query;
    if (error) {
      console.error("Supabase error fetching subscriptions", error);
      return new Response(JSON.stringify({ error: "Failed to fetch subscriptions" }), { status: 500 });
    }

    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ message: "No subscribers" }), { status: 200 });
    }

    const payloadStr = JSON.stringify(payload);
    const results = await Promise.allSettled(
      subs.map((row: any) => webpush.sendNotification(row.subscription, Buffer.from(payloadStr, "utf8")))
    );

    // Clean up expired subscriptions (410/404)
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status === "rejected") {
        const reason = (r as PromiseRejectedResult).reason;
        const statusCode = reason?.statusCode ?? reason?.status ?? null;
        if (statusCode === 410 || statusCode === 404) {
          const endpoint = subs[i].endpoint;
          try {
            await admin.from("push_subscriptions").delete().eq("endpoint", endpoint);
          } catch (e) {
            console.error("failed to delete expired subscription", endpoint, e);
          }
        }
      }
    }

    const sent = results.filter((r) => r.status === "fulfilled").length;
    return new Response(JSON.stringify({ success: true, attempted: subs.length, sent }), { status: 200 });
  } catch (err) {
    console.error("send-notifications error", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
