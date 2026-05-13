import { createClient } from "@/utils/supabase/server";
import webpush from "web-push";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Set up web-push
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function GET(req: Request) {
  try {
    // 1. Security Check (Vercel Cron Secret)
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get Prayer Times using environment variables
    const prayerCity = process.env.PRAYER_CITY || "Rabat";
    const prayerCountry = process.env.PRAYER_COUNTRY || "Morocco";
    const prayerMethod = process.env.PRAYER_METHOD || "3";
    
    const prayerRes = await fetch(
      `http://api.aladhan.com/v1/timingsByCity?city=${prayerCity}&country=${prayerCountry}&method=${prayerMethod}`
    );
    const prayerData = await prayerRes.json();
    const fajrTime = prayerData.data.timings.Fajr; // Format "05:12"

    // 3. Check if "Now" is Fajr (with 30min window)
    const timeZone = process.env.PRAYER_TIMEZONE || "Africa/Casablanca";
    const now = new Intl.DateTimeFormat("en-GB", {
      timeZone: timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date());

    console.log(`Current Time: ${now}, Fajr Time: ${fajrTime}`);

    // If it's the exact hour of Fajr, we send the notification
    // We check if current time matches Fajr time
    if (now !== fajrTime) {
      return NextResponse.json({ message: "Not Fajr yet", now, fajrTime });
    }

    // 5. Fetch all subscribers from Supabase
    const supabase = createAdminClient();
    const { data: subs, error } = await supabase
      .from("push_subscriptions")
      .select("subscription");

    if (error || !subs || subs.length === 0) {
      return NextResponse.json({ message: "No subscribers to notify" });
    }

    // 5. Send the notifications
    const payload = JSON.stringify({
      title: "حان وقت صلاة الفجر 🌙",
      body: "نوض تصلي يا بطل! الصلاة خير من النوم. الصلاة ماركيهة في #NOD_TSSLI باش تحافظ على السلسلة ديالك. 🔥",
      url: "/",
    });

    const results = await Promise.allSettled(
      subs.map((row) => webpush.sendNotification(row.subscription, payload))
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;

    return NextResponse.json({ 
      success: true, 
      message: "Fajr notifications sent!",
      sent 
    });

  } catch (err) {
    console.error("Cron error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
