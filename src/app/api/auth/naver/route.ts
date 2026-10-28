import { createPublicKey } from "node:crypto";
import { NextResponse } from "next/server";
import { loginWithSocial, type KakaoDeps } from "../../../../../core/kakaoLogin";
import { createAccessAssertion, createCustomToken, parseServiceAccount, verifyFirebaseIdToken } from "../../../../../core/serverAuth";

// 네이버로 가입·로그인하는 서버 입구(카카오와 같은 흐름, src/app/api/auth/kakao/route.ts).
// 폰이 네이버 code·state와 지금 계정의 Firebase 토큰을 보내면, 네이버에 확인한 뒤 Firebase 커스텀 토큰을 돌려준다.
// 열쇠: NEXT_PUBLIC_NAVER_CLIENT_ID(공개 값), NAVER_CLIENT_SECRET(비밀), FIREBASE_SERVICE_ACCOUNT_JSON. 기록은 naverAccounts/{네이버번호}.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const hits = new Map<string, { n: number; t: number }>();
function limited(ip: string) {
  const now = Date.now(), h = hits.get(ip);
  if (!h || now - h.t > 60_000) { hits.set(ip, { n: 1, t: now }); return false; }
  h.n++;
  return h.n > 20;
}

let certCache: { at: number; certs: Record<string, string> } | null = null;
async function googleCerts() {
  if (certCache && Date.now() - certCache.at < 3600_000) return certCache.certs;
  const r = await fetch("https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com");
  if (!r.ok) throw new Error("certs");
  certCache = { at: Date.now(), certs: await r.json() };
  return certCache.certs;
}

const clean = (v?: string) => (v ?? "").replace(/^﻿/, "").trim();

export async function POST(req: Request) {
  const sa = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  const clientId = clean(process.env.NEXT_PUBLIC_NAVER_CLIENT_ID), secret = clean(process.env.NAVER_CLIENT_SECRET);
  if (!sa || !clientId || !secret) return NextResponse.json({ error: "not-configured" }, { status: 503 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (limited(ip)) return NextResponse.json({ error: "too-many" }, { status: 429 });

  const raw = await req.text();
  if (raw.length > 6000) return NextResponse.json({ error: "too-large" }, { status: 413 });
  let input: { code?: unknown; state?: unknown; idToken?: unknown };
  try { input = JSON.parse(raw); } catch { return NextResponse.json({ error: "bad-json" }, { status: 400 }); }
  const state = typeof input.state === "string" ? input.state.slice(0, 100) : "";

  const now = () => Math.floor(Date.now() / 1000);
  const docUrl = (id: string) => `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents/naverAccounts/${id}`;
  let access: { token: string; exp: number } | null = null;
  const accessToken = async () => {
    if (access && access.exp > now() + 60) return access.token;
    const r = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: createAccessAssertion(sa, "https://www.googleapis.com/auth/datastore", now()) }),
    });
    if (!r.ok) throw new Error("google-token");
    const j = await r.json();
    access = { token: j.access_token, exp: now() + 3000 };
    return access.token;
  };

  let nick = "", thumb = "";
  const deps: KakaoDeps = {
    async kakaoUserId(code) {
      const t = await fetch(`https://nid.naver.com/oauth2.0/token?${new URLSearchParams({ grant_type: "authorization_code", client_id: clientId, client_secret: secret, code, state })}`);
      if (!t.ok) throw new Error("naver-token");
      const tj = await t.json();
      if (!tj.access_token) throw new Error("naver-token");
      const me = await fetch("https://openapi.naver.com/v1/nid/me", { headers: { Authorization: `Bearer ${tj.access_token}` } });
      if (!me.ok) throw new Error("naver-me");
      const j = await me.json();
      const r = j?.response ?? {};
      // 네이버 별명(없으면 이름): 앱 이름으로 그대로 쓰도록 폰에 돌려줘요. 서버에는 저장하지 않아요
      const n = r.nickname || r.name;
      if (typeof n === "string") nick = n.trim().slice(0, 12);
      if (typeof r.profile_image === "string") thumb = r.profile_image;
      if (typeof r.id !== "string") throw new Error("naver-id");
      return r.id;
    },
    async verifyIdToken(idToken) {
      try {
        const certs = await googleCerts();
        return verifyFirebaseIdToken(idToken, sa.project_id, (kid) => (certs[kid] ? createPublicKey(certs[kid]) : undefined), now());
      } catch { return null; }
    },
    async accountUid(id) {
      const r = await fetch(docUrl(id), { headers: { Authorization: `Bearer ${await accessToken()}` } });
      if (r.status === 404) return null;
      if (!r.ok) throw new Error("firestore-read");
      return (await r.json()).fields?.uid?.stringValue ?? null;
    },
    async claimAccount(id, uid) {
      const r = await fetch(`https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents/naverAccounts?documentId=${encodeURIComponent(id)}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json" },
        body: JSON.stringify({ fields: { uid: { stringValue: uid }, createdAt: { integerValue: String(now()) } } }),
      });
      if (r.status === 409) return false;
      if (!r.ok) throw new Error("firestore-write");
      return true;
    },
    mintToken: (uid, claims) => createCustomToken(sa, uid, claims, now()),
  };

  try {
    const res = await loginWithSocial("naver", input, deps);
    if (!res.ok) return NextResponse.json({ error: res.error }, { status: res.status });
    return NextResponse.json({ customToken: res.customToken, switched: res.switched, nickname: nick || undefined, photo: (await fetchThumb(thumb)) || undefined });
  } catch {
    return NextResponse.json({ error: "server-error" }, { status: 502 });
  }
}

/** 네이버 프로필 사진(네이버 사진 서버 주소만, 300KB 이하). 서버에는 저장하지 않아요. 기본 그림이면 건너뜀 */
async function fetchThumb(url: string): Promise<string> {
  try {
    const u = new URL(url.replace(/^http:/, "https:"));
    if (u.protocol !== "https:" || !/(^|\.)pstatic\.net$/.test(u.hostname) || /default/i.test(u.pathname)) return "";
    const r = await fetch(u, { signal: AbortSignal.timeout(4000) });
    const type = r.headers.get("content-type") ?? "";
    if (!r.ok || !/^image\/(jpeg|png|webp|gif)/.test(type)) return "";
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 300_000) return "";
    return `data:${type.split(";")[0]};base64,${buf.toString("base64")}`;
  } catch { return ""; }
}
