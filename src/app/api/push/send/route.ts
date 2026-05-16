import webpush from "web-push";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const isValidCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    const supabase = await createClient();
    const admin = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user && !isValidCron) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, body, url, targetUserId } = await req.json();

    // Build query
    // - If targetUserId is provided, send only to that user (used by badge notifications)
    // - If targetUserId is null/undefined, send to ALL users (used by cron reminders)
    let query = admin.from("push_subscriptions").select("subscription,endpoint");
    if (targetUserId) {
      query = query.eq("user_id", targetUserId);
    }

    const { data: subs, error: dbError } = await query;

    if (dbError) {
      console.error("DB error:", dbError);
      return NextResponse.json({ error: "DB error", details: dbError.message }, { status: 500 });
    }

    if (!subs || subs.length === 0) {
      return NextResponse.json({ sent: 0, message: "No subscriptions found" });
    }

    const payload = JSON.stringify({ title, body, url: url || "/" });

    const results = await Promise.allSettled(
      subs.map((row) => {
        // Ensure the subscription object has the correct shape
        const sub = row.subscription as {
          endpoint: string;
          keys: { auth: string; p256dh: string };
          expirationTime?: number | null;
        };
        return webpush.sendNotification(sub, payload);
      })
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    // Inspect rejected sends and remove expired/invalid subscriptions (410/404)
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status === "rejected") {
        const reason = (r as PromiseRejectedResult).reason;
        console.error(`Push failed for sub[${i}]:`, {
          message: reason?.message,
          statusCode: reason?.statusCode,
          body: reason?.body,
          fullError: reason,
        });

        try {
          const statusCode = reason?.statusCode ?? (reason?.status || null);
          // If the push service reports gone/not found, delete the subscription record
          if (statusCode === 410 || statusCode === 404) {
            const endpoint = subs[i].endpoint;
            if (endpoint) {
              const { error: delErr } = await admin
                .from("push_subscriptions")
                .delete()
                .eq("endpoint", endpoint);
              if (delErr) {
                console.error(`Failed to delete expired subscription for endpoint ${endpoint}:`, delErr);
              } else {
                console.log(`Deleted expired subscription for endpoint ${endpoint}`);
              }
            }
          }
        } catch (delCatch) {
          console.error("Error while cleaning up failed subscription:", delCatch);
        }
      }
    }

    return NextResponse.json({ sent, failed });
  } catch (err: any) {
    console.error("Send notification error:", err);
    return NextResponse.json({ error: "Failed to send", details: err.message }, { status: 500 });
  }
}
