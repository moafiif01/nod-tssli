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
      alert("✅ مبروك! الإشعارات تفعلات بنجاح.");
    } catch (err: any) {
      console.error("Subscribe failed:", err);
      alert("❌ وقع مشكل فاش بغينا نفعلو الإشعارات. واش درتي الـ SQL في Supabase؟");
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
      alert("🔕 تم إيقاف الإشعارات.");
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
        alert("🚀 صيفطنا ليك الإشعار! شيك دابا.");
      } else {
        alert("⚠️ المشكل: " + (data.message || "مالقيناش الجهاز ديالك مسجل. حاول طفي وعاود شعل الإشعارات."));
      }
    } catch (err) {
      console.error("Test failed:", err);
      alert("❌ وقع خطأ فاش بغينا نصيفطو التيست.");
    } finally {
      setIsTesting(false);
    }
  };

  if (status === "loading") return null;

  if (status === "unsupported") return (
    <div className="text-[13px] text-[var(--color-slate)] px-4 py-2 rounded-full border border-[var(--color-hairline-soft)] flex items-center gap-2">
      <span>🔕</span> الإشعارات مدعومة فقط في Chrome/Safari
    </div>
  );

  if (status === "denied") return (
    <div className="text-[13px] text-red-400 px-4 py-2 rounded-full border border-red-500/20 flex items-center gap-2">
      <span>🚫</span> الإشعارات محجوبة من الإعدادات
    </div>
  );

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={status === "subscribed" ? unsubscribe : subscribe}
        disabled={isLoading}
        className={`
          flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-[600] transition-all duration-300
          ${status === "subscribed"
            ? "bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20"
            : "bg-[var(--color-surface)] border border-[var(--color-hairline-strong)] text-[var(--color-ink)] hover:border-[var(--color-primary)]/50"
          }
          ${isLoading ? "opacity-60 cursor-not-allowed" : ""}
        `}
      >
        {isLoading ? (
          <span className="animate-spin">⏳</span>
        ) : status === "subscribed" ? (
          <span>🔔</span>
        ) : (
          <span>🔕</span>
        )}
        {isLoading
          ? "جاري..."
          : status === "subscribed"
          ? "الإشعارات مفعلة"
          : "فعّل الإشعارات"}
      </button>

      {status === "subscribed" && (
        <button
          onClick={testNotification}
          disabled={isTesting}
          className="px-4 py-2.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-hairline-soft)] text-[var(--color-slate)] text-[12px] font-[600] hover:border-[var(--color-primary)]/50 transition-all"
        >
          {isTesting ? "جاري الإرسال..." : "تجربة (Test)"}
        </button>
      )}
    </div>
  );
}
