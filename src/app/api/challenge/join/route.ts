import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CHALLENGE_KEY, normalizeAlias, parseChallengeWindow, validateAlias } from "@/lib/challenge";

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

    const body = await req.json().catch(() => ({} as { alias?: string }));
    const alias = normalizeAlias(body.alias || "");
    const validationError = validateAlias(alias);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { data: conflictingAlias } = await admin
      .from("challenge_participants")
      .select("user_id")
      .eq("challenge_key", CHALLENGE_KEY)
      .ilike("alias", alias)
      .neq("user_id", user.id)
      .maybeSingle();

    if (conflictingAlias) {
      return NextResponse.json({ error: "هاد الاسم المستعار مستعمل من طرف واحد آخر" }, { status: 409 });
    }

    const now = new Date().toISOString();
    const { data, error } = await admin
      .from("challenge_participants")
      .upsert(
        {
          challenge_key: CHALLENGE_KEY,
          user_id: user.id,
          alias,
          joined_at: now,
          updated_at: now,
        },
        { onConflict: "challenge_key,user_id" }
      )
      .select("user_id, alias, joined_at, updated_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, participant: data, window });
  } catch (err: any) {
    console.error("Challenge join error:", err);
    return NextResponse.json({ error: err.message || "Failed to join challenge" }, { status: 500 });
  }
}
