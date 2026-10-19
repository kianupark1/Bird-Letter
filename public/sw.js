// 새 편지 서비스 워커: 앱을 닫아도 오는 알림(푸시)을 받아서 보여 주고,
// 앱 파일과 화면을 폰에 담아 두어 열 때 인터넷을 기다리지 않고 "팍" 뜨게 해요(끊겨도 지난 화면이 떠요).
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
  // 화면(페이지)은 폰에 담아 둔 것을 바로 보여 주고(기다리지 않고 "팍"), 새것은 뒤에서 받아 둬요.
  // 받아 온 화면이 새 버전이면 열린 창에 알려서 바로(열자마자면) 또는 다음에 열 때 새 버전으로 바꿔요(src/app/layout.tsx UPDATE_SCRIPT).
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        const c = await caches.open(CACHE);
        const cached = await c.match(req, { ignoreSearch: true });
        const copy = cached && cached.clone(); // 화면에 내보내기 전에 복사해 둬요(버전 비교용)
        const net = fetch(req).then(async (res) => {
          if (res.ok && res.type === "basic" && !res.redirected) {
            const fresh = res.clone();
            const was = copy ? buildOf(await copy.text()) : "";
            const now = buildOf(await res.clone().text());
            await c.put(req, fresh);
            if (was && now && was !== now) {
              await prune(c);
              for (const w of await self.clients.matchAll({ type: "window" })) w.postMessage({ type: "new-version" });
            }
          }
          return res;
        });
        if (!cached) return net;
        event.waitUntil(net.catch(() => {}));
        return cached;
      })(),
    );
  }
});

// 화면 안에 적힌 배포 번호(Next.js buildId)
const buildOf = (html) => (html.match(/\\"b\\":\\"([\w-]+)\\"/) || [])[1] || "";

// 앱 파일이 너무 쌓이면 오래된 것부터 지워요(지워도 필요하면 다시 받아요)
async function prune(c) {
  const keys = (await c.keys()).filter((r) => new URL(r.url).pathname.startsWith("/_next/static/"));
  if (keys.length > 400) for (const k of keys.slice(0, keys.length - 250)) await c.delete(k);
}

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
