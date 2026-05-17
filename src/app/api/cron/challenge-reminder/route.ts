import { NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import { CHALLENGE_KEY, parseChallengeWindow, isChallengeWindowOpen } from "@/lib/challenge";

webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@example.com", process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "", process.env.VAPID_PRIVATE_KEY || "");

const addUnique = (set: Set<string>, v: string) => set.add(v);

export async function GET() {
  try {
    const window = parseChallengeWindow();
    if (!window) return NextResponse.json({ sent: 0, message: "Challenge not configured" });

    // Only proceed on challenge days
    const now = new Date();
    if (!isChallengeWindowOpen(window, now)) return NextResponse.json({ sent: 0, message: "Not a challenge day" });

    // Time check in configured timezone (default UTC). Only send near the configured hour.
    const tz = process.env.CHALLENGE_REMINDER_TIMEZONE || "UTC";
    const targetHour = Number(process.env.CHALLENGE_REMINDER_HOUR || "22");
    const parts = new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz }).formatToParts(new Date());
    const hour = Number(parts.find((p) => p.type === "hour")?.value || 0);
    const minute = Number(parts.find((p) => p.type === "minute")?.value || 0);

    // GitHub Action runs every 5 minutes; send only when minute is within the first 5 minutes of the hour
    if (hour !== targetHour || minute > 4) {
      return NextResponse.json({ sent: 0, message: `Not time yet (${hour}:${minute} ${tz})` });
    }

    const admin = createAdminClient();

    // fetch participants
    const { data: participants } = await admin.from("challenge_participants").select("user_id").eq("challenge_key", CHALLENGE_KEY);
    const userIds = (participants || []).map((p: any) => p.user_id);
    if (userIds.length === 0) return NextResponse.json({ sent: 0, message: "No participants" });

    // fetch subscriptions for those users
    const { data: subs } = await admin.from("push_subscriptions").select("subscription,endpoint,user_id").in("user_id", userIds);
    if (!subs || subs.length === 0) return NextResponse.json({ sent: 0, message: "No subscriptions for participants" });

    const title = "تذكير: سجّل مشاركتك في التحدي";
    const body = "دخل وسجّل أثمانك وصلاواتك اليوم باش تبقى فالمنافسة!";
    const url = "/challenge";
    const payload = JSON.stringify({ title, body, url });

    const results = await Promise.allSettled(
      subs.map((row: any) => {
        const sub = row.subscription as any;
        return webpush.sendNotification(sub, Buffer.from(payload, "utf8"));
      })
    );

    let sent = 0;
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status === "fulfilled") sent++;
      else {
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

    return NextResponse.json({ sent, attempted: subs.length });
  } catch (err) {
    console.error("challenge reminder error", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
