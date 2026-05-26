"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const FALLBACK_TOTAL = 5000;
const numberFormatter = new Intl.NumberFormat("en-US");

type ArafahCounterState = {
  completed_count: number;
  target_count: number;
  updated_at: string;
};

const supabase = createClient();

export default function ArafahDhikrCounter() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [counter, setCounter] = useState<ArafahCounterState>({
    completed_count: 0,
    target_count: FALLBACK_TOTAL,
    updated_at: new Date().toISOString(),
  });

  useEffect(() => {
    let isMounted = true;

    async function loadCounter() {
      try {
        const { data, error } = await supabase.rpc("get_arafah_dhikr_counter");

        if (!isMounted) return;

        if (error) {
          console.error("Failed to load Arafah counter:", error);
          setLoading(false);
          return;
        }

        if (!error && data) {
          setCounter(data as ArafahCounterState);
        }

        setLoading(false);
      } catch (err) {
        console.error("Arafah counter load exception:", err);
        if (isMounted) setLoading(false);
      }
    }

    loadCounter();

    return () => {
      isMounted = false;
    };
  }, []);

  const completed = counter.completed_count;
  const target = counter.target_count || FALLBACK_TOTAL;
  const remaining = Math.max(target - completed, 0);
  const progressPercent = useMemo(() => (target > 0 ? (completed / target) * 100 : 0), [completed, target]);

  const handleClick = async () => {
    if (saving || loading || remaining <= 0) return;

    setSaving(true);
    setCounter((currentValue) => ({
      ...currentValue,
      completed_count: Math.min(currentValue.completed_count + 1, target),
    }));

    try {
      const { data, error } = await supabase.rpc("increment_arafah_dhikr_counter");

      if (error) {
        console.error("Failed to increment Arafah counter:", error);
        setSaving(false);
        return;
      }

      if (!error && data) {
        setCounter(data as ArafahCounterState);
      }
    } catch (err) {
      console.error("Arafah counter increment exception:", err);
    }

    setSaving(false);
  };

  return (
    <div className="mt-6 space-y-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading || saving || remaining <= 0}
        className="group relative flex w-full items-center justify-between gap-4 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-primary)]/25 bg-[var(--color-primary)]/10 px-5 py-4 text-left text-[var(--color-primary)] transition-all hover:bg-[var(--color-primary)]/15 hover:border-[var(--color-primary)]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]/70 disabled:cursor-not-allowed disabled:opacity-80"
      >
        <span
          className="absolute inset-y-0 left-0 bg-[linear-gradient(90deg,transparent,rgba(245,208,97,0.14),rgba(245,208,97,0.42),rgba(245,208,97,0.14),transparent)]"
          style={{ width: `${Math.max(progressPercent, 8)}%`, animation: "arafa-shine 4.5s linear infinite" }}
          aria-hidden="true"
        />
        <span className="relative z-10 flex min-w-0 flex-1 flex-col gap-2">
          <span className="text-[13px] md:text-[14px] uppercase tracking-[0.24em] text-[var(--color-charcoal)]/80">
            Arafah Dhikr Counter
          </span>
          <span className="text-[17px] md:text-[20px] font-[600] leading-[1.7]" dir="rtl">
            لاَ إِلَهَ إِلَّا اللَّهُ، وَحْدَهُ لاَ شَرِيكَ لَهُ، لَهُ المُلْكُ وَلَهُ الحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ
          </span>
        </span>
        <span className="relative z-10 shrink-0 rounded-full border border-[var(--color-primary)]/25 bg-[var(--color-canvas)]/60 px-4 py-2 text-[15px] font-[700] text-[var(--color-ink)]">
          {numberFormatter.format(completed)} / {numberFormatter.format(target)}
        </span>
      </button>

      <div className="rounded-[var(--radius-lg)] border border-[var(--color-hairline-soft)] bg-[var(--color-canvas)]/70 px-5 py-4">
        <div className="mb-3 flex items-center justify-between text-[13px] md:text-[14px] text-[var(--color-charcoal)]">
          <span>{numberFormatter.format(remaining)} remaining</span>
          <span>{progressPercent.toFixed(1)}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-[var(--color-surface)]">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-primary),var(--color-yellow-saturated))] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="mt-3 text-[13px] md:text-[14px] leading-[1.8] text-[var(--color-charcoal)]" dir="rtl">
          خيرُ الدُّعاءِ دُعاءُ يومِ عَرَفةَ، وخَيرُ ما قُلْتُ أنا والنبيُّونَ من قَبْلي: لا إلهَ إلَّا اللهُ وَحْدَه لا شَريكَ له، له المُلكُ، وله الحَمدُ، وهو على كلِّ شيءٍ قَديرٌ.
        </p>
      </div>
    </div>
  );
}