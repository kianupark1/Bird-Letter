// 새 편지 서비스 워커: 앱을 닫아도 오는 알림(푸시)을 받아서 보여 줘요.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = { title: "새 편지", body: event.data ? event.data.text() : "" }; }
  const title = data.title || "새 편지";
  event.waitUntil(
    (async () => {
      // 앱이 눈앞에 열려 있으면 앱 안의 귀여운 팝업이 알려 주니까 중복으로 띄우지 않아요
      const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      if (wins.some((c) => c.visibilityState === "visible")) return;
      await self.registration.showNotification(title, {
        body: data.body || "",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: data.tag || "saepyeonji",
        data: { url: data.url || "/" },
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    (async () => {
      const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const c of wins) {
        if ("focus" in c) { await c.focus(); if ("navigate" in c) { try { await c.navigate(url); } catch {} } return; }
      }
      await self.clients.openWindow(url);
    })(),
  );
});
