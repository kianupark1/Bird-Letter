import { createPublicKey } from "node:crypto";
import { Client } from "@upstash/qstash";
import { NextResponse } from "next/server";
import { verifyFirebaseIdToken } from "../../../../../core/serverAuth";
import { dedupKey, subKey, type PushPayload, type PushSub } from "../../../../../core/pushPayload";
import { getRoute } from "../../../../../core/routes";
import { getBird } from "../../../../../core/birds";
import { withIGa } from "../../../../../core/korean";
import { googleToken, serviceAccount } from "@/lib/server/google";

// 편지를 보낸 사람의 폰이 "이 편지의 받는 사람에게 알림을 예약해 줘"를 맡기는 곳(2026-11-12 대표님: "펜팔 받았는데 알림 못 받음").
// 친구가 아닌 펜팔은 보낸 사람 폰이 받는 사람 알림 주소를 읽을 수 없어서(규칙), 서버가 서비스 계정으로 대신 읽고 예약해요.
// 확인: ①로그인 토큰 ②그 편지를 보낸 사람이 본인 ③받는 사람이 정해진 편지. 알림에는 편지 내용이 없어요.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let certCache: { at: number; certs: Record<string, string> } | null = null;
async function googleCerts() {
  if (certCache && Date.now() - certCache.at < 3600_000) return certCache.certs;
  const r = await fetch("https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com");
  if (!r.ok) throw new Error("certs");
  certCache = { at: Date.now(), certs: await r.json() };
  return certCache.certs;
}
const siteUrl = () =>
  (process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "")).replace(/\/$/, "");

type F = Record<string, { stringValue?: string; booleanValue?: boolean; timestampValue?: string; nullValue?: null }>;
async function readDoc(projectId: string, path: string, token: string): Promise<F | null> {
  const r = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) return null;
  return ((await r.json()).fields ?? {}) as F;
}
const str = (f: F, k: string) => (typeof f[k]?.stringValue === "string" ? (f[k].stringValue as string) : "");
const time = (f: F, k: string) => (f[k]?.timestampValue ? Date.parse(f[k].timestampValue as string) : NaN);

export async function POST(req: Request) {
  const sa = serviceAccount(), qtoken = process.env.QSTASH_TOKEN, base = siteUrl();
  if (!sa || !qtoken || !base) return NextResponse.json({ error: "not-configured" }, { status: 503 });
  const raw = await req.text();
  if (raw.length > 6000) return NextResponse.json({ error: "too-large" }, { status: 413 });
  let input: { idToken?: unknown; letterId?: unknown };
  try { input = JSON.parse(raw); } catch { return NextResponse.json({ error: "bad-json" }, { status: 400 }); }
  if (typeof input.idToken !== "string" || typeof input.letterId !== "string" || !/^[A-Za-z0-9]{10,40}$/.test(input.letterId)) return NextResponse.json({ error: "bad-input" }, { status: 400 });

  let me: { uid: string } | null = null;
  try {
    const certs = await googleCerts();
    me = verifyFirebaseIdToken(input.idToken, sa.project_id, (kid) => (certs[kid] ? createPublicKey(certs[kid]) : undefined), Math.floor(Date.now() / 1000));
  } catch {}
  if (!me) return NextResponse.json({ error: "bad-token" }, { status: 401 });

  try {
    const access = await googleToken(sa);
    const l = await readDoc(sa.project_id, `letters/${input.letterId}`, access);
    if (!l) return NextResponse.json({ error: "no-letter" }, { status: 404 });
    if (str(l, "fromUid") !== me.uid) return NextResponse.json({ error: "not-sender" }, { status: 403 });
    const to = str(l, "recipientUid");
    if (!to || to === me.uid) return NextResponse.json({ result: "no-recipient" });
    const s = await readDoc(sa.project_id, `users/${encodeURIComponent(to)}/push/sub`, access);
    let sub: PushSub | null = null;
    if (s && str(s, "fcm")) sub = { fcm: str(s, "fcm") };
    else if (s && str(s, "endpoint") && str(s, "p256dh") && str(s, "auth")) sub = { endpoint: str(s, "endpoint"), keys: { p256dh: str(s, "p256dh"), auth: str(s, "auth") } };
    if (!sub) return NextResponse.json({ result: "nosub" });

    const penpal = l.penpal?.booleanValue === true;
    const depart = time(l, "departAt"), sentAt = Number.isFinite(depart) ? depart : Number.isFinite(time(l, "sentAt")) ? time(l, "sentAt") : Date.now();
    const arriveAt = time(l, "arriveAt");
    if (!Number.isFinite(arriveAt)) return NextResponse.json({ error: "no-arrive" }, { status: 400 });
    const route = getRoute(str(l, "routeId")), bird = getBird(str(l, "birdId"));
    const who = str(l, "fromName") || "누군가";
    const url = `/letter/${input.letterId}`;
    const total = Math.max(1, Math.round((arriveAt - sentAt) / 60000));
    const h = Math.floor(total / 60), m = total % 60;
    const left = h ? `${h}시간${m ? ` ${m}분` : ""}` : `${m}분`;
    const id = input.letterId;
    const jobs: { p: PushPayload; at: number }[] = [
      { p: penpal
          ? { title: "🌏 누군가 나에게 펜팔 편지를 보냈어요", body: `${who}의 ${bird.name}가 날아오는 중 · 도착까지 약 ${left}`, url, tag: `l-${id}-d` }
          : { title: `💌 ${who}님이 편지를 보냈어요`, body: `${withIGa(bird.name)} ${route.title}을 날아오는 중 · 도착까지 약 ${left}`, url, tag: `l-${id}-d` },
        at: Math.max(Date.now() + 3000, sentAt) },
    ];
    if (total > 60) jobs.push({ p: { title: penpal ? "🌏 펜팔 편지가 곧 도착해요" : `🕊 ${who}님의 편지가 곧 도착해요`, body: `30분 뒤 ${bird.name}가 도착해요`, url, tag: `l-${id}-s` }, at: arriveAt - 30 * 60000 });
    jobs.push({ p: { title: penpal ? "짹짹! 펜팔 편지가 도착했어요" : `짹짹! ${withIGa(who)} 보낸 편지가 도착했어요`, body: penpal ? `${who}의 ${bird.name}가 편지를 가져왔어요` : `${route.title} · ${bird.name}가 편지를 가져왔어요`, url, tag: `l-${id}-r` }, at: arriveAt });

    const c = new Client({ token: qtoken });
    for (const j of jobs) {
      await c.publishJSON({
        url: `${base}/api/push/deliver`,
        body: { subscription: sub, payload: j.p },
        notBefore: Math.max(Math.ceil(j.at / 1000), Math.ceil(Date.now() / 1000)),
        deduplicationId: dedupKey(subKey(sub), j.p.tag),
        retries: 3,
      });
    }
    return NextResponse.json({ result: "ok" });
  } catch (e) {
    return NextResponse.json({ error: "server-error", detail: e instanceof Error ? e.message.slice(0, 120) : "" }, { status: 502 });
  }
}
