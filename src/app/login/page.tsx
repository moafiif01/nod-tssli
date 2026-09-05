"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { ArrowRight, Mail, Lock, User, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const translateError = (msg: string): { text: string; hint?: string } => {
    if (msg.includes("Email not confirmed"))
      return {
        text: "كودك صحيح ولكن خاصك تأكد الإيميل ديالك أولا.",
        hint: "📧 شيك الـ Inbox ديالك وكليك على رابط التأكيد. إذا ما لقيتيش الإيميل، شيك في Spam.",
      };
    if (msg.includes("Invalid login credentials"))
      return { text: "الإيميل أو الكود غلط. عاود مرة تانية." };
    if (msg.includes("User already registered"))
      return { text: "هاد الإيميل مسجل ديجا، دخل لحسابك أو غير الكود." };
    if (msg.includes("Password should be at least"))
      return { text: "الكود خاص يكون فيه على الأقل 6 حروف أو أرقام." };
    if (msg.includes("Email rate limit"))
      return { text: "تم إرسال رسائل كثيرة. انتظر شوية وعاود." };
    if (msg.includes("Unable to validate"))
      return { text: "إيميل غير صحيح. تأكد من الصيغة." };
    return { text: msg };
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createClient();
    
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        },
      });

      if (error) {
        const { text, hint } = translateError(error.message);
        setMessage(text + (hint ? `|${hint}` : ""));
      } else {
        setMessage("تم التسجيل بنجاح! شيك الـ Inbox ديالك وأكد الإيميل.|📧 إذا ما لقيتيش الإيميل، شيك في مجلد Spam.");
        setIsSignUp(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        const { text, hint } = translateError(error.message);
        setMessage(text + (hint ? `|${hint}` : ""));
      } else {
        window.location.href = "/";
      }
    }
    
    setLoading(false);
  };

  const handleResetPassword = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!email) {
      setMessage("عافاك دخل الإيميل ديالك أولا باش نصيفطو ليك رابط التغيير.");
      return;
    }
    
    setLoading(true);
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setMessage(`خطأ: ${error.message}`);
    } else {
      setMessage("تم إرسال رابط إعادة تعيين الكود للإيميل ديالك! تشيك الـ Inbox ديالك.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex w-full bg-[var(--color-canvas)]">
      {/* Left Column: Editorial/Brand Section (Hidden on Mobile) */}
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
              &quot;وَأْمُرْ أَهْلَكَ بِالصَّلَاةِ وَاصْطَبِرْ عَلَيْهَا&quot;
            </h2>
            <p className="text-[var(--color-ink)] text-[56px] leading-[1.1] display-font">
              نوض تصلي.<br/>
              بين يديك.
            </p>
          </div>
          <div className=" sunset-stripe max-w-[200px] mb-8"></div>
          <p className="text-[var(--color-slate)] text-[18px] max-w-[400px]">
            انضم لأكثر من 500 طالب من ENSAM الرباط اللي كيحافظوا على صلاتهم يومياً.
          </p>
        </div>
      </div>

      {/* Right Column: Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 md:p-12">
        <div className="w-full max-w-[440px]">
          <div className="mb-12 text-center lg:text-right">
            <h1 className="text-[42px] font-[400] mb-4 text-[var(--color-ink)] display-font tracking-tight">
              {isSignUp ? "حساب جديد" : "مرحبا بك من جديد"}
            </h1>
            <p className="text-[var(--color-slate)] text-[17px]">
              {isSignUp ? "سجل المعلومات ديالك باش تبدى تجمع النقط." : "دخل المعلومات ديالك باش تكمل Silsila ديالك."}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            {isSignUp && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                <label className="block text-[14px] font-[600] text-[var(--color-ink)] mb-2">الإسم الكامل</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-slate)]" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="مثلا: محمد أمين"
                    className="w-full bg-[var(--color-surface)] border border-[var(--color-hairline-strong)] text-[var(--color-ink)] pl-[48px] pr-[16px] h-[56px] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all text-[16px]"
                    required={isSignUp}
                  />
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-[14px] font-[600] text-[var(--color-ink)] mb-2">الإيميل (ENSAM)</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-slate)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@gmail.com"
                  className="w-full bg-[var(--color-surface)] border border-[var(--color-hairline-strong)] text-[var(--color-ink)] pl-[48px] pr-[16px] h-[56px] rounded-[var(--radius-md)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all text-[16px]"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[14px] font-[600] text-[var(--color-ink)]">الكود (Password)</label>
                {!isSignUp && (
                  <button 
                    type="button" 
                    onClick={handleResetPassword}
                    className="text-[13px] text-[var(--color-primary)] hover:underline font-[600]"
                  >
                    نسيتي الكود؟
                  </button>
                )}
              </div>
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
            
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[56px] bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-[var(--radius-md)] font-[700] text-[16px] flex items-center justify-center gap-2 hover:bg-[var(--color-primary-deep)] transition-all transform active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isSignUp ? "إنشاء حساب" : "تسجيل الدخول"}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-[var(--color-slate)] text-[15px]">
              {isSignUp ? "عندك حساب ديجا؟" : "مازال ما عندك حساب؟"}
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setMessage("");
                }}
                className="mr-2 text-[var(--color-primary)] font-[600] hover:underline"
              >
                {isSignUp ? "تسجيل الدخول" : "أنشئ حساب دابا"}
              </button>
            </p>
          </div>

          {message && (() => {
            const [mainMsg, hint] = message.split("|");
            const isSuccess = message.includes("نجاح") || message.includes("إرسال");
            return (
              <div className={cn(
                "mt-8 p-4 rounded-[var(--radius-md)] border flex items-start gap-3 animate-in fade-in zoom-in-95",
                isSuccess
                  ? "bg-green-500/10 border-green-500/50 text-green-200" 
                  : "bg-red-500/10 border-red-500/50 text-red-200"
              )}>
                {isSuccess && <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                <div>
                  <span className="text-[14px] font-[600]">{mainMsg}</span>
                  {hint && (
                    <p className="text-[12px] mt-2 opacity-80 leading-relaxed">{hint}</p>
                  )}
                </div>
              </div>
            );
          })()}

          <div className="mt-8 pt-5 border-t border-[var(--color-hairline-soft)] text-center">
            <p className="text-[13px] text-[var(--color-slate)] mb-3">عندك شي مشكل فالدخول؟ تواصل معنا:</p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-[14px]" dir="ltr">
              <a href="tel:+212688215547" className="text-[var(--color-slate)] hover:text-[var(--color-primary)] transition-colors">
                +212 688-215547
              </a>
              <span className="text-[var(--color-hairline-strong)]">•</span>
              <a href="mailto:nod.tssli@gmail.com" className="text-[var(--color-slate)] hover:text-[var(--color-primary)] transition-colors">
                nod.tssli@gmail.com
              </a>
              <span className="text-[var(--color-hairline-strong)]">•</span>
              <a
                href="https://www.instagram.com/p/DYRvob-tc18/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-slate)] hover:text-[var(--color-primary)] transition-colors"
              >
                Instagram
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
