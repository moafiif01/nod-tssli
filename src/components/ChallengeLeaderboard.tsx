"use client";

import { useEffect, useState } from "react";
import { ChallengeLeaderboardRow } from "@/lib/challenge";
import AppleEmoji from "@/components/AppleEmoji";

type Props = {
  rows: ChallengeLeaderboardRow[];
  seasonLabel: string;
  currentUserId?: string | null;
};

const medalLabel = (rank: number) => {
  if (rank === 1) return <AppleEmoji hex="1f947" size="1.1rem" />;
  if (rank === 2) return <AppleEmoji hex="1f948" size="1.1rem" />;
  if (rank === 3) return <AppleEmoji hex="1f949" size="1.1rem" />;
  return `#${rank}`;
};

export default function ChallengeLeaderboard({ rows, seasonLabel, currentUserId = null }: Props) {
  const [rowsData, setRowsData] = useState<ChallengeLeaderboardRow[]>(rows || []);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let mounted = true;
    const fetchRows = async () => {
      try {
        const res = await fetch("/api/challenge/leaderboard");
        if (!res.ok) return;
        const data = await res.json();
        if (mounted && data?.rows) setRowsData(data.rows);
      } catch (e) {
        // ignore
      }
    };

    // initial fetch
    fetchRows();
    const id = setInterval(fetchRows, 30_000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(rowsData.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const visibleRows = rowsData.slice(startIndex, startIndex + pageSize);
  const pagesPerEighth = 10 / 8;

  useEffect(() => {
    if (!currentUserId) return;
    const currentRow = rowsData.find((row) => row.userId === currentUserId);
    if (!currentRow) return;

    const nextPage = Math.max(1, Math.ceil(currentRow.rank / pageSize));
    setPage((prev) => (prev === nextPage ? prev : nextPage));
  }, [currentUserId, rowsData]);

  const fmtEighths = (pages: number) => {
    const v = pages / pagesPerEighth;
    return Number.isInteger(v) ? String(v) : v.toFixed(1);
  };

  return (
    <div className="bg-[var(--color-canvas)] border border-[var(--color-hairline-soft)] rounded-[var(--radius-lg)] p-4 md:p-6 shadow-sm">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <p className="text-[13px] uppercase tracking-[0.2em] text-[var(--color-slate)] font-[700] flex items-center gap-2"><AppleEmoji hex="1f3c6" size="1rem" /> Leaderboard</p>
          <h3 className="text-[22px] md:text-[26px] font-[400] display-font text-[var(--color-ink)] mt-1">{seasonLabel}</h3>
        </div>
        <span className="text-[13px] rounded-full border border-[var(--color-primary)]/25 bg-[var(--color-primary)]/10 px-3 py-1 text-[var(--color-primary)] font-[700]">
          {rowsData.length} مشارك
        </span>
      </div>

      {visibleRows.length === 0 ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-hairline-strong)] bg-[var(--color-surface)] p-5 text-[var(--color-slate)] leading-[1.8]">
          مازال ما كاين حتى مشارك فهذ التحدي. أول واحد يدخل بالاسم المستعار ديالو غادي يبان مباشرة هنا.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full text-right">
              <thead>
                <tr className="text-[12px] text-[var(--color-slate)] uppercase tracking-[0.08em]">
                  <th className="px-3 py-2 text-left">رتبة</th>
                  <th className="px-3 py-2">الاسم</th>
                  <th className="px-3 py-2">الإجمالي</th>
                  <th className="px-3 py-2">صلوات</th>
                  <th className="px-3 py-2">تحدي</th>
                  <th className="px-3 py-2">Bonus</th>
                  <th className="px-3 py-2">القرآن (أثمان)</th>
                </tr>
              </thead>
              <tbody className="mt-2">
                {visibleRows.map((row) => {
                  const isCurrentUser = row.userId === currentUserId;
                  return (
                  <tr
                    key={row.userId}
                    className={`border-t border-[var(--color-hairline-strong)] ${row.rank <= 3 ? 'bg-[var(--color-primary)]/5' : ''} ${isCurrentUser ? 'outline outline-2 outline-[var(--color-primary)]/60 outline-offset-[-2px] bg-[var(--color-primary)]/10' : ''}`}
                  >
                    <td className="px-3 py-3 text-left font-[700]">
                      <div className="flex items-center gap-2">
                        {medalLabel(row.rank)} <span className="mr-2">{row.rank}</span>
                        {isCurrentUser && <span className="rounded-full border border-[var(--color-primary)]/40 bg-[var(--color-primary)]/15 px-2 py-0.5 text-[10px] font-[800] text-[var(--color-primary)]">أنت</span>}
                      </div>
                    </td>
                    <td className="px-3 py-3">{row.alias}</td>
                    <td className="px-3 py-3 font-[700]">{row.totalPoints}</td>
                    <td className="px-3 py-3">{row.salawatPoints}</td>
                    <td className="px-3 py-3">{row.challengePoints}</td>
                    <td className="px-3 py-3">{row.bonusPoints}</td>
                    <td className="px-3 py-3">{fmtEighths(row.quranPages)}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
              <div className="text-[13px] text-[var(--color-slate)]">
                الصفحة {currentPage} من {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="rounded-full border border-[var(--color-hairline-strong)] px-4 py-2 text-[13px] font-[700] text-[var(--color-ink)] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  السابق
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="rounded-full border border-[var(--color-hairline-strong)] px-4 py-2 text-[13px] font-[700] text-[var(--color-ink)] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  التالي
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value, suffix, strong }: { label: string; value: number; suffix?: string; strong?: boolean }) {
  return (
    <div className={`rounded-[var(--radius-md)] border border-[var(--color-hairline-soft)] bg-[var(--color-canvas)] px-3 py-2 ${strong ? "border-[var(--color-primary)]/25" : ""}`}>
      <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--color-slate)] font-[700]">{label}</div>
      <div className={`mt-1 ${strong ? "text-[20px] text-[var(--color-primary)]" : "text-[16px] text-[var(--color-ink)]"} font-[700]`}>
        {value}
        {suffix ? <span className="text-[12px] font-[500] text-[var(--color-slate)] mr-1">{suffix}</span> : null}
      </div>
    </div>
  );
}
