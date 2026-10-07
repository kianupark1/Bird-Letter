import { Receiver } from "@upstash/qstash";
import { NextResponse } from "next/server";
import webpush from "web-push";
import { validateSchedule } from "../../../../../core/pushPayload";

// QStash가 예약 시각에 부르는 곳. 서명이 맞는 요청만 받아서 폰으로 알림을 보내요.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const cur = process.env.QSTASH_CURRENT_SIGNING_KEY, next = process.env.QSTASH_NEXT_SIGNING_KEY;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY;
  if (!cur || !next || !pub || !priv) return NextResponse.json({ error: "not-configured" }, { status: 503 });

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

  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:hello@saepyeonji.app", pub, priv);
  try {
    await webpush.sendNotification(v.value.subscription, JSON.stringify(v.value.payload), { TTL: 24 * 3600, urgency: "high" });
  } catch (e: any) {
    // 폰이 알림을 껐거나 구독이 만료됐으면(404·410) 다시 시도해도 소용없어서 성공으로 끝내요
    if (e?.statusCode === 404 || e?.statusCode === 410) return NextResponse.json({ ok: true, gone: true });
    return NextResponse.json({ error: "send-failed" }, { status: 500 }); // 그 밖의 실패는 QStash가 다시 시도해요
  }
  return NextResponse.json({ ok: true });
}
