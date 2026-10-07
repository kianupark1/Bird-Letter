import { Client } from "@upstash/qstash";
import { NextResponse } from "next/server";
import { dedupKey, validateSchedule } from "../../../../../core/pushPayload";

// 폰이 "이 시각에 이 알림을 보내 줘"를 맡기는 곳. 예약은 QStash(무료 한도 있음)가 시각까지 들고 있다가 deliver를 불러요.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const siteUrl = () =>
  (process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "")).replace(/\/$/, "");

// 서버리스라 완벽하진 않지만, 한 곳에서 짧은 시간에 쏟아지는 요청은 줄여요
const hits = new Map<string, { n: number; t: number }>();
function limited(ip: string) {
  const now = Date.now(), h = hits.get(ip);
  if (!h || now - h.t > 60_000) { hits.set(ip, { n: 1, t: now }); return false; }
  h.n++;
  return h.n > 40;
}

export async function POST(req: Request) {
  const token = process.env.QSTASH_TOKEN, base = siteUrl();
  if (!token || !base || !process.env.VAPID_PRIVATE_KEY) return NextResponse.json({ error: "not-configured" }, { status: 503 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (limited(ip)) return NextResponse.json({ error: "too-many" }, { status: 429 });

  const raw = await req.text();
  if (raw.length > 4000) return NextResponse.json({ error: "too-large" }, { status: 413 });
  let json: unknown;
  try { json = JSON.parse(raw); } catch { return NextResponse.json({ error: "bad-json" }, { status: 400 }); }

  const v = validateSchedule(json, Date.now());
  if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  const { subscription, payload, at } = v.value;

  try {
    await new Client({ token }).publishJSON({
      url: `${base}/api/push/deliver`,
      body: { subscription, payload },
      notBefore: Math.max(Math.ceil(at / 1000), Math.ceil(Date.now() / 1000)),
      deduplicationId: dedupKey(subscription.endpoint, payload.tag),
      retries: 3,
    });
  } catch {
    return NextResponse.json({ error: "schedule-failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
