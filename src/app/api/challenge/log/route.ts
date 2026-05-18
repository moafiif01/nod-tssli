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

    // Compute points using the precise (possibly fractional) pages
    const points = computeChallengePoints({
      quran_pages: safeQuranPages,
      siyam: Boolean(siyam),
      chaf3: Boolean(chaf3),
      witr: Boolean(witr),
    });

    // Prepare integer value for DB storage (always write integer to match schema)
    const quranPagesInt = Math.round(safeQuranPages);

    const payload = {
      challenge_key: CHALLENGE_KEY,
      user_id: user.id,
      entry_date: toUtcDateKey(today),
      // write rounded integer pages in payload to avoid any fractional DB writes
      quran_pages: quranPagesInt,
      siyam: Boolean(siyam),
      chaf3: Boolean(chaf3),
      witr: Boolean(witr),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await admin
      .from("challenge_daily_entries")
      .upsert(
        {
          ...payload,
          // store rounded integer pages in DB to match schema
          quran_pages: quranPagesInt,
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
