import webpush from "web-push";
import { isNativeSub, type PushPayload, type PushSub, type WebSub } from "../../../core/pushPayload";
import { googleToken, serviceAccount } from "./google";

export type SendResult = "ok" | "gone" | "fail" | "not-configured";

/** 스토어 앱으로 알림 보내기(FCM HTTP v1). 기기 토큰이 없어졌으면 "gone". */
export async function sendFcm(token: string, p: PushPayload): Promise<SendResult> {
  const sa = serviceAccount();
  if (!sa) return "not-configured";
  const access = await googleToken(sa, "https://www.googleapis.com/auth/firebase.messaging").catch(() => "");
  if (!access) return "fail";
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: {
        token,
        notification: { title: p.title, body: p.body },
        data: { url: p.url, tag: p.tag },
        // 안드로이드: 짹짹 채널(letters, 새 빌드가 만듦 — 없으면 폰 기본 채널로) + 진동 (2026-11-12 대표님: "짹짹 소리, 진동과 함께")
        android: { priority: "HIGH", ttl: "86400s", notification: { tag: p.tag, icon: "ic_stat_notify", color: "#C1481F", channel_id: "letters", sound: "chirp", default_vibrate_timings: true, notification_priority: "PRIORITY_MAX" } },
        // 아이폰(APNs): 짹짹 소리(앱 안에 chirp.wav가 없으면 아이폰이 기본 소리로) + 같은 편지끼리 묶기
        apns: { payload: { aps: { sound: "chirp.wav", "thread-id": p.tag } } },
      },
    }),
  });
  if (res.ok) { void note(sa, "pushOk", { at: Date.now(), tag: p.tag.slice(0, 40) }); return "ok"; }
  const text = await res.text().catch(() => "");
  // 마지막 실패를 남겨 매일 숫자 점검에서 봐요(2026-11-17 아이폰 알림 안 옴 점검, 토큰은 안 남김)
  void note(sa, "pushFail", { at: Date.now(), status: res.status, detail: text.replace(/\s+/g, " ").slice(0, 300), tag: p.tag.slice(0, 40) });
  // 앱을 지웠거나 토큰이 바뀌었으면 다시 보내도 소용없어요
  if (res.status === 404 || (res.status === 400 && /UNREGISTERED|INVALID_ARGUMENT/.test(text))) return "gone";
  return "fail";
}

/** 운영 기록 한 줄(ops/{name}) — 실패해도 알림 보내기에는 영향 없음 */
async function note(sa: NonNullable<ReturnType<typeof serviceAccount>>, name: string, data: Record<string, string | number>) {
  try {
    const t = await googleToken(sa);
    const fields = Object.fromEntries(Object.entries(data).map(([k, v]) => [k, typeof v === "number" ? { integerValue: String(Math.round(v)) } : { stringValue: v }]));
    await fetch(`https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents/ops/${name}`, { method: "PATCH", headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" }, body: JSON.stringify({ fields }) });
  } catch {}
}

/** 웹 푸시(홈 화면 앱) */
export async function sendWeb(sub: WebSub, p: PushPayload): Promise<SendResult> {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return "not-configured";
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:hello@saepyeonji.app", pub, priv);
  try {
    await webpush.sendNotification(sub, JSON.stringify(p), { TTL: 24 * 3600, urgency: "high" });
    return "ok";
  } catch (e: any) {
    // 폰이 알림을 껐거나 구독이 만료됐으면(404·410) 다시 시도해도 소용없어요
    if (e?.statusCode === 404 || e?.statusCode === 410) return "gone";
    return "fail";
  }
}

export const sendPush = (sub: PushSub, p: PushPayload) => (isNativeSub(sub) ? sendFcm(sub.fcm, p) : sendWeb(sub, p));
