import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  CHALLENGE_KEY,
  CHALLENGE_POINTS,
  computeChallengePoints,
  isChallengeWindowOpen,
  normalizeAlias,
  parseChallengeWindow,
  toUtcDateKey,
} from "@/lib/challenge";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const window = parseChallengeWindow();
    if (!window) {
      return NextResponse.json({ error: "Challenge dates are not configured yet" }, { status: 400 });
    }

    const today = new Date();
    if (!isChallengeWindowOpen(window, today)) {
      return NextResponse.json({ error: "The challenge is not active today" }, { status: 400 });
    }

    const { quranPages = 0, siyam = false, chaf3 = false, witr = false } = await req.json().catch(
      () => ({ quranPages: 0, siyam: false, chaf3: false, witr: false })
    );

    const { data: participant } = await admin
      .from("challenge_participants")
      .select("user_id, alias")
      .eq("challenge_key", CHALLENGE_KEY)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!participant) {
      return NextResponse.json({ error: "You need an alias before logging challenge activity" }, { status: 400 });
    }

    // Do not enforce a hard daily cap on quran pages; accept any non-negative number.
    const safeQuranPages = Math.max(0, Number(quranPages) || 0);
    const payload = {
      challenge_key: CHALLENGE_KEY,
      user_id: user.id,
      entry_date: toUtcDateKey(today),
      quran_pages: safeQuranPages,
      siyam: Boolean(siyam),
      chaf3: Boolean(chaf3),
      witr: Boolean(witr),
      updated_at: new Date().toISOString(),
    };

    const points = computeChallengePoints(payload);

    const { data, error } = await admin
      .from("challenge_daily_entries")
      .upsert(
        {
          ...payload,
          quran_points: points.quranPoints,
          siyam_points: points.siyamPoints,
          chaf3_points: points.chaf3Points,
          witr_points: points.witrPoints,
          challenge_points: points.basePoints,
          alias_snapshot: normalizeAlias(participant.alias),
        },
        { onConflict: "challenge_key,user_id,entry_date" }
      )
      .select("challenge_key, user_id, entry_date, quran_pages, siyam, chaf3, witr, challenge_points, quran_points, siyam_points, chaf3_points, witr_points")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, entry: data });
  } catch (err: any) {
    console.error("Challenge log error:", err);
    return NextResponse.json({ error: err.message || "Failed to log challenge entry" }, { status: 500 });
  }
}
