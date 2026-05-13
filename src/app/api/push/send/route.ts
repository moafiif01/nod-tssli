import { createClient } from "@/utils/supabase/server";
import webpush from "web-push";
import { NextRequest, NextResponse } from "next/server";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // Simple auth check via a secret header for cron jobs
    const authHeader = req.headers.get("authorization");
    const isValidCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user && !isValidCron) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, body, url, targetUserId } = await req.json();

    // Fetch subscriptions
    let query = supabase.from("push_subscriptions").select("subscription");
    if (targetUserId) {
      query = query.eq("user_id", targetUserId);
    }
    const { data: subs } = await query;

    if (!subs || subs.length === 0) {
      return NextResponse.json({ message: "No subscriptions found" });
    }

    const payload = JSON.stringify({ title, body, url: url || "/" });

    const results = await Promise.allSettled(
      subs.map((row) =>
        webpush.sendNotification(row.subscription, payload)
      )
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return NextResponse.json({ sent, failed });
  } catch (err) {
    console.error("Send notification error:", err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
