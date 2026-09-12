import AppleEmoji from "@/components/AppleEmoji";

export default function NoJudgmentCorner() {
  return (
    <div className="bg-[var(--color-surface)] text-[var(--color-ink)] p-[32px] md:p-[48px] rounded-[var(--radius-xl)] border border-[var(--color-primary)]/10 shadow-2xl relative overflow-hidden group">
      {/* Background Decorative Element */}
      <div className="absolute -left-12 -top-12 w-48 h-48 bg-[var(--color-primary)] opacity-[0.03] blur-3xl rounded-full group-hover:opacity-[0.06] transition-opacity"></div>
      
      <div className="flex items-center gap-4 mb-10 relative z-10">
          <div className="w-12 h-12 bg-[var(--color-canvas)] rounded-full flex items-center justify-center border border-[var(--color-primary)]/20 shadow-lg">
          <AppleEmoji hex="2764-fe0f" size="1.6rem" />
        </div>
        <h2 className="text-[28px] md:text-[32px] font-[400] display-font tracking-tight leading-tight">ماشي مشكل، أهم حاجة هي ترجع</h2>
      </div>
      
      <div className="space-y-6 relative z-10">
        <div className="text-center p-10 bg-[var(--color-canvas)]/60 backdrop-blur-sm rounded-[var(--radius-lg)] border border-[var(--color-primary)]/10 shadow-inner group/verse">
          <p className="text-[26px] md:text-[32px] font-[400] text-[var(--color-primary)] leading-[1.8] display-font mb-4 italic group-hover/verse:scale-[1.01] transition-transform duration-700">
            &quot;أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ&quot;
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-8 bg-[var(--color-primary)]/30"></div>
            <p className="text-[13px] text-[var(--color-slate)] font-[600] tracking-widest uppercase">سورة الرعد — الآية 28</p>
            <div className="h-px w-8 bg-[var(--color-primary)]/30"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-8 bg-[var(--color-canvas)]/40 rounded-[var(--radius-lg)] border border-[var(--color-hairline-soft)] hover:border-[var(--color-primary)]/30 transition-colors">
            <p className="text-[18px] md:text-[20px] font-[400] text-[var(--color-ink)] leading-[1.8] mb-4">
              &quot;وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ۚ وَإِنَّهَا لَكَبِيرَةٌ إِلَّا عَلَى الْخَاشِعِينَ&quot;
            </p>
            <p className="text-[12px] text-[var(--color-slate)] font-[600]">سورة البقرة — 45</p>
          </div>

          <div className="p-8 bg-[var(--color-canvas)]/40 rounded-[var(--radius-lg)] border border-[var(--color-hairline-soft)] hover:border-[var(--color-primary)]/30 transition-colors">
            <p className="text-[18px] md:text-[20px] font-[400] text-[var(--color-ink)] leading-[1.8] mb-4">
              &quot;قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ&quot;
            </p>
            <p className="text-[12px] text-[var(--color-slate)] font-[600]">سورة الزمر — 53</p>
          </div>
        </div>
      </div>
    </div>
  );
}
