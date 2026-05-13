import type { Metadata, Viewport } from "next";
import "./globals.css";
import { createClient } from "@/utils/supabase/server";

export const metadata: Metadata = {
  title: "#NOD_TSSLI - نوض تصلي",
  description: "منصة طلابية للمحافظة على الصلاة في وقتها - طلبة ENSAM Rabat",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Nod Tssli",
  },
};

export const viewport = {
  themeColor: "#0A0B10",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@400;500;600;700&family=EB+Garamond:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased min-h-screen flex flex-col bg-[var(--color-canvas)] text-[var(--color-ink)] font-sans">
        {/* Navigation Bar */}
        <nav className="h-[72px] bg-[var(--color-canvas)]/95 backdrop-blur-md text-[var(--color-ink)] flex items-center justify-between px-6 md:px-12 sticky top-0 z-50 border-b border-[var(--color-hairline-soft)] shadow-sm">
          <div className="flex items-center">
            <a href="/" className="text-[20px] md:text-[24px] font-[400] text-[var(--color-ink)] tracking-tight display-font hover:text-[var(--color-primary)] transition-colors" dir="ltr">
              #NOD_TSSLI
            </a>
          </div>

          <div className="flex items-center gap-4 md:gap-8 text-[13px] md:text-[14px] font-[500]">
            <a href="/" className="hover:text-[var(--color-primary)] transition-colors">الرئيسية</a>
            {user ? (
              <div className="flex items-center gap-4 md:gap-8">
                <a href="/profile" className="hover:text-[var(--color-primary)] transition-colors">الملف الشخصي</a>
                <form action="/auth/signout" method="post">
                  <button type="submit" className="text-[12px] md:text-[13px] border border-[var(--color-hairline-strong)] px-3 py-1.5 rounded-[var(--radius-md)] hover:bg-[var(--color-surface)] transition-all">
                    خروج
                  </button>
                </form>
              </div>
            ) : (
              <a href="/login" className="btn-primary text-[12px] md:text-[14px] px-4 py-2">تسجيل الدخول</a>
            )}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-grow">
          {children}
        </main>

        {/* The Signature Sunset Stripe */}
        <div className="sunset-stripe"></div>

        {/* Footer */}
        <footer className="bg-[var(--color-cream)] text-[var(--color-ink)] py-[64px] px-6 md:px-12 text-center">
          <p className="text-[28px] font-[400] display-font mb-4">الامتحان ما غيطيرش.</p>
          <p className="text-[14px] font-[400] text-[var(--color-slate)]">تم التصميم لطلاب ENSAM. قرايتك مهمة، صلاتك أهم.</p>
        </footer>
      </body>
    </html>
  );
}
