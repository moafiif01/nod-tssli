import webpush from "web-push";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Set up web-push
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

const PRAYERS = [
  {
    key: "Fajr",
    title: "حان وقت صلاة الفجر 🌙",
    body: "نوض تصلي يا بطل! الصلاة خير من النوم. الصلاة ماركيها فـ #NOD_TSSLI باش تحافظ على السلسلة ديالك. 🔥",
  },
  {
    key: "Dhuhr",
    title: "حان وقت صلاة الظهر ☀️",
    body: "وقت الظهر وصل. خذ دقيقة وصلي باش تبقى ثابت فـ السلسلة ديالك. 💪",
  },
  {
    key: "Asr",
    title: "حان وقت صلاة العصر 🌤️",
    body: "ما تخليش النهار يدوز بلا عصر. صلي وماركيها فـ #NOD_TSSLI. ✨",
  },
  {
    key: "Maghrib",
    title: "حان وقت صلاة المغرب 🌇",
    body: "الأذان ديال المغرب! وقف شوية وصلي باش تكمل نقاط اليوم. ⭐",
  },
  {
    key: "Isha",
    title: "حان وقت صلاة العشاء 🌌",
    body: "سد نهارك بالعشاء وختم يومك بخير. صلي وماركيها دابا. 🤍",
  },
] as const;

const parsePrayerTimeToMinutes = (time: string) => {
  const normalized = time.split(" ")[0];
  const [hour, minute] = normalized.split(":").map((value) => parseInt(value, 10));
  return hour * 60 + minute;
};

const getNowInTimezone = (timeZone: string) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value || "00";

  return {
    currentHour: parseInt(get("hour"), 10),
    currentMinute: parseInt(get("minute"), 10),
    localDate: `${get("year")}-${get("month")}-${get("day")}`,
  };
};

export async function GET(req: Request) {
  try {
    // 1. Security check (Vercel Cron Secret)
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get Rabat prayer times using env vars with safe defaults
    const prayerCity = process.env.PRAYER_CITY || "Rabat";
    const prayerCountry = process.env.PRAYER_COUNTRY || "Morocco";
    const prayerMethod = process.env.PRAYER_METHOD || "3";
    const prayerTimeZone = process.env.PRAYER_TIMEZONE || "Africa/Casablanca";
    // Forward-only window: send at/after prayer time (never before).
    // Default is 5 minutes to align with GitHub Actions' minimum cron granularity.
    const windowMinutes = parseInt(process.env.PRAYER_WINDOW_MINUTES || "5", 10);
    
    const prayerRes = await fetch(
      `https://api.aladhan.com/v1/timingsByCity?city=${prayerCity}&country=${prayerCountry}&method=${prayerMethod}`,
      { cache: "no-store" }
    );

    if (!prayerRes.ok) {
      return NextResponse.json({ error: "Failed to fetch prayer times" }, { status: 502 });
    }

    const prayerData = await prayerRes.json();
    const timings = prayerData?.data?.timings as Record<string, string> | undefined;

    if (!timings) {
      return NextResponse.json({ error: "Prayer API returned unexpected payload" }, { status: 502 });
    }

    const { currentHour, currentMinute, localDate } = getNowInTimezone(prayerTimeZone);
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    const duePrayers = PRAYERS.filter((prayer) => {
      const prayerTime = timings[prayer.key];
      if (!prayerTime) return false;

      const prayerMinutes = parsePrayerTimeToMinutes(prayerTime);
      const deltaMinutes = currentTotalMinutes - prayerMinutes;

      // Only send after prayer time and within the configured forward window.
      return deltaMinutes >= 0 && deltaMinutes < windowMinutes;
    });

    if (duePrayers.length === 0) {
      return NextResponse.json({
        message: "No prayer in current window",
        localDate,
        nowMinutes: currentTotalMinutes,
        windowMinutes,
      });
    }

    // 3. Fetch all subscribers from Supabase
    const admin = createAdminClient();
    const { data: subs, error } = await admin
      .from("push_subscriptions")
      .select("subscription");

    if (error || !subs || subs.length === 0) {
      return NextResponse.json({ message: "No subscribers to notify" });
    }

    const summary: Array<{ prayer: string; sent: number; skipped: boolean }> = [];

    for (const prayer of duePrayers) {
      const { data: lockRows, error: lockError } = await admin
        .from("prayer_notification_runs")
        .upsert(
          { prayer_date: localDate, prayer_key: prayer.key },
          { onConflict: "prayer_date,prayer_key", ignoreDuplicates: true }
        )
        .select("id");

      if (lockError) {
        console.error("Failed to lock prayer run", { prayer: prayer.key, lockError });
        summary.push({ prayer: prayer.key, sent: 0, skipped: true });
        continue;
      }

      // Already sent earlier for this prayer/day
      if (!lockRows || lockRows.length === 0) {
        summary.push({ prayer: prayer.key, sent: 0, skipped: true });
        continue;
      }

      const payload = JSON.stringify({
        title: prayer.title,
        body: prayer.body,
        url: "/",
      });

      const results = await Promise.allSettled(
        subs.map((row) => webpush.sendNotification(row.subscription, Buffer.from(payload, "utf8")))
      );

      const sent = results.filter((r) => r.status === "fulfilled").length;
      summary.push({ prayer: prayer.key, sent, skipped: false });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Prayer reminder run completed",
      localDate,
      duePrayers: duePrayers.map((p) => p.key),
      summary,
    });

  } catch (err) {
    console.error("Cron error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
