import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import BadgesSection from "@/components/BadgesSection";

export const dynamic = "force-dynamic";

const getAppleEmoji = (hex: string) => `https://raw.githubusercontent.com/iamcal/emoji-data/master/img-apple-64/${hex}.png`;

export default async function ProfilePage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch User Stats
  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch recent prayer history (last 10 logs)
  const { data: recentLogs } = await supabase
    .from("prayer_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("logged_at", { ascending: false })
    .limit(10);

  // Fetch total prayer count for badges
  const { count: totalPrayers } = await supabase
    .from("prayer_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const prayerNames: Record<string, string> = {
    fajr: "الفجر",
    dhuhr: "الظهر",
    asr: "العصر",
    maghrib: "المغرب",
    isha: "العشاء",
  };

  return (
    <div className="max-w-[1000px] mx-auto py-[96px] px-6 md:px-12 w-full">
      
      {/* Header Profile Section */}
      <div className="bg-[var(--color-cream)] text-[var(--color-ink)] p-[48px] rounded-[var(--radius-lg)] border border-[var(--color-beige-deep)] flex flex-col md:flex-row items-center gap-8 mb-12 shadow-sm transition-all duration-300 transform hover:-translate-y-1">
        <div className="w-[120px] h-[120px] bg-[var(--color-surface)] flex items-center justify-center rounded-[var(--radius-xl)] border border-[var(--color-hairline-soft)]">
          <img src={getAppleEmoji("1f464")} className="w-16 h-16" alt="User" />
        </div>
        <div className="text-center md:text-right flex-1">
          <h1 className="text-[48px] font-[400] mb-2 text-[var(--color-ink)] display-font">
            {userData?.full_name || "طالب(ة) ENSAM"}
          </h1>
          <div className="flex flex-col md:flex-row items-center gap-4 text-[16px] font-[500] text-[var(--color-slate)]">
            <span className="flex items-center gap-2">
              <img src={getAppleEmoji("1f4cc")} className="w-5 h-5" alt="Location" />
              {userData?.university || "ENSAM Rabat"}
            </span>
            <span className="hidden md:inline text-[var(--color-hairline-strong)]">|</span>
            <span>{userData?.email}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[24px] mb-12">
        <div className="bg-[var(--color-canvas)] border border-[var(--color-hairline-soft)] p-[32px] rounded-[var(--radius-lg)] shadow-sm hover:bg-[var(--color-cream)] hover:border-[var(--color-primary)] transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center gap-3 mb-6 text-[var(--color-slate)] font-[500] text-[16px]">
            <img src={getAppleEmoji("1f3c6")} className="w-5 h-5" alt="Points" />
            <span>مجموع النقط</span>
          </div>
          <div className="text-[56px] font-[400] leading-none text-[var(--color-ink)] display-font">
            {userData?.total_points || 0}
          </div>
        </div>

        <div className="bg-[var(--color-canvas)] border border-[var(--color-hairline-soft)] p-[32px] rounded-[var(--radius-lg)] shadow-sm hover:bg-[var(--color-cream)] hover:border-[var(--color-primary)] transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center gap-3 mb-6 text-[var(--color-slate)] font-[500] text-[16px]">
            <img src={getAppleEmoji("1f525")} className="w-5 h-5" alt="Streak" />
            <span>Silsila الحالية</span>
          </div>
          <div className="text-[56px] font-[400] leading-none text-[var(--color-ink)] display-font">
            {userData?.current_streak || 0}
            <span className="text-[22px] font-sans font-[500] mr-2 text-[var(--color-slate)]">أيام</span>
          </div>
        </div>

        <div className="bg-[var(--color-canvas)] border border-[var(--color-hairline-soft)] p-[32px] rounded-[var(--radius-lg)] shadow-sm hover:bg-[var(--color-cream)] hover:border-[var(--color-primary)] transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center gap-3 mb-6 text-[var(--color-slate)] font-[500] text-[16px]">
            <img src={getAppleEmoji("1f4c5")} className="w-5 h-5" alt="Max Streak" />
            <span>أطول Silsila</span>
          </div>
          <div className="text-[56px] font-[400] leading-none text-[var(--color-ink)] display-font">
            {userData?.max_streak || 0}
            <span className="text-[22px] font-sans font-[500] mr-2 text-[var(--color-slate)]">أيام</span>
          </div>
        </div>
      </div>

      {/* Achievement Badges */}
      <BadgesSection
        totalPoints={userData?.total_points || 0}
        maxStreak={userData?.max_streak || 0}
        currentStreak={userData?.current_streak || 0}
        totalPrayers={totalPrayers || 0}
      />

      {/* History Section */}
      <h2 className="text-[36px] font-[400] mb-8 text-[var(--color-ink)] border-b border-[var(--color-hairline-soft)] pb-4 display-font">
        أخر الصلاوات لي ماركيتي
      </h2>

      {(!recentLogs || recentLogs.length === 0) ? (
        <div className="bg-[var(--color-surface)] p-[48px] text-center rounded-[var(--radius-lg)] border border-[var(--color-hairline-soft)]">
          <p className="text-[16px] font-[400] text-[var(--color-slate)]">باقي ما ماركيتي حتى صلاة. نوض تصلي وبدى تجمع النقط!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recentLogs.map((log) => (
            <div key={log.id} className="bg-[var(--color-canvas)] border border-[var(--color-hairline-soft)] p-[24px] rounded-[var(--radius-lg)] flex flex-col sm:flex-row sm:items-center justify-between transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5 hover:border-[var(--color-primary)]/30">
              
              <div className="flex items-center gap-6 mb-4 sm:mb-0">
                <div className="w-12 h-12 bg-[var(--color-cream)] flex items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-beige-deep)] shadow-sm">
                  <img src={getAppleEmoji("1f54c")} className="w-7 h-7" alt="Mosque" />
                </div>
                <div>
                  <h3 className="text-[18px] font-[600] text-[var(--color-ink)]">صلاة {prayerNames[log.prayer] || log.prayer}</h3>
                  <p className="text-[14px] font-[400] text-[var(--color-slate)] mt-1">
                    {new Intl.DateTimeFormat('ar-MA', { 
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                    }).format(new Date(log.logged_at))}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {log.prayed_in_mosque && (
                  <span className="text-[13px] font-[600] bg-[var(--color-primary)] text-[var(--color-on-primary)] px-4 py-1.5 rounded-[var(--radius-full)] shadow-[0_0_10px_rgba(245,208,97,0.2)]">
                    فالجامع
                  </span>
                )}
                <span className="text-[18px] font-[600] text-[var(--color-primary)]">
                  +{log.points_earned} نقطة
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
