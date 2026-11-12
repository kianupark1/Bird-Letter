import { createPublicKey, type JsonWebKey, type KeyObject } from "node:crypto";
import { Client, Receiver } from "@upstash/qstash";
import { NextResponse } from "next/server";
import { GITHUB_OIDC_AUTOPOST, verifyGithubOidc } from "../../../../../core/serverAuth";

// 홍보 글 정시 올리기(2026-11-12 대표님: "왜 자꾸 안 올라가지?").
// GitHub 예약 실행(cron)은 몇 시간씩 늦거나 빠져서(11/12 아침 08:31 예약이 11시까지 안 돎), 시각은 QStash 예약이 정확히 지키고
// 이 입구가 GitHub 작업 "홍보 글 자동 게시"(auto-post.yml)를 바로 실행시켜요(send=true, slot=auto → 이미 올린 글은 기록으로 건너뜀).
// 부를 수 있는 곳: ①QStash 예약(서명 확인) ②GitHub 작업 autopost-setup.yml(OIDC, aud bird-letter-autopost) — ?setup=1이면 예약을 만들어요.
// GitHub 작업 실행에는 Vercel 환경 변수 GH_DISPATCH_TOKEN(이 저장소 Actions 읽기·쓰기만 준 토큰)이 필요해요.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REPO = "kianupark1/Bird-Letter";
/** 한국 08:30·17:30·22:00 + 각 20분 뒤 한 번 더(UTC로 적음, 같은 글은 두 번 안 올라감) */
const SCHEDULES: { id: string; cron: string }[] = [
  { id: "saepyeonji-autopost-morning", cron: "30 23 * * *" },
  { id: "saepyeonji-autopost-morning2", cron: "50 23 * * *" },
  { id: "saepyeonji-autopost-evening", cron: "30 8 * * *" },
  { id: "saepyeonji-autopost-evening2", cron: "50 8 * * *" },
  { id: "saepyeonji-autopost-night", cron: "0 13 * * *" },
  { id: "saepyeonji-autopost-night2", cron: "20 13 * * *" },
];

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
    return verifyGithubOidc(token, (kid) => keys.get(kid), Math.floor(Date.now() / 1000), GITHUB_OIDC_AUTOPOST);
  } catch { return false; }
}

/** GitHub 작업 "홍보 글 자동 게시"를 지금 실행 */
async function dispatch(): Promise<string> {
  const t = process.env.GH_DISPATCH_TOKEN?.trim();
  if (!t) return "no-token";
  const r = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows/auto-post.yml/dispatches`, {
    method: "POST",
    headers: { Authorization: `Bearer ${t}`, Accept: "application/vnd.github+json", "Content-Type": "application/json", "User-Agent": "saepyeonji-autopost" },
    body: JSON.stringify({ ref: "main", inputs: { send: "true", slot: "auto" } }),
  });
  return r.status === 204 ? "dispatched" : `github-${r.status}`;
}

export async function POST(req: Request) {
  const body = await req.text();
  const qstash = await fromQstash(req, body);
  const github = !qstash && (await fromGithub(req));
  if (!qstash && !github) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  if (github) {
    // 손으로 연 작업: 예약 만들기(같은 이름이라 여러 번 불러도 하나씩) + 토큰 확인
    const out: Record<string, string> = {};
    if (new URL(req.url).searchParams.get("setup") === "1") {
      const qtoken = process.env.QSTASH_TOKEN, base = siteUrl();
      if (!qtoken || !base) out.schedule = "not-configured";
      else {
        const c = new Client({ token: qtoken });
        for (const s of SCHEDULES) {
          try { await c.schedules.create({ destination: `${base}/api/autopost/tick`, cron: s.cron, scheduleId: s.id, method: "POST", body: "{}" }); out[s.id] = "ok"; }
          catch (e) { out[s.id] = `fail: ${e instanceof Error ? e.message : ""}`.slice(0, 160); }
        }
      }
    }
    out.token = process.env.GH_DISPATCH_TOKEN?.trim() ? "있음" : "없음(Vercel에 GH_DISPATCH_TOKEN 필요)";
    return NextResponse.json(out);
  }
  const result = await dispatch();
  return NextResponse.json({ result }, { status: result === "dispatched" ? 200 : 502 });
}
