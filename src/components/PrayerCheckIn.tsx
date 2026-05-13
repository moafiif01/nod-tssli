"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Moon, Sun, Sunset, Flame, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

type Prayer = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

const getAppleEmoji = (hex: string) => `https://raw.githubusercontent.com/iamcal/emoji-data/master/img-apple-64/${hex}.png`;

const prayers: { id: Prayer; label: string; icon: React.ReactNode }[] = [
  { id: "fajr", label: "الفجر", icon: <img src={getAppleEmoji("1f305")} className="w-6 h-6" alt="Fajr" /> },
  { id: "dhuhr", label: "الظهر", icon: <img src={getAppleEmoji("2600-fe0f")} className="w-6 h-6" alt="Dhuhr" /> },
  { id: "asr", label: "العصر", icon: <img src={getAppleEmoji("1f324-fe0f")} className="w-6 h-6" alt="Asr" /> },
  { id: "maghrib", label: "المغرب", icon: <img src={getAppleEmoji("1f307")} className="w-6 h-6" alt="Maghrib" /> },
  { id: "isha", label: "العشاء", icon: <img src={getAppleEmoji("1f319")} className="w-6 h-6" alt="Isha" /> },
];

export default function PrayerCheckIn() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeLeft(`${hours}س و ${minutes}د`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, []);
  
  const [loggedPrayers, setLoggedPrayers] = useState<Record<Prayer, boolean>>({
    fajr: false,
    dhuhr: false,
    asr: false,
    maghrib: false,
    isha: false,
  });

  const [inMosque, setInMosque] = useState<Record<Prayer, boolean>>({
    fajr: false,
    dhuhr: false,
    asr: false,
    maghrib: false,
    isha: false,
  });

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      // Fetch user's current streak
      const { data: userData } = await supabase
        .from('users')
        .select('current_streak')
        .eq('id', user.id)
        .single();
        
      if (userData) setCurrentStreak(userData.current_streak);

      // Fetch today's logs
      const today = new Date().toISOString().split('T')[0];
      const { data: logs } = await supabase
        .from('prayer_logs')
        .select('prayer, prayed_in_mosque')
        .eq('user_id', user.id)
        .gte('logged_at', `${today}T00:00:00Z`);

      if (logs) {
        const newLogged = { ...loggedPrayers };
        const newMosque = { ...inMosque };
        logs.forEach(log => {
          newLogged[log.prayer as Prayer] = true;
          newMosque[log.prayer as Prayer] = log.prayed_in_mosque;
        });
        setLoggedPrayers(newLogged);
        setInMosque(newMosque);
      }
      
      setLoading(false);
    }
    loadData();
  }, []);

  const handleCheckIn = async (prayerId: Prayer) => {
    if (!userId) {
      setShowAuthModal(true);
      return;
    }

    const isMosque = inMosque[prayerId];
    
    // Optimistic UI update
    setLoggedPrayers((prev) => ({ ...prev, [prayerId]: true }));

    const { data, error } = await supabase.rpc('log_prayer', {
      p_prayer: prayerId,
      p_mosque: isMosque
    });

    if (error) {
      console.error(error);
      alert("وقع مشكل، عاود جرب.");
      // Revert optimistic update
      setLoggedPrayers((prev) => ({ ...prev, [prayerId]: false }));
    } else if (data) {
      setCurrentStreak(data.current_streak);
      
      // Check for new badges
      checkAndNotifyBadges(data.total_points, data.current_streak);
    }
  };

  const checkAndNotifyBadges = async (newPoints: number, streak: number) => {
    console.log("🏅 Badge check:", { newPoints, streak });

    let badgeName = "";
    let badgeEmoji = "";

    // --- Streak badges (exact hit) ---
    if (streak === 3)  { badgeName = "3 أيام متواصلة"; badgeEmoji = "🔥"; }
    else if (streak === 7)  { badgeName = "أسبوع كامل";    badgeEmoji = "⚡"; }
    else if (streak === 30) { badgeName = "شهر كامل";      badgeEmoji = "💫"; }

    // --- Points badges (threshold crossing) ---
    // A prayer gives 10 or 25 pts, so we check if the PREVIOUS value was below the threshold
    const pointMilestones = [
      { pts: 100, name: "نجم صاعد",  emoji: "⭐" },
      { pts: 250, name: "محترف",     emoji: "🏅" },
      { pts: 500, name: "أسطورة",    emoji: "🔱" },
    ];

    for (const m of pointMilestones) {
      // Crossed the milestone in this prayer (was below, now at or above)
      if (newPoints >= m.pts && newPoints - 25 < m.pts) {
        badgeName  = m.name;
        badgeEmoji = m.emoji;
        break;
      }
    }

    if (!badgeName) {
      console.log("No badge unlocked this prayer.");
      return;
    }

    console.log("🎉 Unlocking badge:", badgeName, "| userId:", userId);

    try {
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `وسام جديد! ${badgeEmoji}`,
          body: `بصحتك! ربحتي وسام "${badgeName}". تبارك الله عليك! ✨`,
          url: "/profile",
          targetUserId: userId,
        }),
      });
      const result = await res.json();
      console.log("Push result:", result);
    } catch (err) {
      console.error("Badge push failed:", err);
    }
  };

  const toggleMosque = (prayerId: Prayer) => {
    setInMosque((prev) => ({ ...prev, [prayerId]: !prev[prayerId] }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  const completedCount = Object.values(loggedPrayers).filter(Boolean).length;
  const progressPercent = (completedCount / 5) * 100;
  const allEmpty = completedCount === 0;

  return (
    <div className="flex flex-col w-full">
      {/* Daily Progress & Countdown Header */}
      <div className="bg-[var(--color-cream)] border border-[var(--color-primary)]/20 p-6 rounded-[var(--radius-lg)] mb-10 shadow-lg relative overflow-hidden">
        {/* Subtle glow effect */}
        <div className="absolute -right-4 -top-4 w-24 h-24 bg-[var(--color-primary)] opacity-10 blur-2xl rounded-full"></div>
        
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="flex-1 w-full">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[var(--color-ink)] font-[600] text-[16px] flex items-center gap-2">
                <img src={getAppleEmoji("2705")} className="w-5 h-5" alt="Completed" />
                إنجاز اليوم: {completedCount}/5 صلاوات
              </h4>
              <span className="text-[var(--color-primary)] font-[700] text-[18px]">{progressPercent}%</span>
            </div>
            {/* Progress Bar Container */}
            <div className="h-3 w-full bg-[var(--color-canvas)] rounded-full overflow-hidden border border-[var(--color-hairline-soft)]">
              <div 
                className="h-full bg-gradient-to-r from-[var(--color-primary-deep)] to-[var(--color-primary)] transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(245,208,97,0.4)]"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-2 border-t md:border-t-0 md:border-r border-[var(--color-hairline-soft)] pt-4 md:pt-0 md:pr-6">
            <div className="flex items-center gap-2 text-[var(--color-slate)] text-[13px] font-[500]">
              <img src={getAppleEmoji("1f525")} className="w-4 h-4" alt="Streak" />
              Silsila: {currentStreak} أيام
            </div>
            <div className="text-[var(--color-ink)] font-[600] text-[14px]">
               باقي <span className="text-[var(--color-primary)] font-[700]">{timeLeft}</span> باش يسالي النهار
            </div>
          </div>
        </div>
      </div>

      {allEmpty && (
        <div className="bg-[var(--color-surface)] border border-[var(--color-hairline-soft)] rounded-[var(--radius-lg)] p-[24px] text-center mb-8">
          <p className="text-[var(--color-slate)] text-[16px] font-[400]">مازال ما ماركيتي حتى صلاة اليوم، يلاه بدى!</p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {prayers.map((prayer) => {
          const isLogged = loggedPrayers[prayer.id];
          const isMosque = inMosque[prayer.id];

          return (
            <div
              key={prayer.id}
              className={cn(
                "flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-[var(--radius-lg)] transition-all",
                isLogged
                  ? "bg-[var(--color-surface)] border border-[var(--color-hairline-strong)]"
                  : "bg-[var(--color-canvas)] border border-[var(--color-hairline-soft)] hover:shadow-sm"
              )}
            >
              <div className="flex items-center gap-6 mb-4 sm:mb-0">
                  <div className="p-3 bg-[var(--color-cream)] rounded-[var(--radius-md)] border border-[var(--color-beige-deep)] shadow-sm">
                    {prayer.icon}
                  </div>
                  <div>
                    <h3 className="font-[500] text-[18px] text-[var(--color-ink)]">{prayer.label}</h3>
                    {isLogged && (
                      <span className="text-[13px] text-[var(--color-primary)] font-[600] flex items-center gap-1 mt-1">
                        <img src={getAppleEmoji("2705")} className="w-3.5 h-3.5" alt="Checked" /> تم التسجيل
                      </span>
                    )}
                  </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                {!isLogged ? (
                  <>
                    <div className="flex items-center gap-3">
                      {isMosque && (
                        <span className="text-[13px] font-[600] text-[var(--color-primary)] animate-in fade-in slide-in-from-right-2">
                          +25 نقطة
                        </span>
                      )}
                      <button
                        onClick={() => toggleMosque(prayer.id)}
                        className={cn(
                          "text-[14px] px-[20px] py-[10px] rounded-[var(--radius-full)] font-[600] transition-all border",
                          isMosque
                            ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] border-[var(--color-primary)] shadow-[0_0_15px_rgba(245,208,97,0.3)]"
                            : "bg-transparent text-[var(--color-ink)] border-[var(--color-hairline-strong)] hover:bg-[var(--color-surface)]"
                        )}
                      >
                        فالجامع
                      </button>
                    </div>
                    <button
                      onClick={() => handleCheckIn(prayer.id)}
                      className="btn-primary"
                    >
                      صليت
                    </button>
                  </>
                ) : (
                  <div className="text-[14px] font-[500] text-[var(--color-slate)] bg-[var(--color-canvas)] px-[20px] py-[10px] rounded-[var(--radius-md)] border border-[var(--color-hairline-soft)]">
                    {isMosque ? "صليتي فالجامع، تبارك الله!" : "تقبل الله"}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-[var(--color-canvas)]/80 backdrop-blur-sm"
            onClick={() => setShowAuthModal(false)}
          ></div>
          
          {/* Modal Content */}
          <div className="relative bg-[var(--color-surface)] border border-[var(--color-primary)]/30 rounded-[var(--radius-xl)] p-8 md:p-12 max-w-[440px] w-full shadow-2xl text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-[var(--color-cream)] rounded-full flex items-center justify-center mx-auto mb-8 border border-[var(--color-primary)]/20 shadow-[0_0_20px_rgba(245,208,97,0.1)]">
              <img src={getAppleEmoji("1f512")} className="w-10 h-10" alt="Lock" />
            </div>
            
            <h3 className="text-[32px] font-[400] text-[var(--color-ink)] mb-4 display-font tracking-tight">خصك تسجل الدخول</h3>
            <p className="text-[var(--color-slate)] text-[17px] mb-10 leading-relaxed">
              باش تماركي صلاتك وتجمع النقط وتدخل في Silsila مع الدراري ديال ENSAM، خاصك تدخل لحسابك.
            </p>
            
            <div className="flex flex-col gap-4">
              <a 
                href="/login" 
                className="w-full h-[56px] bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-[var(--radius-md)] font-[700] text-[16px] flex items-center justify-center gap-2 hover:bg-[var(--color-primary-deep)] transition-all shadow-[0_4px_15px_rgba(245,208,97,0.2)]"
              >
                تسجيل الدخول دابا
                <img src={getAppleEmoji("27a1-fe0f")} className="w-5 h-5 invert-[0.1]" alt="Arrow" />
              </a>
              <button 
                onClick={() => setShowAuthModal(false)}
                className="text-[15px] text-[var(--color-slate)] hover:text-[var(--color-ink)] transition-colors font-[500]"
              >
                رجع من بعد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
