import PrayerCheckIn from "@/components/PrayerCheckIn";
import CommunityDashboard from "@/components/CommunityDashboard";
import NoJudgmentCorner from "@/components/NoJudgmentCorner";
import ChallengeTeaser from "@/components/ChallengeTeaser";
import ArafahDhikrCounter from "@/components/ArafahDhikrCounter";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col bg-[var(--color-surface)]">

      {/* Hero Section (Poster Inspired Night & Gold theme) */}
      <section className="w-full flex flex-col items-center justify-center px-6 md:px-12 py-[80px] md:py-[120px] text-[var(--color-ink)] relative overflow-hidden bg-[var(--color-canvas)] border-b border-[var(--color-hairline-soft)]">
        {/* Architectural Background Image */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20 md:opacity-30 mix-blend-soft-light">
          <Image
            src="/ARC.png"
            alt="Background Architecture"
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-canvas)] via-transparent to-[var(--color-canvas)]/40"></div>
          <div className="absolute inset-0 bg-gradient-to-l from-[var(--color-canvas)]/60 via-transparent to-[var(--color-canvas)]/60"></div>
        </div>

        {/* Subtle gold glow behind the content */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-[var(--color-primary)] opacity-[0.03] blur-[140px] rounded-full pointer-events-none z-1"></div>

        <div className="max-w-[1280px] mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-[48px] md:gap-[80px] items-center relative z-10">
          
          {/* Left Column: Hero Card (Text first on mobile) */}
          <div className="order-1 md:order-2 bg-[var(--color-canvas)]/40 backdrop-blur-xl p-8 md:p-14 rounded-[var(--radius-xl)] shadow-2xl border border-[var(--color-primary)]/10">
            <h1 className="text-[40px] md:text-[72px] font-[400] leading-[1.05] mb-6 display-font text-[var(--color-ink)] tracking-tight">
              نوض تصلي.<br />بين يديك.
            </h1>
            <p className="text-[18px] md:text-[22px] text-[var(--color-primary)] mb-8 font-[400] display-font italic opacity-90">
              "إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا"
            </p>
            <p className="text-[16px] md:text-[18px] text-[var(--color-charcoal)] mb-10 font-[400] leading-[1.6] max-w-[500px]">
              منصة تدارت خصيصاً لطلاب ENSAM باش يعاونوا بعضياتهم على الصلاة. قرايتك مهمة، مي صلاتك أهم.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <a href="/login" className="btn-primary w-full sm:w-auto h-[56px] px-10 flex items-center justify-center">
                بدى دابا
              </a>
              <a href="/how-to-use" className="btn-secondary bg-transparent border-[var(--color-hairline-strong)] w-full sm:w-auto h-[56px] px-8 hover:bg-[var(--color-surface)] transition-all flex items-center justify-center">
                كيفاش كتخدم؟
              </a>
            </div>
            <ArafahDhikrCounter />
          </div>

          {/* Right Column: Poster Image */}
          <div className="order-2 md:order-1 w-full flex justify-center md:justify-start">
            <div className="relative w-full max-w-[460px] aspect-[4/5] rounded-[var(--radius-lg)] overflow-hidden shadow-2xl border border-white/5 transition-transform duration-300 hover:scale-[1.01]">
              <Image
                src="/poster.png"
                alt="#NOD_TSSALI Poster"
                fill
                sizes="(min-width: 768px) 460px, 100vw"
                className="object-cover"
                priority
              />
              {/* Inner gradient for text legibility if needed */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
            </div>
          </div>

        </div>
      </section>

      {/* Main Content Grid */}
      <section className="max-w-[1280px] mx-auto w-full px-6 md:px-12 py-[96px] grid grid-cols-1 lg:grid-cols-12 gap-[40px]">

        {/* Left Column (Main Interactions) */}
        <div className="lg:col-span-7 space-y-[64px]">
          {/* Section: Check-In */}
          <div className="bg-[var(--color-canvas)] rounded-[var(--radius-lg)] p-8 md:p-10 border border-[var(--color-hairline-soft)] shadow-sm">
            <h2 className="text-[36px] font-[500] text-[var(--color-ink)] mb-8 display-font">المتابعة اليومية</h2>
            <PrayerCheckIn />
          </div>
        </div>

        {/* Right Column (Community & Motivation) */}
        <div className="lg:col-span-5 space-y-[64px]">
          <NoJudgmentCorner />
        </div>
      </section>

      {/* Community Dashboard Section */}
      <section className="bg-[var(--color-canvas)] border-t border-[var(--color-hairline-soft)] w-full py-[96px] px-6 md:px-12">
        <div className="max-w-[1280px] mx-auto">
          <CommunityDashboard />
        </div>
      </section>

      <section className="bg-[var(--color-surface)] border-t border-[var(--color-hairline-soft)] w-full py-[96px] px-6 md:px-12">
        <div className="max-w-[1280px] mx-auto">
          <ChallengeTeaser />
        </div>
      </section>
    </div>
  );
}
