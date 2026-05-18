import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  CHALLENGE_KEY,
  computeChallengePoints,
  isFullCompletion,
  toUtcDateKey,
} from "@/lib/challenge";

type Participant = { user_id: string; alias: string };
type Entry = { user_id: string; entry_date: string; quran_tumuns: number; siyam: boolean; chaf3: boolean; witr: boolean };
type PrayerLog = { user_id: string; prayer: string; points_earned: number; logged_at: string };

const addUniquePrayer = (set: Set<string>, userId: string, prayer: string) => {
  set.add(`${userId}:${prayer}`);
};

function computeLeaderboardLocal(participants: Participant[], entries: Entry[], prayerLogs: PrayerLog[]) {
  const participantMap = new Map(participants.map((p) => [p.user_id, p]));
  const totals = new Map<string, any>();

  participants.forEach((participant) => {
    totals.set(participant.user_id, {
      userId: participant.user_id,
      alias: participant.alias,
      salawatPoints: 0,
      challengePoints: 0,
      bonusPoints: 0,
      totalPoints: 0,
      quranTumuns: 0,
      siyamDays: 0,
      chaf3Days: 0,
      witrDays: 0,
      completedDays: 0,
      rank: 0,
    });
  });

  const salawatPointsByUser = new Map<string, number>();
  const prayerCountByUserDate = new Map<string, Set<string>>();

  prayerLogs.forEach((log) => {
    if (!participantMap.has(log.user_id)) return;
    salawatPointsByUser.set(log.user_id, (salawatPointsByUser.get(log.user_id) || 0) + (log.points_earned || 0));

    const dateKey = toUtcDateKey(log.logged_at);
    const mapKey = `${log.user_id}:${dateKey}`;
    if (!prayerCountByUserDate.has(mapKey)) {
      prayerCountByUserDate.set(mapKey, new Set());
    }
    addUniquePrayer(prayerCountByUserDate.get(mapKey)!, log.user_id, log.prayer);
  });

  entries.forEach((entry) => {
    const row = totals.get(entry.user_id);
    if (!row) return;

    const points = computeChallengePoints(entry as any);
    row.challengePoints += points.basePoints;
    row.quranTumuns = (row.quranTumuns || 0) + (points.quranTumuns || 0);
    row.siyamDays += entry.siyam ? 1 : 0;
    row.chaf3Days += entry.chaf3 ? 1 : 0;
    row.witrDays += entry.witr ? 1 : 0;
    row.completedDays += 1;

    if (isFullCompletion(entry as any)) {
      const prayerCount = prayerCountByUserDate.get(`${entry.user_id}:${entry.entry_date}`)?.size || 0;
      if (prayerCount >= 5) {
        row.bonusPoints += 10;
      }
    }
  });

  return Array.from(totals.values())
    .map((row) => ({
      ...row,
      salawatPoints: salawatPointsByUser.get(row.userId) || 0,
      totalPoints: (salawatPointsByUser.get(row.userId) || 0) + row.challengePoints + row.bonusPoints,
    }))
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.salawatPoints !== a.salawatPoints) return b.salawatPoints - a.salawatPoints;
      if (b.completedDays !== a.completedDays) return b.completedDays - a.completedDays;
      return a.alias.localeCompare(b.alias, "ar");
    })
    .map((row, index) => ({ ...row, rank: index + 1 }))
    .slice(0, 20);
}

export async function GET() {
  try {
    const admin = createAdminClient();
    const windowStart = process.env.NEXT_PUBLIC_CHALLENGE_START_DATE;
    const windowEnd = process.env.NEXT_PUBLIC_CHALLENGE_END_DATE;

    if (!windowStart || !windowEnd) {
      return NextResponse.json({ rows: [] });
    }

    const startKey = toUtcDateKey(new Date(windowStart));
    const endKey = toUtcDateKey(new Date(windowEnd));

    const [{ data: participants }, { data: entries }, { data: prayerLogs }] = await Promise.all([
      admin.from("challenge_participants").select("user_id, alias").eq("challenge_key", CHALLENGE_KEY),
      admin
        .from("challenge_daily_entries")
        .select("user_id, entry_date, quran_tumuns, siyam, chaf3, witr")
        .eq("challenge_key", CHALLENGE_KEY)
        .gte("entry_date", startKey)
        .lte("entry_date", endKey),
      admin
        .from("prayer_logs")
        .select("user_id, prayer, points_earned, logged_at")
        .gte("logged_at", `${startKey}T00:00:00Z`)
        .lte("logged_at", `${endKey}T23:59:59Z`),
    ]);

    const rows = computeLeaderboardLocal((participants || []) as Participant[], (entries || []) as Entry[], (prayerLogs || []) as PrayerLog[]);

    return NextResponse.json({ rows });
  } catch (err) {
    console.error("leaderboard api error", err);
    return NextResponse.json({ rows: [] }, { status: 500 });
  }
}
