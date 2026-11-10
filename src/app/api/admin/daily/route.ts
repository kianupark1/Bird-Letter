import { createPublicKey, type JsonWebKey, type KeyObject } from "node:crypto";
import { Client, Receiver } from "@upstash/qstash";
import { NextResponse } from "next/server";
import { GITHUB_OIDC_DAILY, verifyGithubOidc } from "../../../../../core/serverAuth";
import { ADMIN_UIDS, adminFromEnv, dailyText } from "../../../../../core/adminStats";
import type { PushSub } from "../../../../../core/pushPayload";
import { googleToken, serviceAccount } from "@/lib/server/google";
import { computeStats } from "@/lib/server/stats";
import { sendPush } from "@/lib/server/sendPush";

// 매일 저녁 7시 운영자 숫자 알림(2026-11-10 대표님: "앱으로 매일 7시마다 오늘 얼마나 들어왔는지").
// 부를 수 있는 곳은 둘뿐: ①QStash 예약(매일 한국 19:00 = UTC 10:00, 서명 확인) ②GitHub 작업 daily-stats.yml
// (OIDC 신분증: 저장소 kianupark1/Bird-Letter·main·aud bird-letter-daily). ②가 ?setup=1로 부르면 ① 예약을 만들어요(같은 이름이라 여러 번 불러도 하나).
// 가입자·편지 "숫자"만 세서 운영자 폰으로 알림을 보내요. 이름·편지 내용은 다루지 않아요.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let jwks: { at: number; keys: Map<string, KeyObject> } | null = null;
async function githubKeys() {
  if (jwks && Date.now() - jwks.at < 3600_000) return jwks.keys;
  const r = await fetch("https://token.actions.githubusercontent.com/.well-known/jwks");
  if (!r.ok) throw new Error("jwks");
  const keys = new Map<string, KeyObject>();
  for (const k of ((await r.json()).keys ?? []) as (JsonWebKey & { kid?: string })[]) {
    if (k.kid && k.kty === "RSA") try { keys.set(k.kid, createPublicKey({ key: k, format: "jwk" })); } catch {}
  }
  jwks = { at: Date.now(), keys };
  return keys;
}

/** Firestore에서 users/{uid}/push/sub 읽기(서비스 계정) */
async function readSub(projectId: string, uid: string, token: string): Promise<PushSub | null> {
  const r = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${encodeURIComponent(uid)}/push/sub`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) return null;
  const f = (await r.json()).fields ?? {};
  const str = (k: string) => (typeof f[k]?.stringValue === "string" ? (f[k].stringValue as string) : "");
  if (str("fcm")) return { fcm: str("fcm") };
  if (str("endpoint") && str("p256dh") && str("auth")) return { endpoint: str("endpoint"), keys: { p256dh: str("p256dh"), auth: str("auth") } };
  return null;
}

const siteUrl = () =>
  (process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "")).replace(/\/$/, "");

async function fromQstash(req: Request, body: string) {
  const cur = process.env.QSTASH_CURRENT_SIGNING_KEY, next = process.env.QSTASH_NEXT_SIGNING_KEY;
  const signature = req.headers.get("upstash-signature");
  if (!cur || !next || !signature) return false;
  try { return await new Receiver({ currentSigningKey: cur, nextSigningKey: next }).verify({ signature, body }); } catch { return false; }
}

async function fromGithub(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!token) return false;
  try {
    const keys = await githubKeys();
    return verifyGithubOidc(token, (kid) => keys.get(kid), Math.floor(Date.now() / 1000), GITHUB_OIDC_DAILY);
  } catch { return false; }
}

export async function POST(req: Request) {
  const body = await req.text();
  const qstash = await fromQstash(req, body);
  const github = !qstash && (await fromGithub(req));
  if (!qstash && !github) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  // GitHub 작업이 ?setup=1로 부르면 매일 19:00(한국) 예약을 만들어요
  let schedule: string | undefined;
  if (github && new URL(req.url).searchParams.get("setup") === "1") {
    const qtoken = process.env.QSTASH_TOKEN, base = siteUrl();
    if (!qtoken || !base) schedule = "not-configured";
    else {
      try {
        await new Client({ token: qtoken }).schedules.create({ destination: `${base}/api/admin/daily`, cron: "0 10 * * *", scheduleId: "saepyeonji-daily-stats", method: "POST", body: "{}" });
        schedule = "ok";
      } catch (e) { schedule = `fail: ${e instanceof Error ? e.message : ""}`.slice(0, 200); }
    }
  }

  const sa = serviceAccount();
  if (!sa) return NextResponse.json({ error: "not-configured" }, { status: 503 });
  try {
    const stats = await computeStats(sa);
    const text = dailyText(stats);
    const access = await googleToken(sa);
    const admins = [...new Set([...ADMIN_UIDS, ...adminFromEnv(process.env.ADMIN_UIDS)])];
    const pushed: string[] = [];
    for (const uid of admins) {
      const sub = await readSub(sa.project_id, uid, access);
      pushed.push(sub ? await sendPush(sub, { ...text, url: "/admin", tag: "daily-stats" }).catch(() => "fail") : "no-sub");
    }
    return NextResponse.json({ stats, text, pushed, schedule });
  } catch (e) {
    return NextResponse.json({ error: "server-error", detail: e instanceof Error ? e.message : "" }, { status: 502 });
  }
}
