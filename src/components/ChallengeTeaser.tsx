export default function ChallengeTeaser() {
  return (
    <section className="bg-[var(--color-canvas)] border border-[var(--color-hairline-soft)] rounded-[var(--radius-lg)] p-6 md:p-8 shadow-sm">
      <div className="inline-flex items-center gap-2 text-[var(--color-primary)] text-[13px] font-[700] uppercase tracking-[0.2em] mb-3">
        تحدي موسمي
      </div>
      <h3 className="text-[32px] font-[400] display-font text-[var(--color-ink)] mb-3">العشر الأوائل من ذي الحجة</h3>
      <p className="text-[var(--color-slate)] leading-[1.8] mb-5 max-w-[900px]">
        إذا بغيتي تزيد شوية الحماس، دخل اختياريًا لتحدي 10 أيام فيه salawat، قراية القرآن، الصيام، الشفع، والوتر. والاسم اللي كتختار غادي يبان فـ leaderboard.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <a href="/challenge" className="btn-primary inline-flex items-center justify-center px-6 py-3">
          شوف التحدي
        </a>
        <a href="/login" className="btn-secondary inline-flex items-center justify-center px-6 py-3">
          تبغي غير salawat؟ كمّل هنا
        </a>
      </div>
    </section>
  );
}
