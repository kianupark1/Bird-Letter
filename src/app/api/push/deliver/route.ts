import { Receiver } from "@upstash/qstash";
import { NextResponse } from "next/server";
import webpush from "web-push";
import { isNativeSub, validateSchedule, type PushPayload } from "../../../../../core/pushPayload";
import { createAccessAssertion, parseServiceAccount } from "../../../../../core/serverAuth";

// QStash가 예약 시각에 부르는 곳. 서명이 맞는 요청만 받아서 폰으로 알림을 보내요.
// 웹(홈 화면 앱)은 웹 푸시로, 스토어 앱(안드로이드)은 FCM으로 보내요.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const gone = () => NextResponse.json({ ok: true, gone: true });

/** 스토어 앱으로 알림 보내기(FCM HTTP v1). 기기 토큰이 없어졌으면 "gone". */
async function sendFcm(token: string, p: PushPayload): Promise<"ok" | "gone" | "fail" | "not-configured"> {
  const sa = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (!sa) return "not-configured";
  const now = Math.floor(Date.now() / 1000);
  const t = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: createAccessAssertion(sa, "https://www.googleapis.com/auth/firebase.messaging", now) }),
  });
  if (!t.ok) return "fail";
  const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${(await t.json()).access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: {
        token,
        notification: { title: p.title, body: p.body },
        data: { url: p.url, tag: p.tag },
        android: { priority: "HIGH", ttl: "86400s", notification: { tag: p.tag, icon: "ic_stat_notify", color: "#C1481F" } },
      },
    }),
  });
  if (res.ok) return "ok";
  // 앱을 지웠거나 토큰이 바뀌었으면 다시 보내도 소용없어요
  if (res.status === 404 || (res.status === 400 && /UNREGISTERED|INVALID_ARGUMENT/.test(await res.text()))) return "gone";
  return "fail";
}

export async function POST(req: Request) {
  const cur = process.env.QSTASH_CURRENT_SIGNING_KEY, next = process.env.QSTASH_NEXT_SIGNING_KEY;
  if (!cur || !next) return NextResponse.json({ error: "not-configured" }, { status: 503 });

  const body = await req.text();
  const signature = req.headers.get("upstash-signature") ?? "";
  try {
    const ok = await new Receiver({ currentSigningKey: cur, nextSigningKey: next }).verify({ signature, body });
    if (!ok) throw new Error("bad-signature");
  } catch {
    return NextResponse.json({ error: "bad-signature" }, { status: 401 });
  }

  let data: any;
  try { data = JSON.parse(body); } catch { return NextResponse.json({ error: "bad-json" }, { status: 400 }); }
  // 예약할 때 걸렀던 규칙으로 한 번 더 확인(시각은 이미 도착했으니 지금으로 맞춰 통과시켜요)
  const v = validateSchedule({ ...data, at: Date.now() }, Date.now());
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  const { subscription, payload } = v.value;

  if (isNativeSub(subscription)) {
    const r = await sendFcm(subscription.fcm, payload).catch(() => "fail" as const);
    if (r === "ok") return NextResponse.json({ ok: true });
    if (r === "gone") return gone();
    if (r === "not-configured") return NextResponse.json({ error: "not-configured" }, { status: 503 });
    return NextResponse.json({ error: "send-failed" }, { status: 500 }); // QStash가 다시 시도해요
  }

  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return NextResponse.json({ error: "not-configured" }, { status: 503 });
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:hello@saepyeonji.app", pub, priv);
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload), { TTL: 24 * 3600, urgency: "high" });
  } catch (e: any) {
    // 폰이 알림을 껐거나 구독이 만료됐으면(404·410) 다시 시도해도 소용없어서 성공으로 끝내요
    if (e?.statusCode === 404 || e?.statusCode === 410) return gone();
    return NextResponse.json({ error: "send-failed" }, { status: 500 }); // 그 밖의 실패는 QStash가 다시 시도해요
  }
  return NextResponse.json({ ok: true });
}
