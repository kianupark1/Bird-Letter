// 새 편지 서비스 워커: 앱을 닫아도 오는 알림(푸시)을 받아서 보여 주고,
// 앱 파일을 폰에 담아 두어 열 때 "팍" 뜨게 해요(인터넷이 느리거나 끊겨도 지난 화면이 떠요).
const CACHE = "saepyeonji-v1";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) =>
  e.waitUntil(
    (async () => {
      for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
      await self.clients.claim();
    })(),
  ),
);

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  // 이름에 지문이 붙은 앱 파일·글씨 파일은 바뀌지 않으니 폰에 담아 둔 것을 바로 써요
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      (async () => {
        const c = await caches.open(CACHE);
        const hit = await c.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) c.put(req, res.clone());
        return res;
      })(),
    );
    return;
  }
  // 화면(페이지)은 새것을 먼저 받되, 3초 넘게 걸리거나 인터넷이 끊기면 지난번 화면을 보여 줘요
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        const c = await caches.open(CACHE);
        const net = fetch(req).then((res) => {
          if (res.ok && res.type === "basic") c.put(req, res.clone());
          return res;
        });
        const cached = await c.match(req, { ignoreSearch: true });
        if (!cached) return net;
        net.catch(() => {});
        return Promise.race([net.catch(() => cached), new Promise((r) => setTimeout(() => r(cached), 3000))]);
      })(),
    );
  }
});

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
        // 짹-짹-짹: 진동도 새가 쪼는 것처럼(소리는 폰 설정을 따라요)
        vibrate: [70, 50, 70, 50, 140],
        renotify: true,
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
