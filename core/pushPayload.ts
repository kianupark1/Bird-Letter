/**
 * 푸시 알림 예약 요청을 검사하는 규칙(서버가 받는 값은 전부 믿지 않고 여기서 걸러요).
 * 브라우저 → /api/push/schedule → 예약 서비스(QStash) → /api/push/deliver → 알림 서비스(구글·애플·모질라) → 폰
 */

export type PushSub = { endpoint: string; keys: { p256dh: string; auth: string } };
export type PushPayload = { title: string; body: string; url: string; tag: string };
export type ScheduleRequest = { subscription: PushSub; payload: PushPayload; at: number };

/** 예약은 이 기간 안에서만 받아요(느린 편지 중 가장 긴 것도 이보다 훨씬 짧아요) */
export const MAX_AHEAD_MS = 8 * 24 * 3600 * 1000;

// 폰의 알림 서비스 주소만 허용(아무 주소로나 요청을 보내게 만드는 걸 막아요)
const PUSH_HOSTS = [/(^|\.)fcm\.googleapis\.com$/, /(^|\.)push\.services\.mozilla\.com$/, /(^|\.)push\.apple\.com$/, /(^|\.)notify\.windows\.com$/];

const B64URL = /^[A-Za-z0-9_-]+={0,2}$/;

export function validateSchedule(input: unknown, nowMs: number): { ok: true; value: ScheduleRequest } | { ok: false; error: string } {
  const fail = (error: string) => ({ ok: false as const, error });
  if (!input || typeof input !== "object") return fail("요청 형식이 아니에요");
  const { subscription: s, payload: p, at } = input as Record<string, any>;

  if (!s || typeof s.endpoint !== "string" || s.endpoint.length > 600) return fail("구독 주소가 없어요");
  let host = "";
  try {
    const u = new URL(s.endpoint);
    if (u.protocol !== "https:") return fail("구독 주소는 https여야 해요");
    host = u.hostname;
  } catch { return fail("구독 주소가 올바르지 않아요"); }
  if (!PUSH_HOSTS.some((r) => r.test(host))) return fail("지원하지 않는 알림 서비스예요");
  const k = s.keys;
  if (!k || typeof k.p256dh !== "string" || typeof k.auth !== "string" || k.p256dh.length > 200 || k.auth.length > 60 || !B64URL.test(k.p256dh) || !B64URL.test(k.auth)) return fail("구독 키가 올바르지 않아요");

  if (!p || typeof p.title !== "string" || typeof p.body !== "string" || typeof p.url !== "string" || typeof p.tag !== "string") return fail("알림 내용이 없어요");
  if (p.title.length < 1 || p.title.length > 80) return fail("알림 제목 길이가 맞지 않아요");
  if (p.body.length > 160) return fail("알림 본문이 너무 길어요");
  if (!/^(\/|\/letter(\/|\?id=)[A-Za-z0-9_-]{1,64})$/.test(p.url)) return fail("알림이 열 주소가 올바르지 않아요");
  if (p.tag.length < 1 || p.tag.length > 100 || !/^[A-Za-z0-9_:.-]+$/.test(p.tag)) return fail("알림 표시가 올바르지 않아요");

  if (typeof at !== "number" || !Number.isFinite(at)) return fail("알림 시각이 없어요");
  if (at < nowMs - 60_000) return fail("이미 지난 시각이에요");
  if (at > nowMs + MAX_AHEAD_MS) return fail("너무 먼 시각이에요");

  return { ok: true, value: { subscription: { endpoint: s.endpoint, keys: { p256dh: k.p256dh, auth: k.auth } }, payload: { title: p.title, body: p.body, url: p.url, tag: p.tag }, at } };
}

/** 같은 구독·같은 알림은 한 번만 예약되도록 만드는 값(예약 서비스의 중복 방지에 써요) */
export function dedupKey(endpoint: string, tag: string) {
  let h = 5381;
  for (const ch of endpoint + "|" + tag) h = ((h << 5) + h + ch.charCodeAt(0)) >>> 0;
  return `${tag}-${h.toString(36)}`.slice(0, 120);
}
