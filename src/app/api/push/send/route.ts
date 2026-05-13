import webpush from "web-push";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

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
    const { data: { user } } = await supabase.auth.getUser();

    if (!user && !isValidCron) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, body, url, targetUserId } = await req.json();

    // Build query
    let query = supabase.from("push_subscriptions").select("subscription");
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

    results.forEach((r, i) => {
      if (r.status === "rejected") {
        console.error(`Push failed for sub[${i}]:`, (r as PromiseRejectedResult).reason?.message);
      }
    });

    return NextResponse.json({ sent, failed });
  } catch (err: any) {
    console.error("Send notification error:", err);
    return NextResponse.json({ error: "Failed to send", details: err.message }, { status: 500 });
  }
}
