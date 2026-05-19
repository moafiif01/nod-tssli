import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { initWebPush, sendPayloadToSubscriptions } from "@/lib/notifications";

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

    initWebPush();

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

    const payloadObj = { title, body, url: url || "/" };
    const result = await sendPayloadToSubscriptions(createAdminClient(), subs, payloadObj);
    return NextResponse.json({ sent: result.sent, failed: result.failed });
  } catch (err: any) {
    console.error("Send notification error:", err);
    return NextResponse.json({ error: "Failed to send", details: err.message }, { status: 500 });
  }
}
