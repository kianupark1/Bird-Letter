import { createPublicKey } from "node:crypto";
import { NextResponse } from "next/server";
import { parseServiceAccount, verifyFirebaseIdToken } from "../../../../../core/serverAuth";
import { adminFromEnv, isAdmin } from "../../../../../core/adminStats";
import { computeStats, type Stats } from "@/lib/server/stats";

// 운영자 숫자판 입구. 폰이 Firebase 로그인 토큰을 보내면, 운영자 계정일 때만 가입자·편지 "숫자"를 돌려준다.
// 운영자가 아니면 403과 함께 그 사람의 계정 번호만 돌려준다(운영자 등록할 때 쓰려고). 이름·편지 내용은 다루지 않는다.
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

let cache: Stats | null = null;

export async function POST(req: Request) {
  const sa = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (!sa) return NextResponse.json({ error: "not-configured" }, { status: 503 });

  const raw = await req.text();
  if (raw.length > 6000) return NextResponse.json({ error: "too-large" }, { status: 413 });
  let idToken: unknown;
  try { idToken = JSON.parse(raw).idToken; } catch { return NextResponse.json({ error: "bad-json" }, { status: 400 }); }
  if (typeof idToken !== "string") return NextResponse.json({ error: "no-token" }, { status: 400 });

  const nowSec = Math.floor(Date.now() / 1000);
  let me: { uid: string } | null = null;
  try {
    const certs = await googleCerts();
    me = verifyFirebaseIdToken(idToken, sa.project_id, (kid) => (certs[kid] ? createPublicKey(certs[kid]) : undefined), nowSec);
  } catch {}
  if (!me) return NextResponse.json({ error: "bad-token" }, { status: 401 });
  if (!isAdmin(me.uid, adminFromEnv(process.env.ADMIN_UIDS))) return NextResponse.json({ error: "not-admin", uid: me.uid }, { status: 403 });

  try {
    // 같은 서버가 30초 안에 다시 받으면 바로 돌려줘요(구글에 다시 묻지 않음)
    if (cache && Date.now() - cache.at < 30_000) return NextResponse.json(cache);
    cache = await computeStats(sa);
    return NextResponse.json(cache);
  } catch (e) {
    return NextResponse.json({ error: "server-error", detail: e instanceof Error ? e.message : "" }, { status: 502 });
  }
}
