import { createPublicKey } from "node:crypto";
import { Client } from "@upstash/qstash";
import { NextResponse } from "next/server";
import { verifyFirebaseIdToken } from "../../../../../core/serverAuth";
import { ADMIN_UIDS } from "../../../../../core/adminStats";
import { HELLO_BIRD, HELLO_FROM_NAME, HELLO_ROUTE, helloId, helloText, helloToName } from "../../../../../core/hello";
import { getRoute } from "../../../../../core/routes";
import { totalMinutes } from "../../../../../core/flight";
import { dedupKey, subKey, type PushSub } from "../../../../../core/pushPayload";
import { googleToken, serviceAccount } from "@/lib/server/google";

// 가입한 사람에게 "만든 사람의 편지" 한 통(core/hello.ts). 본인 로그인 토큰(임시 계정 X)으로만, 계정마다 한 통.
// 다시 부르면(알림을 켠 뒤) 아직 안 도착한 편지의 도착 알림만 예약해요(같은 알림은 한 번만).
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

export async function POST(req: Request) {
  const sa = serviceAccount();
  if (!sa) return NextResponse.json({ error: "not-configured" }, { status: 503 });
  const raw = await req.text();
  if (raw.length > 6000) return NextResponse.json({ error: "too-large" }, { status: 413 });
  let input: { idToken?: unknown; name?: unknown };
  try { input = JSON.parse(raw); } catch { return NextResponse.json({ error: "bad-json" }, { status: 400 }); }
  if (typeof input.idToken !== "string") return NextResponse.json({ error: "bad-input" }, { status: 400 });
  let me: { uid: string; claims: Record<string, unknown> } | null = null;
  try {
    const certs = await googleCerts();
    me = verifyFirebaseIdToken(input.idToken, sa.project_id, (kid) => (certs[kid] ? createPublicKey(certs[kid]) : undefined), Math.floor(Date.now() / 1000));
  } catch {}
  if (!me) return NextResponse.json({ error: "bad-token" }, { status: 401 });
  const provider = (me.claims.firebase as { sign_in_provider?: string } | undefined)?.sign_in_provider;
  if (provider === "anonymous") return NextResponse.json({ result: "anonymous" });
  const from = (process.env.ADMIN_UIDS ?? "").split(",").map((x) => x.trim()).filter(Boolean)[0] ?? ADMIN_UIDS[0];
  if (!from || me.uid === from || ADMIN_UIDS.includes(me.uid)) return NextResponse.json({ result: "admin" });

  const id = helloId(me.uid);
  const access = await googleToken(sa, "https://www.googleapis.com/auth/datastore");
  const base = `projects/${sa.project_id}/databases/(default)/documents`;
  const ts = (ms: number) => ({ timestampValue: new Date(ms).toISOString() });
  const str = (v: string) => ({ stringValue: v });
  const toName = helloToName(input.name);
  let created = false;
  let sentAt = Date.now(), arriveAt = 0;
  {
    const minutes = totalMinutes(id, HELLO_BIRD, getRoute(HELLO_ROUTE).km, sentAt, 1);
    arriveAt = sentAt + minutes * 60000;
    const r = await fetch(`https://firestore.googleapis.com/v1/${base}:commit`, {
      method: "POST", headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" },
      body: JSON.stringify({ writes: [
        { update: { name: `${base}/letters/${id}`, fields: {
          fromUid: str(from), fromName: str(HELLO_FROM_NAME), toName: str(toName), routeId: str(HELLO_ROUTE), birdId: str(HELLO_BIRD),
          sentAt: ts(sentAt), arriveAt: ts(arriveAt), recipientUid: str(me.uid),
        } }, currentDocument: { exists: false } },
        { update: { name: `${base}/letters/${id}/private/body`, fields: { message: str(helloText(toName)) } } },
      ] }),
    });
    created = r.ok;
    if (!r.ok) {
      // 이미 보냈으면(계정마다 한 통) 그 편지의 시각을 읽어요
      const g = await fetch(`https://firestore.googleapis.com/v1/${base}/letters/${id}`, { headers: { Authorization: `Bearer ${access}` } });
      if (!g.ok) return NextResponse.json({ error: "firestore", status: r.status }, { status: 502 });
      const f = (await g.json()).fields ?? {};
      sentAt = Date.parse(f.sentAt?.timestampValue ?? ""); arriveAt = Date.parse(f.arriveAt?.timestampValue ?? "");
    }
  }

  // 알림을 켠 사람이면 출발·도착 알림 예약(도착 전일 때만)
  let push = "nosub";
  const qtoken = process.env.QSTASH_TOKEN, site = siteUrl();
  if (qtoken && site && Number.isFinite(arriveAt) && arriveAt > Date.now()) {
    const s = await fetch(`https://firestore.googleapis.com/v1/${base}/users/${encodeURIComponent(me.uid)}/push/sub`, { headers: { Authorization: `Bearer ${access}` } });
    const f = s.ok ? ((await s.json()).fields ?? {}) : {};
    const v = (k: string) => (typeof f[k]?.stringValue === "string" ? (f[k].stringValue as string) : "");
    const sub: PushSub | null = v("fcm") ? { fcm: v("fcm") } : v("endpoint") && v("p256dh") && v("auth") ? { endpoint: v("endpoint"), keys: { p256dh: v("p256dh"), auth: v("auth") } } : null;
    if (sub) {
      const c = new Client({ token: qtoken });
      const url = `/letter/${id}`;
      const left = Math.max(1, Math.round((arriveAt - Date.now()) / 60000));
      const jobs = [
        { p: { title: `💌 ${HELLO_FROM_NAME}이 편지를 보냈어요`, body: `비둘기가 날아오는 중 · 도착까지 약 ${left}분`, url, tag: `l-${id}-d` }, at: Date.now() + 3000 },
        { p: { title: "짹짹! 첫 편지가 도착했어요", body: "비둘기가 서울 하늘을 날아 편지를 가져왔어요", url, tag: `l-${id}-r` }, at: arriveAt },
      ];
      for (const j of jobs) {
        await c.publishJSON({ url: `${site}/api/push/deliver`, body: { subscription: sub, payload: j.p }, notBefore: Math.ceil(Math.max(j.at, Date.now()) / 1000), deduplicationId: dedupKey(subKey(sub), j.p.tag), retries: 3 }).catch(() => {});
      }
      push = "ok";
    }
  }
  return NextResponse.json({ result: created ? "sent" : "exists", id, push });
}
