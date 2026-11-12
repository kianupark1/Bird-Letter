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
  if (res.ok) return "ok";
  // 앱을 지웠거나 토큰이 바뀌었으면 다시 보내도 소용없어요
  if (res.status === 404 || (res.status === 400 && /UNREGISTERED|INVALID_ARGUMENT/.test(await res.text()))) return "gone";
  return "fail";
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
