export default function HowToUsePage() {
  return (
    <div className="flex flex-col bg-[var(--color-surface)]">
      {/* Header Section */}
      <section className="w-full flex flex-col items-center justify-center px-6 md:px-12 py-[80px] md:py-[120px] text-[var(--color-ink)] relative overflow-hidden bg-[var(--color-canvas)] border-b border-[var(--color-hairline-soft)]">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-[var(--color-primary)] opacity-[0.03] blur-[140px] rounded-full pointer-events-none z-0"></div>

        <div className="max-w-[900px] mx-auto w-full relative z-10">
          <h1 className="text-[48px] md:text-[64px] font-[400] leading-[1.1] mb-6 display-font text-[var(--color-ink)] tracking-tight">
            كيفاش كتخدم؟
          </h1>
          <p className="text-[18px] md:text-[20px] text-[var(--color-charcoal)] font-[400] leading-[1.6]">
            استكشف جميع المميزات والأدوات المتاحة لتحسين علاقتك بالصلاة
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-[900px] mx-auto w-full px-6 md:px-12 py-[96px] space-y-[80px]">
        {/* Getting Started */}
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-bold">
              1
            </div>
            <div>
              <h2 className="text-[28px] font-[500] text-[var(--color-ink)] display-font mb-3">
                إنشاء حساب
              </h2>
              <p className="text-[16px] text-[var(--color-charcoal)] leading-[1.6]">
                قم بالتسجيل باستخدام بريدك الإلكتروني أو حسابك. هذا سيساعدك على حفظ تقدمك ومشاركة إنجازاتك مع المجتمع.
              </p>
            </div>
          </div>
        </div>

        {/* Prayer Check-In */}
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-bold">
              2
            </div>
            <div>
              <h2 className="text-[28px] font-[500] text-[var(--color-ink)] display-font mb-3">
                المتابعة اليومية للصلوات
              </h2>
              <p className="text-[16px] text-[var(--color-charcoal)] leading-[1.6] mb-4">
                على الصفحة الرئيسية، ستجد قسم &quot;المتابعة اليومية&quot; حيث يمكنك:
              </p>
              <ul className="space-y-2 text-[16px] text-[var(--color-charcoal)]">
                <li className="flex gap-3">
                  <span className="text-[var(--color-primary)]">✓</span>
                  <span>تسجيل الصلوات التي أديتها في وقتها</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[var(--color-primary)]">✓</span>
                  <span>تتبع أفضل جسور لك (أطول فترات متتالية من الصلاة)</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[var(--color-primary)]">✓</span>
                  <span>رؤية إحصائياتك الشخصية والبيانات التاريخية</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[var(--color-primary)]">✓</span>
                  <span>متابعة تقدمك عبر الزمن</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Community Features */}
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-bold">
              3
            </div>
            <div>
              <h2 className="text-[28px] font-[500] text-[var(--color-ink)] display-font mb-3">
                لوحة المجتمع
              </h2>
              <p className="text-[16px] text-[var(--color-charcoal)] leading-[1.6] mb-4">
                تابع إنجازات أصدقائك والمجتمع:
              </p>
              <ul className="space-y-2 text-[16px] text-[var(--color-charcoal)]">
                <li className="flex gap-3">
                  <span className="text-[var(--color-primary)]">✓</span>
                  <span>شاهد أفضل الأجسور في المجتمع</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[var(--color-primary)]">✓</span>
                  <span>تابع الأشخاص الأكثر التزاماً</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[var(--color-primary)]">✓</span>
                  <span>احصل على الإلهام من قصص الآخرين</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* No Judgment Corner */}
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-bold">
              4
            </div>
            <div>
              <h2 className="text-[28px] font-[500] text-[var(--color-ink)] display-font mb-3">
                ركن بدون محاكمة
              </h2>
              <p className="text-[16px] text-[var(--color-charcoal)] leading-[1.6]">
                مساحة آمنة للتعبير عن أفكارك وتحديات الصلاة. هنا لا توجد أحكام، فقط دعم ودعاء. شارك تجاربك واستمع لقصص الآخرين.
              </p>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-bold">
              5
            </div>
            <div>
              <h2 className="text-[28px] font-[500] text-[var(--color-ink)] display-font mb-3">
                التنبيهات والتذكيرات
              </h2>
              <p className="text-[16px] text-[var(--color-charcoal)] leading-[1.6] mb-4">
                فعّل التنبيهات لتحصل على:
              </p>
              <ul className="space-y-2 text-[16px] text-[var(--color-charcoal)]">
                <li className="flex gap-3">
                  <span className="text-[var(--color-primary)]">✓</span>
                  <span>تذكيرات لأوقات الصلاة</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[var(--color-primary)]">✓</span>
                  <span>نبهات عندما يقترب صيام أجسورك</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-[var(--color-primary)]">✓</span>
                  <span>تحديثات من المجتمع</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Profile */}
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-bold">
              6
            </div>
            <div>
              <h2 className="text-[28px] font-[500] text-[var(--color-ink)] display-font mb-3">
                ملفك الشخصي
              </h2>
              <p className="text-[16px] text-[var(--color-charcoal)] leading-[1.6]">
                اذهب إلى قسم &quot;الملف الشخصي&quot; لإدارة إعداداتك الشخصية وتفضيلاتك والتحكم في خصوصيتك.
              </p>
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div className="bg-[var(--color-canvas)] rounded-[var(--radius-lg)] p-8 md:p-10 border border-[var(--color-primary)]/20 space-y-4">
          <h2 className="text-[24px] font-[500] text-[var(--color-ink)] display-font">
            💡 نصائح مهمة
          </h2>
          <ul className="space-y-3 text-[16px] text-[var(--color-charcoal)]">
            <li className="flex gap-3">
              <span className="text-[var(--color-primary)]">→</span>
              <span>تحقق يومياً من صفحتك للبقاء محفزاً</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--color-primary)]">→</span>
              <span>شارك إنجازاتك مع أصدقائك وعائلتك</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--color-primary)]">→</span>
              <span>استخدم التنبيهات كمساعد لك، لكن لا تعتمد عليها تماماً</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--color-primary)]">→</span>
              <span>تذكر أن المنصة مساعد، والصلاة في وقتها هي الهدف الحقيقي</span>
            </li>
          </ul>
        </div>

        {/* CTA Section */}
        <div className="flex flex-col items-center gap-6 py-12 text-center">
          <h2 className="text-[32px] font-[500] text-[var(--color-ink)] display-font">
            مستعد لتبدأ رحلتك؟
          </h2>
          <p className="text-[16px] text-[var(--color-charcoal)] max-w-[500px]">
            انضم لآلاف الطلاب الذين بدأوا بالفعل مسارهم نحو الالتزام بالصلاة
          </p>
          <a href="/login" className="btn-primary h-[56px] px-12">
            ابدأ الآن
          </a>
        </div>
      </section>
    </div>
  );
}
