"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Lock, CheckCircle2, Loader2, ArrowRight } from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMessage("الكودات ما كيتشابهوش، عاود تشيك.");
      return;
    }

    if (password.length < 6) {
      setMessage("الكود خاص يكون فيه على الأقل 6 ديال الحروف أو الأرقام.");
      return;
    }

    setLoading(true);
    setMessage("");
    const supabase = createClient();
    
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      setMessage(`خطأ: ${error.message}`);
    } else {
      setSuccess(true);
      setMessage("تم تغيير الكود بنجاح! دابا يمكن ليك تدخل لحسابك.");
      setTimeout(() => {
        window.location.href = "/login";
      }, 3000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex w-full bg-[var(--color-canvas)]">
      {/* Left Column: Editorial/Brand Section */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-[var(--color-surface)] border-l border-[var(--color-hairline-soft)]">
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-canvas)] via-transparent to-transparent z-10"></div>
        <img 
          src="/poster.png" 
          alt="Nod Tssli Brand" 
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity"
        />
        
        <div className="relative z-20 w-full h-full flex flex-col justify-end p-20">
          <div className="mb-8">
            <h2 className="text-[var(--color-primary)] text-[24px] font-[400] display-font mb-4 italic">
              &quot;وَمَنْ يَتَّقِ اللَّهَ يَجْعَلْ لَهُ مَخْرَجًا&quot;
            </h2>
            <p className="text-[var(--color-ink)] text-[56px] leading-[1.1] display-font">
              بداية جديدة.<br/>
              بإيمان أقوى.
            </p>
          </div>
          <div className="sunset-stripe max-w-[200px]"></div>
        </div>
      </div>

      {/* Right Column: Reset Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-12">
        <div className="w-full max-w-[440px]">
          <div className="mb-12 text-center lg:text-right">
            <h1 className="text-[42px] font-[400] mb-4 text-[var(--color-ink)] display-font tracking-tight">
              تغيير الكود
            </h1>
            <p className="text-[var(--color-slate)] text-[17px]">
              دخل الكود الجديد ديالك باش تحمي الحساب ديالك وتكمل Silsila.
            </p>
          </div>

          {!success ? (
            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div>
                <label className="block text-[14px] font-[600] text-[var(--color-ink)] mb-2">الكود الجديد</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-slate)]" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-hairline-strong)] text-[var(--color-ink)] pl-[48px] pr-[16px] h-[56px] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all text-[16px]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[14px] font-[600] text-[var(--color-ink)] mb-2">تأكيد الكود الجديد</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-slate)]" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-hairline-strong)] text-[var(--color-ink)] pl-[48px] pr-[16px] h-[56px] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all text-[16px]"
                    required
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[56px] bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-[var(--radius-md)] font-[700] text-[16px] flex items-center justify-center gap-2 hover:bg-[var(--color-primary-deep)] transition-all transform active:scale-[0.98] disabled:opacity-70"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    تحديث الكود
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center p-8 bg-green-500/10 border border-green-500/30 rounded-[var(--radius-lg)] animate-in zoom-in-95">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-400" />
              </div>
              <h3 className="text-[24px] font-[600] text-green-100 mb-2">تم التحديث!</h3>
              <p className="text-green-200/70">غادي نحولوك لصفحة تسجيل الدخول دابا...</p>
            </div>
          )}

          {message && !success && (
            <div className="mt-8 p-4 rounded-[var(--radius-md)] border bg-red-500/10 border-red-500/50 text-red-200 flex items-start gap-3 animate-in fade-in zoom-in-95">
              <span className="text-[14px] font-[500]">{message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
