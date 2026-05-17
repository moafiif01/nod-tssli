export const CHALLENGE_KEY = "dhu_al_hijjah";
export const CHALLENGE_TITLE = "تحدي العشر الأوائل من ذي الحجة";
export const CHALLENGE_DESCRIPTION =
  "تحدي اختياري لمدة 10 أيام يجمع بين الصلاوات، قراية القرآن، الصيام، الشفع والوتر.";

export const CHALLENGE_POINTS = {
  quranPointsPerPage: 2,
  quranPageCap: 10,
  siyamPoints: 15,
  chaf3Points: 2,
  witrPoints: 2,
  dailyCompletionBonus: 10,
} as const;

export type ChallengeWindow = {
  startDate: Date;
  endDate: Date;
  startDateKey: string;
  endDateKey: string;
};

export type ChallengeParticipant = {
  user_id: string;
  alias: string;
  joined_at: string;
  updated_at: string;
};

export type ChallengeDailyEntry = {
  user_id: string;
  entry_date: string;
  quran_pages: number;
  siyam: boolean;
  chaf3: boolean;
  witr: boolean;
  updated_at?: string;
};

export type ChallengePrayerLog = {
  user_id: string;
  prayer: string;
  points_earned: number;
  logged_at: string;
};

export type ChallengeLeaderboardRow = {
  userId: string;
  alias: string;
  salawatPoints: number;
  challengePoints: number;
  bonusPoints: number;
  totalPoints: number;
  quranPages: number;
  siyamDays: number;
  chaf3Days: number;
  witrDays: number;
  completedDays: number;
  rank: number;
};

const pad = (value: number) => String(value).padStart(2, "0");

export const toUtcDateKey = (value: Date | string) => {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toISOString().split("T")[0];
};

export const parseChallengeWindow = (): ChallengeWindow | null => {
  const start = process.env.NEXT_PUBLIC_CHALLENGE_START_DATE;
  const end = process.env.NEXT_PUBLIC_CHALLENGE_END_DATE;

  if (!start || !end) {
    return null;
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return null;
  }

  return {
    startDate,
    endDate,
    startDateKey: toUtcDateKey(startDate),
    endDateKey: toUtcDateKey(endDate),
  };
};

export const getChallengeDayCount = (window: ChallengeWindow) => {
  const diffMs = window.endDate.getTime() - window.startDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
};

export const isChallengeWindowOpen = (window: ChallengeWindow, now = new Date()) => {
  const nowTime = now.getTime();
  return nowTime >= window.startDate.getTime() && nowTime <= window.endDate.getTime();
};

export const isChallengeWindowUpcoming = (window: ChallengeWindow, now = new Date()) =>
  now.getTime() < window.startDate.getTime();

export const normalizeAlias = (alias: string) => alias.trim().replace(/\s+/g, " ");

export const validateAlias = (alias: string) => {
  const normalized = normalizeAlias(alias);

  if (normalized.length < 2 || normalized.length > 20) {
    return "الاسم المستعار خاصو يكون ما بين 2 و20 حرف.";
  }

  const allowed = /^[\p{L}\p{N}\s._-]+$/u;
  if (!allowed.test(normalized)) {
    return "الاسم المستعار يقدر يحتوي على حروف، أرقام، مسافات، و . _ -";
  }

  return null;
};

export const computeChallengePoints = (entry: {
  quran_pages: number;
  siyam: boolean;
  chaf3: boolean;
  witr: boolean;
}) => {
  // Allow unlimited quran pages (no daily cap). Ensure non-negative number.
  const quranPages = Math.max(0, entry.quran_pages || 0);
  const quranPoints = quranPages * CHALLENGE_POINTS.quranPointsPerPage;
  const siyamPoints = entry.siyam ? CHALLENGE_POINTS.siyamPoints : 0;
  const chaf3Points = entry.chaf3 ? CHALLENGE_POINTS.chaf3Points : 0;
  const witrPoints = entry.witr ? CHALLENGE_POINTS.witrPoints : 0;

  return {
    quranPages,
    quranPoints,
    siyamPoints,
    chaf3Points,
    witrPoints,
    basePoints: quranPoints + siyamPoints + chaf3Points + witrPoints,
  };
};

export const isFullCompletion = (entry: {
  quran_pages: number;
  siyam: boolean;
  chaf3: boolean;
  witr: boolean;
}) => entry.quran_pages > 0 && entry.siyam && entry.chaf3 && entry.witr;

export const getChallengeProgressDays = (window: ChallengeWindow, now = new Date()) => {
  const todayKey = toUtcDateKey(now);
  const startKey = window.startDateKey;
  const endKey = window.endDateKey;
  if (todayKey < startKey) return 0;
  if (todayKey > endKey) return getChallengeDayCount(window);

  const msPerDay = 24 * 60 * 60 * 1000;
  const diff = Math.floor((now.getTime() - window.startDate.getTime()) / msPerDay) + 1;
  return Math.max(0, diff);
};

export const getDaysRemaining = (window: ChallengeWindow, now = new Date()) => {
  const endMs = window.endDate.getTime();
  const nowMs = now.getTime();
  return Math.max(0, Math.ceil((endMs - nowMs) / (1000 * 60 * 60 * 24)));
};
