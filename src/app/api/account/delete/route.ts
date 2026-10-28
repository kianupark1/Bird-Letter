import { createPublicKey } from "node:crypto";
import { NextResponse } from "next/server";
import { createAccessAssertion, parseServiceAccount, verifyFirebaseIdToken } from "../../../../../core/serverAuth";

// 계정 삭제 입구(2026-10-28, 애플 심사 5.1.1(v) "앱 안에서 계정 삭제").
// 폰에서 지우면 "최근에 로그인해야 해요(requires-recent-login)"로 막힐 수 있어서, 서버가 서비스 계정으로 지워요.
// 폰이 보낸 로그인 토큰의 주인 계정만 지우고, 카카오·네이버 연결 기록(kakaoAccounts·naverAccounts)도 같이 지워요.
// 편지·친구 같은 데이터는 폰이 먼저 지우고 온다(remote.deleteMyData).
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

export async function POST(req: Request) {
  const sa = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (!sa) return NextResponse.json({ error: "not-configured" }, { status: 503 });

  const raw = await req.text();
  if (raw.length > 6000) return NextResponse.json({ error: "too-large" }, { status: 413 });
  let idToken: unknown;
  try { idToken = JSON.parse(raw).idToken; } catch { return NextResponse.json({ error: "bad-json" }, { status: 400 }); }
  if (typeof idToken !== "string") return NextResponse.json({ error: "no-token" }, { status: 400 });

  const nowSec = Math.floor(Date.now() / 1000);
  let me: { uid: string; claims: Record<string, unknown> } | null = null;
  try {
    const certs = await googleCerts();
    me = verifyFirebaseIdToken(idToken, sa.project_id, (kid) => (certs[kid] ? createPublicKey(certs[kid]) : undefined), nowSec);
  } catch {}
  if (!me) return NextResponse.json({ error: "bad-token" }, { status: 401 });

  const t = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: createAccessAssertion(sa, "https://www.googleapis.com/auth/cloud-platform", nowSec) }),
  });
  if (!t.ok) return NextResponse.json({ error: "google-token" }, { status: 502 });
  const auth = { Authorization: `Bearer ${(await t.json()).access_token}` };

  // 카카오·네이버 연결 기록: 그 번호가 이 계정을 가리킬 때만 지워요
  const docs = `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents`;
  for (const [col, key, re] of [["kakaoAccounts", "kakaoId", /^\d{1,20}$/], ["naverAccounts", "naverId", /^[A-Za-z0-9_-]{1,64}$/]] as const) {
    const id = me.claims[key];
    if (typeof id !== "string" || !re.test(id)) continue;
    try {
      const g = await fetch(`${docs}/${col}/${id}`, { headers: auth });
      if (g.ok && (await g.json()).fields?.uid?.stringValue === me.uid) await fetch(`${docs}/${col}/${id}`, { method: "DELETE", headers: auth });
    } catch {}
  }

  const d = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${sa.project_id}/accounts:delete`, {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ localId: me.uid }),
  });
  if (!d.ok) return NextResponse.json({ error: `delete-${d.status}` }, { status: 502 });
  return NextResponse.json({ ok: true });
}
