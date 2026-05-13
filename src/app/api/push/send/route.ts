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
    // Check if it's a cron job request
    const authHeader = req.headers.get("authorization");
    const isValidCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    // Check if it's a logged-in browser user (cookie-based session)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Allow if: valid cron secret OR logged-in browser user
    if (!user && !isValidCron) {
      console.error("Unauthorized push attempt - no user and no cron secret");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, body, url, targetUserId } = await req.json();

    console.log("Push request from:", user?.id || "cron", "targeting:", targetUserId || "all");

    // Fetch subscriptions from DB
    let query = supabase.from("push_subscriptions").select("subscription, user_id");
    
    if (targetUserId) {
      query = query.eq("user_id", targetUserId);
    }
    
    const { data: subs, error: dbError } = await query;

    if (dbError) {
      console.error("DB error fetching subs:", dbError);
      return NextResponse.json({ error: "DB error", details: dbError.message }, { status: 500 });
    }

    if (!subs || subs.length === 0) {
      console.log("No subscriptions found for:", targetUserId || "everyone");
      return NextResponse.json({ sent: 0, message: "No subscriptions found" });
    }

    console.log(`Found ${subs.length} subscription(s), sending...`);

    const payload = JSON.stringify({ title, body, url: url || "/" });

    const results = await Promise.allSettled(
      subs.map((row) =>
        webpush.sendNotification(row.subscription, payload)
      )
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;
    
    // Log any failures
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        console.error(`Push failed for sub ${i}:`, r.reason?.message || r.reason);
      }
    });

    console.log(`Push done: ${sent} sent, ${failed} failed`);

    return NextResponse.json({ sent, failed });
  } catch (err: any) {
    console.error("Send notification error:", err);
    return NextResponse.json({ error: "Failed to send", details: err.message }, { status: 500 });
  }
}
