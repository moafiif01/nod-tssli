"use client";

import { useState, useEffect } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function NotificationToggle({ userId }: { userId?: string }) {
  const [status, setStatus] = useState<"loading" | "unsupported" | "denied" | "subscribed" | "unsubscribed">("loading");
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }

    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }

    const checkSubscription = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        const sub = await reg.pushManager.getSubscription();
        setStatus(sub ? "subscribed" : "unsubscribed");
      } catch (err) {
        console.error("SW registration failed", err);
        setStatus("unsupported");
      }
    };

    checkSubscription();
  }, []);

  const subscribe = async () => {
    setIsLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });

      if (!res.ok) throw new Error("Failed to save subscription to database");

      setStatus("subscribed");
      showToast("✅ مبروك! الإشعارات تفعلات بنجاح.", "success");
    } catch (err: any) {
      console.error("Subscribe failed:", err);
      showToast("❌ وقع مشكل فاش بغينا نفعلو الإشعارات. واش درتي الـ SQL؟", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus("unsubscribed");
      showToast("🔕 تم إيقاف الإشعارات.", "info");
    } catch (err) {
      console.error("Unsubscribe failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const testNotification = async () => {
    setIsTesting(true);
    try {
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "تجربة إشعار #NOD_TSSLI 🔔",
          body: "تبارك الله عليك! هاهو التيست خدام. نوض تصلي دابا! ✨",
          url: "/profile",
          targetUserId: userId
        }),
      });

      const data = await res.json();
      if (data.sent > 0) {
        showToast("🚀 صيفطنا ليك الإشعار! شيك دابا.", "success");
      } else {
        showToast("⚠️ مالقيناش الجهاز ديالك مسجل. حاول طفي وشعل الإشعارات.", "error");
      }
    } catch (err) {
      console.error("Test failed:", err);
      showToast("❌ وقع خطأ فاش بغينا نصيفطو التيست.", "error");
    } finally {
      setIsTesting(false);
    }
  };

  if (status === "loading") return null;

  if (status === "unsupported") return (
    <div className="text-[13px] text-[var(--color-slate)] px-4 py-2 rounded-full border border-[var(--color-hairline-soft)] flex items-center gap-2 bg-[var(--color-surface)]">
      <span>🔕</span> الإشعارات غير مدعومة في هذا المتصفح
    </div>
  );

  if (status === "denied") return (
    <div className="text-[13px] text-red-400 px-4 py-2 rounded-full border border-red-500/20 flex items-center gap-2 bg-red-500/5">
      <span>🚫</span> الإشعارات محجوبة من إعدادات المتصفح
    </div>
  );

  return (
    <div className="flex flex-col items-center md:items-end gap-3 relative">
      <div className="flex items-center gap-2">
        <button
          onClick={status === "subscribed" ? unsubscribe : subscribe}
          disabled={isLoading}
          className={`
            flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-[600] transition-all duration-500 shadow-sm
            ${status === "subscribed"
              ? "bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 hover:border-[var(--color-primary)]"
              : "bg-[var(--color-surface)] border border-[var(--color-hairline-strong)] text-[var(--color-ink)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-cream)]"
            }
            ${isLoading ? "opacity-60 cursor-not-allowed" : ""}
          `}
        >
          {isLoading ? (
            <span className="animate-spin text-lg">⏳</span>
          ) : status === "subscribed" ? (
            <span className="text-lg">🔔</span>
          ) : (
            <span className="text-lg">🔕</span>
          )}
          {isLoading
            ? "جاري..."
            : status === "subscribed"
              ? "الإشعارات مفعلة"
              : "فعّل الإشعارات"}
        </button>

        {status === "subscribed" && (
          <div className="flex items-center gap-2">
            <button
              onClick={testNotification}
              disabled={isTesting}
              className="px-5 py-2.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-hairline-soft)] text-[var(--color-slate)] text-[12px] font-[600] hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)] transition-all duration-300 shadow-sm"
            >
              {isTesting ? "جاري..." : "تجربة (Test)"}
            </button>
            <button
              onClick={testBadgeNotification}
              disabled={isTesting}
              className="px-5 py-2.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-hairline-soft)] text-[var(--color-slate)] text-[12px] font-[600] hover:border-yellow-500/50 hover:text-yellow-500 transition-all duration-300 shadow-sm"
            >
              {isTesting ? "جاري..." : "تجربة وسام 🏅"}
            </button>
          </div>
        )}
      </div>

      {/* Premium Golden Toast */}
      {toast && (
        <div className={`
          fixed bottom-8 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3 rounded-xl border shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300
          ${toast.type === "success" ? "bg-[#0A0B10] border-[var(--color-primary)]/50 text-white" : ""}
          ${toast.type === "error" ? "bg-red-950 border-red-500/50 text-white" : ""}
          ${toast.type === "info" ? "bg-slate-900 border-slate-700/50 text-white" : ""}
        `}>
          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
            {toast.type === "success" && <span className="text-xl">✨</span>}
            {toast.type === "error" && <span className="text-xl">⚠️</span>}
            {toast.type === "info" && <span className="text-xl">🔔</span>}
          </div>
          <span className="text-[14px] font-[500]">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
