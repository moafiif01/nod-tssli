"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn, PencilLine, Send, Sparkles } from "lucide-react";
import { CHALLENGE_POINTS, CHALLENGE_TITLE, normalizeAlias } from "@/lib/challenge";

type Props = {
  seasonLabel: string;
  isSignedIn: boolean;
  canJoin: boolean;
  isJoined: boolean;
  currentAlias?: string | null;
  canSubmit: boolean;
  todayEntry?: {
    quran_pages: number;
    siyam: boolean;
    chaf3: boolean;
    witr: boolean;
  } | null;
  challengeOpen: boolean;
  challengeStatusText: string;
  isFinished?: boolean;
  finalResult?: {
    userId?: string;
    alias?: string;
    rank?: number;
    totalPoints?: number;
    salawatPoints?: number;
    challengePoints?: number;
    bonusPoints?: number;
  } | null;
};

export default function DhulHijjahChallengePanel({
  seasonLabel,
  isSignedIn,
  canJoin,
  isJoined,
  currentAlias,
  canSubmit,
  todayEntry,
  challengeOpen,
  challengeStatusText,
  isFinished = false,
  finalResult = null,
}: Props) {
  const router = useRouter();
  const [alias, setAlias] = useState(currentAlias || "");
  const PAGES_PER_EIGHTH = 10 / 8; // one hizb = 10 pages, eighth of a hizb = 10/8 = 1.25 pages
  const initialEighths = todayEntry ? String(Math.round((todayEntry.quran_pages || 0) / PAGES_PER_EIGHTH)) : "0";
  const [quranPages, setQuranPages] = useState(initialEighths || "0");
  const [siyam, setSiyam] = useState(Boolean(todayEntry?.siyam));
  const [chaf3, setChaf3] = useState(Boolean(todayEntry?.chaf3));
  const [witr, setWitr] = useState(Boolean(todayEntry?.witr));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const normalizedAlias = useMemo(() => normalizeAlias(alias), [alias]);

  const submitJoin = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/challenge/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias: normalizedAlias }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "تعذر الانضمام للتحدي");

      setMessage(`تم الحفظ بالاسم المستعار ${data.participant.alias}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "وقع مشكل");
    } finally {
      setLoading(false);
    }
  };

  const submitDailyEntry = async () => {
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/challenge/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // `quranPages` input is the number of أثمان الحزب (eighths of a hizb). Convert to pages.
          quranPages: (Number(quranPages) || 0) * PAGES_PER_EIGHTH,
          siyam,
          chaf3,
          witr,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "تعذر حفظ المشاركة اليومية");

      setMessage(`تسجلت المشاركة اليومية. ربحت ${data.entry?.challenge_points ?? 0} نقطة تحدي`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "وقع مشكل");
    } finally {
      setLoading(false);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="bg-[var(--color-canvas)] border border-[var(--color-hairline-soft)] rounded-[var(--radius-lg)] p-6 md:p-8 space-y-4 shadow-sm">
        <div className="inline-flex items-center gap-2 text-[var(--color-primary)] text-[13px] font-[700] uppercase tracking-[0.2em]">
          <Sparkles className="w-4 h-4" />
          Challenge optional
        </div>
        <h3 className="text-[28px] font-[400] display-font text-[var(--color-ink)]">{CHALLENGE_TITLE}</h3>
        <p className="text-[var(--color-slate)] leading-[1.8]">
          التحدي اختياري. إلا بغيتي غير تبقى مع salawat راه عادي. وإذا بغيتي تدخل المنافسة، خاصك تدخل للحساب ديالك أولاً.
        </p>
        <a href="/login" className="btn-primary inline-flex items-center gap-2 w-fit">
          <LogIn className="w-4 h-4" />
          تسجيل الدخول
        </a>
      </div>
    );
  }

  // If the challenge has finished, show the user's final result (if any)
  if (isFinished) {
    return (
      <div className="bg-[var(--color-canvas)] border border-[var(--color-hairline-soft)] rounded-[var(--radius-lg)] p-6 md:p-8 space-y-4 shadow-sm">
        <div className="inline-flex items-center gap-2 text-[var(--color-primary)] text-[13px] font-[700] uppercase tracking-[0.2em]">
          <span className="text-lg">{"نتائج التحدي النهائية"}</span>
        </div>
        {finalResult ? (
          <div className="p-4 bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-hairline-strong)]">
            <p className="text-[16px] font-[700]">موقعك النهائي: <span className="text-[var(--color-primary)]">{finalResult.rank}</span></p>
            <p className="text-[14px] text-[var(--color-slate)]">نقاط إجمالية: {finalResult.totalPoints} — صلاوات: {finalResult.salawatPoints} — تحدي: {finalResult.challengePoints} — bonus: {finalResult.bonusPoints}</p>
          </div>
        ) : (
          <div className="p-4 bg-[var(--color-surface)] rounded-[var(--radius-md)] border border-[var(--color-hairline-strong)]">
            <p className="text-[14px] text-[var(--color-slate)]">ما كانتش مشاركة باسمك فالتحدي. ها هي الـ leaderboard النهائية باش تشوف النتائج.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-canvas)] border border-[var(--color-hairline-soft)] rounded-[var(--radius-lg)] p-6 md:p-8 space-y-5 shadow-sm">
      <div>
        <div className="inline-flex items-center gap-2 text-[var(--color-primary)] text-[13px] font-[700] uppercase tracking-[0.2em]">
          <Sparkles className="w-4 h-4" />
          {seasonLabel}
        </div>
        <h3 className="text-[28px] font-[400] display-font text-[var(--color-ink)] mt-3">{CHALLENGE_TITLE}</h3>
        <p className="text-[var(--color-slate)] leading-[1.8] mt-2">
          Salawat يبقى الأساس. هاد التحدي غير طبقة اختيارية للمنافسة الهادفة، وفيه الاسم المستعار باش يظهر فـ leaderboard.
        </p>
      </div>

      {!challengeOpen && (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-hairline-strong)] bg-[var(--color-surface)] p-4 text-[14px] text-[var(--color-slate)] leading-[1.7]">
          {challengeStatusText}
        </div>
      )}

      {canJoin && !isJoined && (
        <div className="space-y-3">
          <label className="block text-[14px] font-[600] text-[var(--color-ink)]">اسم مستعار</label>
          <input
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            placeholder="مثلا: نور، المجتهد، عبد الصمد..."
            className="w-full h-[54px] rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-hairline-strong)] px-4 text-[16px] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            maxLength={20}
          />
          <p className="text-[12px] text-[var(--color-slate)]">خاص يكون بين 2 و20 حرف، ومسموح بحروف/أرقام/مسافات و . _ -</p>
          <button
            type="button"
            onClick={submitJoin}
            disabled={loading || normalizedAlias.length < 2}
            className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PencilLine className="w-4 h-4" />}
            دخول للتحدي
          </button>
        </div>
      )}

      {challengeOpen && isJoined && canSubmit && (
        <div className="space-y-4 border-t border-[var(--color-hairline-soft)] pt-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-[13px] uppercase tracking-[0.15em] text-[var(--color-slate)] font-[700]">اسمك فـ leaderboard</p>
              <p className="text-[22px] font-[600] text-[var(--color-ink)] mt-1">{currentAlias}</p>
            </div>
            <span className="text-[12px] rounded-full border border-[var(--color-primary)]/25 bg-[var(--color-primary)]/10 px-3 py-1 text-[var(--color-primary)] font-[700]">
              Challenge day tracker
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-2">
                  <span className="text-[14px] font-[600] text-[var(--color-ink)]">قراية القرآن (أثمان الحزب)</span>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={quranPages}
                    onChange={(e) => setQuranPages(e.target.value)}
                    className="w-full h-[52px] rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-hairline-strong)] px-4 text-[16px] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                  <p className="text-[12px] text-[var(--color-slate)]">أدخل عدد أثمان الحزب لي قرأت (كل ثمن ≈ 1.25 صفحة)</p>
            </label>
            <div className="space-y-2">
              <span className="text-[14px] font-[600] text-[var(--color-ink)]">العادات اليومية</span>
              <div className="grid grid-cols-3 gap-2 text-[13px]">
                {[
                  { id: "siyam", label: "صيام", checked: siyam, setChecked: setSiyam },
                  { id: "chaf3", label: "شفع", checked: chaf3, setChecked: setChaf3 },
                  { id: "witr", label: "وتر", checked: witr, setChecked: setWitr },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => item.setChecked(!item.checked)}
                    className={`h-[52px] rounded-[var(--radius-md)] border px-3 transition-all ${item.checked ? "bg-[var(--color-primary)]/15 border-[var(--color-primary)] text-[var(--color-primary)]" : "bg-[var(--color-surface)] border-[var(--color-hairline-strong)] text-[var(--color-ink)]"}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={submitDailyEntry}
            disabled={loading}
            className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            حفظ مشاركة اليوم
          </button>

          <p className="text-[13px] text-[var(--color-slate)] leading-[1.7]">
            الصلوات الخمسة ديالك كيدخلو تلقائياً من التتبع اليومي، وهاد الواجهة غير كتسجل القرآن، الصيام، الشفع، والوتر.
          </p>
        </div>
      )}

      {!challengeOpen && isJoined && (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-hairline-strong)] bg-[var(--color-surface)] p-4 text-[14px] text-[var(--color-slate)] leading-[1.7]">
          ديجا سجلتي فالتحدي بـ <span className="text-[var(--color-primary)] font-[700]">{currentAlias}</span>. غير ملي يتفتح الموسم غادي تبان ليك المشاركة اليومية والleaderboard.
        </div>
      )}

      {(message || error) && (
        <div className={`rounded-[var(--radius-md)] border p-4 text-[14px] leading-[1.7] ${error ? "border-red-500/40 bg-red-500/10 text-red-200" : "border-green-500/40 bg-green-500/10 text-green-200"}`}>
          {error || message}
        </div>
      )}
    </div>
  );
}
