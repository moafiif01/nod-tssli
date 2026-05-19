import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";

const getVapidKeys = () => {
  const publicKey = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
  const privateKey = process.env.VAPID_PRIVATE_KEY || "";
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";
  return { publicKey, privateKey, subject };
};

export const initWebPush = () => {
  const { publicKey, privateKey, subject } = getVapidKeys();
  if (publicKey && privateKey) {
    try {
      webpush.setVapidDetails(subject, publicKey, privateKey);
    } catch (e) {
      console.error("Failed to set VAPID details:", e);
    }
  } else {
    console.warn("VAPID keys not configured for web-push");
  }
};

export async function sendPayloadToSubscriptions(admin: SupabaseClient, subs: any[], payloadObj: any) {
  const payload = JSON.stringify(payloadObj);
  const results = await Promise.allSettled(
    subs.map((row: any) => webpush.sendNotification(row.subscription, Buffer.from(payload, "utf8")))
  );

  // Clean up expired subscriptions (410/404)
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === "rejected") {
      const reason = (r as PromiseRejectedResult).reason;
      const statusCode = reason?.statusCode ?? reason?.status ?? null;
      if (statusCode === 410 || statusCode === 404) {
        const endpoint = subs[i]?.endpoint;
        if (endpoint) {
          try {
            await admin.from("push_subscriptions").delete().eq("endpoint", endpoint);
          } catch (e) {
            console.error("failed to delete expired subscription", endpoint, e);
          }
        }
      }
    }
  }

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;
  return { sent, failed, attempted: results.length };
}

export default getVapidKeys;
