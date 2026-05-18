// Service Worker for #NOD_TSSLI Push Notifications
self.addEventListener("push", function (event) {
  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.body,
    icon: "/poster.png",
    badge: "/poster.png",
    vibrate: [200, 100, 200],
    data: { url: data.url || "/" },
    actions: [
      { action: "open", title: "نوض تصلي →" },
      { action: "close", title: "لاحقاً" },
    ],
    dir: "rtl",
    lang: "ar",
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  if (event.action === "close") return;

  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Defensive message handler: keeps the SW alive for async work,
// supports MessageChannel ports and falls back to client.postMessage.
self.addEventListener('message', function (event) {
  // Don't block on malformed events
  try {
    const data = event.data || {};

    // Helper to send a reply back to the sender
    const sendReply = (reply) => {
      try {
        // If a MessageChannel port is provided, use it (preferred)
        const port = event.ports && event.ports[0];
        if (port && typeof port.postMessage === 'function') {
          port.postMessage(reply);
          // close the port where appropriate
          try { port.close?.(); } catch (e) {}
          return;
        }

        // If the message came from a client, reply via event.source.postMessage
        if (event.source && typeof event.source.postMessage === 'function') {
          event.source.postMessage(reply);
          return;
        }

        // As a last resort broadcast to all clients
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
          for (const client of clientList) {
            try { client.postMessage(reply); } catch (e) {}
          }
        });
      } catch (err) {
        // swallow to avoid unhandled exceptions in handlers
        console.error('sw: sendReply error', err);
      }
    };

    // Keep worker alive while we process async tasks
    event.waitUntil((async () => {
      // Simple ping/pong support for callers that expect a response
      if (data && data.type === 'PING') {
        sendReply({ type: 'PONG', time: Date.now() });
        return;
      }

      // Example: caller asks the SW to open a URL
      if (data && data.type === 'OPEN_URL' && data.url) {
        try {
          const urlToOpen = String(data.url || '/');
          const matched = await clients.matchAll({ type: 'window', includeUncontrolled: true });
          for (const c of matched) {
            if (c.url === urlToOpen && 'focus' in c) {
              await c.focus();
              sendReply({ ok: true });
              return;
            }
          }
          if (clients.openWindow) {
            await clients.openWindow(urlToOpen);
            sendReply({ ok: true });
            return;
          }
          sendReply({ ok: false, reason: 'no-open-window' });
          return;
        } catch (err) {
          sendReply({ ok: false, error: String(err) });
          return;
        }
      }

      // Default behavior: acknowledge receipt so callers don't hang
      sendReply({ ok: true, echo: data });
    })());

  } catch (err) {
    // Defensive: don't let exceptions bubble from the message handler
    console.error('sw: message handler error', err);
  }
});
