import { createPublicKey } from "node:crypto";
import { NextResponse } from "next/server";
import { loginWithKakao, type KakaoDeps } from "../../../../../core/kakaoLogin";
import { createAccessAssertion, createCustomToken, parseServiceAccount, verifyFirebaseIdToken } from "../../../../../core/serverAuth";

// 카카오로 "연결"하는 서버 입구. 폰이 카카오 code와 현재(익명) 계정의 Firebase 토큰을 보내면,
// 카카오에 확인한 뒤 Firebase 커스텀 토큰을 돌려준다. 서비스 계정 키는 환경 변수에만 둔다(docs/로그인-설정.md).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const siteUrl = () =>
  (process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "")).replace(/\/$/, "");

// 한 곳에서 짧은 시간에 쏟아지는 요청은 줄인다(서버리스라 완벽하진 않음)
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

export async function POST(req: Request) {
  const sa = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  const restKey = (process.env.KAKAO_REST_API_KEY ?? process.env.NEXT_PUBLIC_KAKAO_REST_KEY)?.replace(/^﻿/, "").trim(), base = siteUrl();
  if (!sa || !restKey || !base) return NextResponse.json({ error: "not-configured" }, { status: 503 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (limited(ip)) return NextResponse.json({ error: "too-many" }, { status: 429 });

  const raw = await req.text();
  if (raw.length > 6000) return NextResponse.json({ error: "too-large" }, { status: 413 });
  let input: { code?: unknown; idToken?: unknown };
  try { input = JSON.parse(raw); } catch { return NextResponse.json({ error: "bad-json" }, { status: 400 }); }

  const now = () => Math.floor(Date.now() / 1000);
  const docUrl = (id: string) => `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents/kakaoAccounts/${id}`;
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

  let kakaoNick = "";
  let kakaoThumb = "";
  const deps: KakaoDeps = {
    async kakaoUserId(code) {
      const form = new URLSearchParams({ grant_type: "authorization_code", client_id: restKey, redirect_uri: `${base}/auth/kakao`, code });
      if (process.env.KAKAO_CLIENT_SECRET) form.set("client_secret", process.env.KAKAO_CLIENT_SECRET.trim());
      const t = await fetch("https://kauth.kakao.com/oauth/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" }, body: form });
      if (!t.ok) throw new Error("kakao-token");
      const { access_token } = await t.json();
      const me = await fetch("https://kapi.kakao.com/v2/user/me", { headers: { Authorization: `Bearer ${access_token}` } });
      if (!me.ok) throw new Error("kakao-me");
      const j = await me.json();
      // 카카오 닉네임(동의항목 "닉네임"): 앱 이름으로 그대로 쓰도록 폰에 돌려줘요. 서버에는 저장하지 않아요
      const n = j?.kakao_account?.profile?.nickname ?? j?.properties?.nickname;
      if (typeof n === "string") kakaoNick = n.trim().slice(0, 12);
      // 카카오 프로필 사진(동의항목 "프로필 사진"): 기본 그림이 아닐 때만 작은 사진 주소를 받아 둬요
      const pr = j?.kakao_account?.profile;
      const th = pr?.thumbnail_image_url ?? j?.properties?.thumbnail_image;
      if (typeof th === "string" && pr?.is_default_image !== true) kakaoThumb = th;
      return String(j.id);
    },
    async verifyIdToken(idToken) {
      try {
        const certs = await googleCerts();
        return verifyFirebaseIdToken(idToken, sa.project_id, (kid) => (certs[kid] ? createPublicKey(certs[kid]) : undefined), now());
      } catch { return null; }
    },
    async accountUid(kakaoId) {
      const r = await fetch(docUrl(kakaoId), { headers: { Authorization: `Bearer ${await accessToken()}` } });
      if (r.status === 404) return null;
      if (!r.ok) throw new Error("firestore-read");
      return (await r.json()).fields?.uid?.stringValue ?? null;
    },
    async claimAccount(kakaoId, uid) {
      // 문서를 "새로 만들기"로만 쓰면 이미 있을 때 409가 와서, 동시에 두 번 연결돼도 한 곳에만 기록된다
      const r = await fetch(`https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents/kakaoAccounts?documentId=${kakaoId}`, {
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
    const res = await loginWithKakao(input, deps);
    if (!res.ok) return NextResponse.json({ error: res.error }, { status: res.status });
    return NextResponse.json({ customToken: res.customToken, switched: res.switched, nickname: kakaoNick || undefined, photo: (await fetchThumb(kakaoThumb)) || undefined });
  } catch {
    return NextResponse.json({ error: "server-error" }, { status: 502 });
  }
}

/**
 * 카카오 프로필 사진을 서버에서 받아 폰에 그대로 넘겨요(폰이 카카오 사진 서버에서 직접 읽으면 막힐 수 있어서).
 * 카카오 사진 서버 주소만, 300KB 이하 그림만. 서버에는 저장하지 않아요. 실패하면 사진 없이 진행.
 */
async function fetchThumb(url: string): Promise<string> {
  try {
    const u = new URL(url.replace(/^http:/, "https:"));
    if (u.protocol !== "https:" || !/(^|\.)kakaocdn\.net$/.test(u.hostname)) return "";
    const r = await fetch(u, { signal: AbortSignal.timeout(4000) });
    const type = r.headers.get("content-type") ?? "";
    if (!r.ok || !/^image\/(jpeg|png|webp|gif)/.test(type)) return "";
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > 300_000) return "";
    return `data:${type.split(";")[0]};base64,${buf.toString("base64")}`;
  } catch { return ""; }
}
