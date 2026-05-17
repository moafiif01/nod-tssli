"use client";

import AppleEmoji from "@/components/AppleEmoji";

type Badge = {
  id: string;
  nameAr: string;
  descAr: string;
  emoji: string; // Apple emoji hex code
  earned: boolean;
  rarity: "common" | "rare" | "epic" | "legendary";
};

type Props = {
  totalPoints: number;
  maxStreak: number;
  currentStreak: number;
  totalPrayers: number;
};

export default function BadgesSection({
  totalPoints,
  maxStreak,
  currentStreak,
  totalPrayers,
}: Props) {
  const badges: Badge[] = [
    // --- First Steps ---
    {
      id: "first_prayer",
      nameAr: "البداية",
      descAr: "سجلتي أول صلاة ديالك 🌱",
      emoji: "1f331",
      earned: totalPrayers >= 1,
      rarity: "common",
    },
    {
      id: "ten_prayers",
      nameAr: "على الطريق",
      descAr: "سجلتي 10 صلوات",
      emoji: "2b50",
      earned: totalPrayers >= 10,
      rarity: "common",
    },
    {
      id: "fifty_prayers",
      nameAr: "ثابت(ة)",
      descAr: "سجلتي 50 صلاة",
      emoji: "1f31f",
      earned: totalPrayers >= 50,
      rarity: "rare",
    },

    // --- Streak Badges ---
    {
      id: "streak_3",
      nameAr: "3 أيام متواصلة",
      descAr: "سلسلة 3 أيام ما تقطعتش",
      emoji: "1f525",
      earned: maxStreak >= 3,
      rarity: "common",
    },
    {
      id: "streak_7",
      nameAr: "أسبوع كامل",
      descAr: "سلسلة 7 أيام متواصلة 🔥",
      emoji: "26a1",
      earned: maxStreak >= 7,
      rarity: "rare",
    },
    {
      id: "streak_14",
      nameAr: "أسبوعين",
      descAr: "سلسلة 14 يوم متواصلة",
      emoji: "1f4ab",
      earned: maxStreak >= 14,
      rarity: "rare",
    },
    {
      id: "streak_30",
      nameAr: "شهر كامل",
      descAr: "سلسلة 30 يوم بدون انقطاع — هادشي مزيان!",
      emoji: "1f30d",
      earned: maxStreak >= 30,
      rarity: "epic",
    },
    {
      id: "streak_100",
      nameAr: "100 يوم",
      descAr: "مية يوم متواصلة. أنت قدوة لكل واحد!",
      emoji: "1f9e0",
      earned: maxStreak >= 100,
      rarity: "legendary",
    },

    // --- Points Badges ---
    {
      id: "points_100",
      nameAr: "نجم صاعد",
      descAr: "جمعتي 100 نقطة",
      emoji: "1f31f",
      earned: totalPoints >= 100,
      rarity: "common",
    },
    {
      id: "points_500",
      nameAr: "محترف",
      descAr: "جمعتي 500 نقطة",
      emoji: "1f3c5",
      earned: totalPoints >= 500,
      rarity: "rare",
    },
    {
      id: "points_1000",
      nameAr: "الألف",
      descAr: "جمعتي 1,000 نقطة",
      emoji: "1f3c6",
      earned: totalPoints >= 1000,
      rarity: "epic",
    },
    {
      id: "points_5000",
      nameAr: "الأسطورة",
      descAr: "جمعتي 5,000 نقطة — أنت الأفضل!",
      emoji: "1f451",
      earned: totalPoints >= 5000,
      rarity: "legendary",
    },

    // --- Special ---
    {
      id: "active_streak",
      nameAr: "نار حية",
      descAr: "سلسلتك الحالية 7 أيام فما فوق",
      emoji: "1f4a5",
      earned: currentStreak >= 7,
      rarity: "epic",
    },
  ];

  const rarityConfig = {
    common: {
      label: "عادي",
      border: "border-[var(--color-hairline-soft)]",
      glow: "",
      badge: "bg-[var(--color-slate)]/10 text-[var(--color-slate)]",
    },
    rare: {
      label: "نادر",
      border: "border-blue-500/30",
      glow: "shadow-[0_0_16px_rgba(59,130,246,0.15)]",
      badge: "bg-blue-500/10 text-blue-300",
    },
    epic: {
      label: "ملحمي",
      border: "border-purple-500/30",
      glow: "shadow-[0_0_16px_rgba(168,85,247,0.15)]",
      badge: "bg-purple-500/10 text-purple-300",
    },
    legendary: {
      label: "أسطوري",
      border: "border-[var(--color-primary)]/40",
      glow: "shadow-[0_0_24px_rgba(245,208,97,0.2)]",
      badge: "bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
    },
  };

  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <div className="mb-12">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-8 border-b border-[var(--color-hairline-soft)] pb-4">
        <h2 className="text-[36px] font-[400] text-[var(--color-ink)] display-font">
          الأوسمة ديالك
        </h2>
        <div className="text-[14px] font-[600] text-[var(--color-slate)] bg-[var(--color-surface)] px-4 py-2 rounded-full border border-[var(--color-hairline-soft)]">
          {earnedCount} / {badges.length}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="h-2 bg-[var(--color-surface)] rounded-full overflow-hidden border border-[var(--color-hairline-soft)]">
          <div
            className="h-full bg-gradient-to-l from-[var(--color-primary)] to-[var(--color-primary-deep)] rounded-full transition-all duration-1000"
            style={{ width: `${(earnedCount / badges.length) * 100}%` }}
          />
        </div>
        <p className="text-[13px] text-[var(--color-slate)] mt-2 text-left">
          {Math.round((earnedCount / badges.length) * 100)}% من الأوسمة
        </p>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {badges.map((badge) => {
          const config = rarityConfig[badge.rarity];
          return (
            <div
              key={badge.id}
              className={`
                relative group flex flex-col items-center text-center p-5 rounded-[var(--radius-lg)] border transition-all duration-300
                ${badge.earned
                  ? `bg-[var(--color-canvas)] ${config.border} ${config.glow} hover:-translate-y-1 cursor-default`
                  : "bg-[var(--color-canvas)]/40 border-[var(--color-hairline-soft)] opacity-40 grayscale"
                }
              `}
              title={badge.earned ? badge.descAr : `🔒 ${badge.descAr}`}
            >
              {/* Rarity Badge */}
              {badge.earned && (
                <span className={`absolute -top-2 right-2 text-[10px] font-[700] px-2 py-0.5 rounded-full ${config.badge}`}>
                  {config.label}
                </span>
              )}

              {/* Emoji Icon */}
              <div className={`w-14 h-14 mb-3 flex items-center justify-center rounded-full transition-transform duration-300 ${badge.earned ? "group-hover:scale-110" : ""} ${badge.rarity === "legendary" && badge.earned ? "bg-[var(--color-primary)]/10" : "bg-[var(--color-surface)]"}`}>
                {badge.earned ? (
                  <span className="text-3xl leading-none" aria-hidden="true">
                    <AppleEmoji hex={badge.emoji} size="2rem" />
                  </span>
                ) : (
                  <span className="text-2xl">🔒</span>
                )}
              </div>

              {/* Badge Name */}
              <p className={`text-[13px] font-[600] leading-tight ${badge.earned ? "text-[var(--color-ink)]" : "text-[var(--color-muted)]"}`}>
                {badge.nameAr}
              </p>

              {/* Tooltip on hover */}
              {badge.earned && (
                <p className="text-[11px] text-[var(--color-slate)] mt-1 leading-snug opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {badge.descAr}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
