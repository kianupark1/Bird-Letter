import { createPublicKey, randomBytes, type JsonWebKey, type KeyObject } from "node:crypto";
import { NextResponse } from "next/server";
import { GITHUB_OIDC_CAMPAIGN, verifyGithubOidc } from "../../../../../core/serverAuth";
import { ADMIN_UIDS } from "../../../../../core/adminStats";
import { CAMPAIGN_BIRD, CAMPAIGN_FROM_NAME, CAMPAIGN_ROUTE, campaignMessage, toNameOf } from "../../../../../core/campaign";
import { getRoute } from "../../../../../core/routes";
import { totalMinutes } from "../../../../../core/flight";
import { googleToken, serviceAccount } from "@/lib/server/google";

// 스레드 댓글 → 편지 배달 이벤트. GitHub 작업 threads-letters.yml(OIDC aud bird-letter-campaign, main)만 부를 수 있어요.
// 보낸 사람 = 운영자(대표님) 계정 → 받는 사람이 가입해서 답장하면 대표님이 받아요.
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

const ID_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const newId = () => Array.from(randomBytes(20), (b) => ID_CHARS[b % ID_CHARS.length]).join("");
const siteUrl = () =>
  (process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://bird-letter.vercel.app")).replace(/\/$/, "");

export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  let ok = false;
  try { ok = !!token && verifyGithubOidc(token, (kid) => jwks?.keys.get(kid), Math.floor(Date.now() / 1000), GITHUB_OIDC_CAMPAIGN); } catch {}
  if (!ok) { try { const keys = await githubKeys(); ok = verifyGithubOidc(token, (kid) => keys.get(kid), Math.floor(Date.now() / 1000), GITHUB_OIDC_CAMPAIGN); } catch {} }
  if (!ok) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as { username?: string; seed?: string };
  const username = String(body.username ?? "").replace(/^@+/, "").trim();
  if (!/^[A-Za-z0-9._]{1,30}$/.test(username)) return NextResponse.json({ error: "username" }, { status: 400 });
  const sa = serviceAccount();
  const from = (process.env.ADMIN_UIDS ?? "").split(",").map((x) => x.trim()).filter(Boolean)[0] ?? ADMIN_UIDS[0];
  if (!sa || !from) return NextResponse.json({ error: "config" }, { status: 500 });

  const id = newId();
  const now = Date.now();
  const minutes = totalMinutes(id, CAMPAIGN_BIRD, getRoute(CAMPAIGN_ROUTE).km, now, 1);
  const ts = (ms: number) => ({ timestampValue: new Date(ms).toISOString() });
  const str = (v: string) => ({ stringValue: v });
  const at = await googleToken(sa, "https://www.googleapis.com/auth/datastore");
  const base = `projects/${sa.project_id}/databases/(default)/documents`;
  const r = await fetch(`https://firestore.googleapis.com/v1/${base}:commit`, {
    method: "POST",
    headers: { Authorization: `Bearer ${at}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      writes: [
        { update: { name: `${base}/letters/${id}`, fields: {
          fromUid: str(from), fromName: str(CAMPAIGN_FROM_NAME), toName: str(toNameOf(username)),
          routeId: str(CAMPAIGN_ROUTE), birdId: str(CAMPAIGN_BIRD), sentAt: ts(now), arriveAt: ts(now + minutes * 60000),
          recipientUid: { nullValue: null },
        } }, currentDocument: { exists: false } },
        { update: { name: `${base}/letters/${id}/private/body`, fields: { message: str(campaignMessage(username, body.seed ?? id)) } } },
      ],
    }),
  });
  if (!r.ok) return NextResponse.json({ error: "firestore", status: r.status, detail: (await r.text()).slice(0, 200) }, { status: 502 });
  return NextResponse.json({ id, link: `${siteUrl()}/letter/${id}`, minutes: Math.round(minutes) });
}
