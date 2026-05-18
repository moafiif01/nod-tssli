import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import ChallengeLeaderboard from "@/components/ChallengeLeaderboard";
import DhulHijjahChallengePanel from "@/components/DhulHijjahChallengePanel";
import {
  CHALLENGE_DESCRIPTION,
  CHALLENGE_KEY,
  CHALLENGE_POINTS,
  CHALLENGE_TITLE,
  ChallengeDailyEntry,
  ChallengeLeaderboardRow,
  ChallengeParticipant,
  ChallengePrayerLog,
  computeChallengePoints,
  getChallengeDayCount,
  getChallengeProgressDays,
  getDaysRemaining,
  isChallengeWindowOpen,
  isChallengeWindowUpcoming,
  isFullCompletion,
  parseChallengeWindow,
  toLocalDateKey,
  toUtcDateKey,
} from "@/lib/challenge";
import AppleEmoji from "@/components/AppleEmoji";

export const dynamic = "force-dynamic";

const addUniquePrayer = (set: Set<string>, userId: string, prayer: string) => {
  set.add(`${userId}:${prayer}`);
};

function computeLeaderboard(
  participants: ChallengeParticipant[],
  entries: ChallengeDailyEntry[],
  prayerLogs: ChallengePrayerLog[]
) {
  const participantMap = new Map(participants.map((p) => [p.user_id, p]));
  const totals = new Map<string, ChallengeLeaderboardRow>();

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

    const points = computeChallengePoints(entry);
    row.challengePoints += points.basePoints;
    row.quranTumuns = (row.quranTumuns || 0) + (points.quranTumuns || 0);
    row.siyamDays += entry.siyam ? 1 : 0;
    row.chaf3Days += entry.chaf3 ? 1 : 0;
    row.witrDays += entry.witr ? 1 : 0;
    row.completedDays += 1;

    if (isFullCompletion(entry)) {
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

export default async function ChallengePage() {
  const supabase = await createClient();
  const admin = createAdminClient();
  const window = parseChallengeWindow();
  const { data: { user } } = await supabase.auth.getUser();

  let seasonNotice = "";
  let leaderboard: ChallengeLeaderboardRow[] = [];
  let participant: ChallengeParticipant | null = null;
  let todayEntry: ChallengeDailyEntry | null = null;
  let participantCount = 0;

  if (!window) {
    seasonNotice = "تاريخ التحدي مازال ما تفعّلش فالإعدادات. زِد `NEXT_PUBLIC_CHALLENGE_START_DATE` و `NEXT_PUBLIC_CHALLENGE_END_DATE` باش يبان التحدي الحقيقي.";
  } else {
    const [{ data: participants }, { data: entries }, { data: prayerLogs }, { count }] = await Promise.all([
      admin.from("challenge_participants").select("user_id, alias, joined_at, updated_at").eq("challenge_key", CHALLENGE_KEY),
      admin
        .from("challenge_daily_entries")
          .select("user_id, entry_date, quran_tumuns, siyam, chaf3, witr, updated_at")
        .eq("challenge_key", CHALLENGE_KEY)
        .gte("entry_date", window.startDateKey)
        .lte("entry_date", window.endDateKey),
      admin
        .from("prayer_logs")
        .select("user_id, prayer, points_earned, logged_at")
        .gte("logged_at", `${window.startDateKey}T00:00:00Z`)
        .lte("logged_at", `${window.endDateKey}T23:59:59Z`),
      admin.from("challenge_participants").select("user_id", { count: "exact", head: true }).eq("challenge_key", CHALLENGE_KEY),
    ]);

    participantCount = count || 0;
    leaderboard = computeLeaderboard(
      (participants || []) as ChallengeParticipant[],
      (entries || []) as ChallengeDailyEntry[],
      (prayerLogs || []) as ChallengePrayerLog[]
    );

    if (user) {
      const { data: currentParticipant } = await admin
        .from("challenge_participants")
        .select("user_id, alias, joined_at, updated_at")
        .eq("challenge_key", CHALLENGE_KEY)
        .eq("user_id", user.id)
        .maybeSingle();
      participant = (currentParticipant as ChallengeParticipant | null) || null;

      const todayKey = toLocalDateKey();
      const { data: currentEntry } = await admin
        .from("challenge_daily_entries")
        .select("user_id, entry_date, quran_tumuns, siyam, chaf3, witr, updated_at")
        .eq("challenge_key", CHALLENGE_KEY)
        .eq("user_id", user.id)
        .eq("entry_date", todayKey)
        .maybeSingle();
      todayEntry = (currentEntry as ChallengeDailyEntry | null) || null;
    }
  }

  const challengeOpen = Boolean(window && isChallengeWindowOpen(window));
  const challengeUpcoming = Boolean(window && isChallengeWindowUpcoming(window));
  const progressDays = window ? getChallengeProgressDays(window) : 0;
  const totalDays = window ? getChallengeDayCount(window) : 10;
  const daysRemaining = window ? getDaysRemaining(window) : 0;
  const seasonLabel = window
    ? `${CHALLENGE_TITLE} · ${window.startDateKey} → ${window.endDateKey}`
    : CHALLENGE_TITLE;

  const isFinished = Boolean(window && new Date().getTime() > window.endDate.getTime());

  return (
    <div className="max-w-[1280px] mx-auto w-full px-6 md:px-12 py-[72px] md:py-[96px] space-y-10">
      <section className="relative overflow-hidden bg-[var(--color-cream)] text-[var(--color-ink)] rounded-[var(--radius-lg)] border border-[var(--color-beige-deep)] p-6 md:p-10 shadow-sm pt-20 md:pt-28">
          {/* Decorative hero banner (background) */}
          <div className="pointer-events-none absolute top-0 left-0 w-full flex justify-center -z-20">
            <img
              src="/Nod_Tssli_10_Day_Challenge_(2)_page-0001.jpg"
              alt="تحدي العشر الأوائل - بانر"
              className="w-[86%] max-w-[1100px] h-auto object-cover opacity-90 rounded-[12px]"
            />
          </div>
          <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[rgba(10,21,38,0.6)] to-[rgba(10,21,38,0.95)]"></div>
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)] items-start">
          <div className="space-y-6 text-center xl:text-right">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-primary)]/25 bg-[var(--color-primary)]/10 px-4 py-1 text-[13px] font-[700] text-[var(--color-primary)] uppercase tracking-[0.2em] mx-auto xl:mx-0">
              تحدي اختياري
            </div>
            <div className="max-w-[760px] mx-auto xl:mx-0">
              <h1 className="text-[38px] md:text-[60px] lg:text-[68px] font-[400] display-font leading-[1.08]">
                {CHALLENGE_TITLE}
              </h1>
                  <p className="mt-4 text-[16px] md:text-[18px] text-[var(--color-charcoal)] leading-[1.9] z-10 relative">
                    {CHALLENGE_DESCRIPTION} Salawat يبقى الأساس، والتحدي غير طبقة إضافية لمن يريد المنافسة باسم مستعار داخل Leaderboard خاص بـ 10 أيام فقط.
                  </p>
              <div className="mt-6 w-full flex justify-center">
                <img
                  src="/Nod_Tssli_10_Day_Challenge_(2)_page-0001.jpg"
                  alt="تحدي العشر الأوائل - بانر"
                  className="w-full max-w-[920px] h-auto rounded-[12px] object-cover shadow-md"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 max-w-[760px] mx-auto xl:mx-0">
              <div className="p-8 bg-[var(--color-canvas)] rounded-[var(--radius-lg)] border border-[var(--color-hairline-strong)] shadow-sm text-center">
                <blockquote className="display-font text-[28px] md:text-[36px] leading-tight text-[var(--color-primary)] mb-3">«وَالْفَجْرِ وَلَيَالٍ عَشْرٍ»</blockquote>
                <div className="text-[13px] text-[var(--color-slate)]">سورة الفجر — الآية 1-2</div>
              </div>

              <div className="p-6 bg-[var(--color-canvas)] rounded-[var(--radius-md)] border border-[var(--color-hairline-strong)] text-center flex items-center justify-center">
                <div>
                  <p className="text-[18px] font-[600] text-[var(--color-ink)] leading-7">"ما من أيام العمل الصالح فيهن أحب إلى الله من هذه الأيام"</p>
                  <div className="text-[12px] text-[var(--color-slate)] mt-3">حديث — رواه البخاري عن ابن عباس</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-hairline-strong)] bg-[var(--color-canvas)]/65 p-4 md:p-5">
              <div className="text-[13px] uppercase tracking-[0.18em] text-[var(--color-slate)] font-[700] mb-3 text-center">مؤشرات سريعة</div>
              <div className="grid grid-cols-2 gap-3">
                <InfoChip label="الأيام" value={`${progressDays}/${totalDays}`} />
                <InfoChip label="المشاركين" value={`${participantCount}`} />
                <InfoChip label="باقي" value={window ? `${daysRemaining} يوم` : "-"} />
                <InfoChip label="الحالة" value={challengeOpen ? "مفتوح" : challengeUpcoming ? "جاي" : window ? "منتهي" : "غير معد"} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {isFinished && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-hairline-strong)] bg-[var(--color-surface)] p-4 text-[var(--color-ink)] flex items-center gap-4">
          <AppleEmoji hex="1f389" size="1.6rem" />
          <div>
            <h3 className="text-[18px] font-[700]">التحدي انتهى — هذه هي النتائج النهائية</h3>
            <p className="text-[13px] text-[var(--color-slate)] mt-1">شكراً لجميع المشاركين! ها هي الـ leaderboard النهائية للتحدي.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-5 space-y-6">
          <DhulHijjahChallengePanel
            seasonLabel={seasonLabel}
            isSignedIn={Boolean(user)}
            canJoin={Boolean(window)}
            isJoined={Boolean(participant)}
            currentAlias={participant?.alias || null}
            canSubmit={Boolean(participant && challengeOpen)}
            todayEntry={todayEntry}
            challengeOpen={challengeOpen}
            challengeStatusText={seasonNotice || (challengeUpcoming ? "التحدي مازال ما بدّاش. يقدر الواحد يسجّل الاسم المستعار ديالو من دابا، والمشاركة اليومية غادي تفتح ملي يوصل اليوم الأول." : "التحدي مازال ما متفعلش.")}
            isFinished={isFinished}
            finalResult={user ? leaderboard.find((r) => r.userId === user.id) || null : null}
          />

          <section className="bg-[var(--color-canvas)] border border-[var(--color-hairline-soft)] rounded-[var(--radius-lg)] p-6 md:p-8 shadow-sm space-y-4">
            <h2 className="text-[28px] font-[400] display-font text-[var(--color-ink)]">كيفاش كيتحسب الترتيب؟</h2>
            <ul className="space-y-3 text-[15px] text-[var(--color-slate)] leading-[1.8]">
              <li>• صلاواتك اليومية كتدخل تلقائياً من التتبع العادي ديال المنصة.</li>
                <li>• القرآن: 2 نقاط لكل ثمن الحزب (لا سقف يومي).</li>
              <li>• الصيام: 15 نقطة لنهار الصيام.</li>
              <li>• الشفع + الوتر: نقطتين لكل واحد.</li>
              <li>• Bonus ديال 10 نقاط إلا كملت نهار كامل: salawat + القرآن + الصيام + الشفع + الوتر.</li>
            </ul>
          </section>
        </div>

        <div className="xl:col-span-7">
          <ChallengeLeaderboard rows={leaderboard} seasonLabel={seasonLabel} currentUserId={user?.id || null} />
        </div>
      </div>
    </div>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-beige-deep)] bg-[var(--color-canvas)]/50 p-4">
      <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-slate)] font-[700]">{label}</div>
      <div className="mt-2 text-[18px] font-[700] text-[var(--color-ink)]">{value}</div>
    </div>
  );
}
