import { Users, TrendingUp, Award } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toLocalDateKey } from "@/lib/date";

export default async function CommunityDashboard() {
  // Dynamic stats initialized to 0
  let fajrToday = 0;
  let fajrYesterday = 0;
  let longestStreak = 0;
  let totalWeeklyPoints = 0;

  try {
    const today = toLocalDateKey();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = toLocalDateKey(yesterday);
    
    // 1. Fetch Fajr count for today and yesterday
    const { data: fajrData } = await supabase
      .from("community_stats")
      .select("total_prayers, stat_date")
      .eq("prayer", "fajr")
      .in("stat_date", [today, yesterdayStr]);
    
    if (fajrData) {
      const todayRecord = fajrData.find(d => d.stat_date === today);
      const yesterdayRecord = fajrData.find(d => d.stat_date === yesterdayStr);
      if (todayRecord) fajrToday = todayRecord.total_prayers;
      if (yesterdayRecord) fajrYesterday = yesterdayRecord.total_prayers;
    }

    // 2. Fetch max streak across all users securely
    const { data: maxStreakValue } = await supabase.rpc("get_max_streak");
      
    if (maxStreakValue !== null && maxStreakValue !== undefined) {
      longestStreak = maxStreakValue;
    }

    // 3. Fetch total points for the week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const { data: pointsData } = await supabase
      .from("prayer_logs")
      .select("points_earned")
      .gte("logged_at", oneWeekAgo.toISOString());
      
    if (pointsData && pointsData.length > 0) {
      totalWeeklyPoints = pointsData.reduce((acc, curr) => acc + curr.points_earned, 0);
    }
  } catch (error) {
    console.error("Error fetching dynamic stats:", error);
  }

  const fajrDiff = fajrToday - fajrYesterday;
  const fajrDiffText = fajrDiff >= 0 ? `+${fajrDiff} مقارنة بالبارح` : `${fajrDiff} مقارنة بالبارح`;
  const fajrDiffColor = fajrDiff >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-error)]";

  return (
    <div className="bg-[var(--color-canvas)] text-[var(--color-ink)] rounded-[var(--radius-lg)]">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b border-[var(--color-hairline-soft)] pb-6">
        <div>
          <h2 className="text-[32px] sm:text-[40px] md:text-[52px] font-[400] mb-2 display-font tracking-tight">إحصائيات المنصة</h2>
          <p className="text-[var(--color-slate)] text-[18px] font-[400]">
            شوف الدراري ديال ENSAM شنو دايرين اليوم.
          </p>
        </div>
        <div className="mt-4 md:mt-0 text-[14px] font-[600] text-[var(--color-muted)]">
          {new Intl.DateTimeFormat('ar-MA', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-[24px]">
        {/* Stat Card 1 */}
        <div className="bg-[var(--color-canvas)] rounded-[var(--radius-lg)] p-6 lg:p-8 border border-[var(--color-hairline-soft)] shadow-sm hover:bg-[var(--color-cream)] hover:border-[var(--color-primary)] transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center gap-3 mb-6 text-[var(--color-slate)] font-[500] text-[16px]">
            <Users className="w-5 h-5 text-[var(--color-primary)]" />
            <span>صلوا الفجر اليوم</span>
          </div>
          <div className="text-[56px] font-[400] display-font text-[var(--color-ink)]">{fajrToday}</div>
          <div className={`mt-4 text-[13px] font-[600] ${fajrDiffColor}`}>{fajrDiffText}</div>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-[var(--color-canvas)] rounded-[var(--radius-lg)] p-6 lg:p-8 border border-[var(--color-hairline-soft)] shadow-sm hover:bg-[var(--color-cream)] hover:border-[var(--color-primary)] transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center gap-3 mb-6 text-[var(--color-slate)] font-[500] text-[16px]">
            <TrendingUp className="w-5 h-5 text-[var(--color-primary)]" />
            <span>أطول Silsila</span>
          </div>
          <div className="text-[56px] font-[400] display-font text-[var(--color-ink)]">
            {longestStreak} <span className="text-[22px] font-[500] text-[var(--color-slate)] font-sans">يوم</span>
          </div>
          <div className="mt-4 text-[13px] font-[500] text-[var(--color-muted)]">من طلاب ENSAM</div>
        </div>

        {/* Weekly prayer points */}
        <div className="bg-[var(--color-canvas)] rounded-[var(--radius-lg)] p-6 lg:p-8 border border-[var(--color-hairline-soft)] shadow-sm hover:bg-[var(--color-cream)] hover:border-[var(--color-primary)] transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center gap-3 mb-6 text-[var(--color-ink)] font-[500] text-[16px]">
            <Award className="w-5 h-5 text-[var(--color-primary)]" />
            <span>مجموع النقط (هاد السيمانة)</span>
          </div>
          <div className="text-[56px] font-[400] display-font text-[var(--color-ink)]">{totalWeeklyPoints.toLocaleString()}</div>
          <div className="mt-4 text-[13px] font-[600] text-[var(--color-primary)]">تبارك الله على الشباب!</div>
        </div>
      </div>
    </div>
  );
}
