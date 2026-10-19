import { createPublicKey } from "node:crypto";
import { NextResponse } from "next/server";
import { createAccessAssertion, parseServiceAccount, verifyFirebaseIdToken } from "../../../../../core/serverAuth";
import { adminFromEnv, countUsers, isAdmin, kstMidnight, lettersCountQuery, readCount, type AuthUser } from "../../../../../core/adminStats";

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

// 구글 접근 토큰은 1시간짜리라 50분 동안 다시 씀
let tokenCache: { token: string; exp: number } | null = null;
async function googleToken(sa: NonNullable<ReturnType<typeof parseServiceAccount>>, nowSec: number) {
  if (tokenCache && tokenCache.exp > nowSec) return tokenCache.token;
  const t = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: createAccessAssertion(sa, "https://www.googleapis.com/auth/cloud-platform", nowSec) }),
  });
  if (!t.ok) throw new Error("google-token");
  tokenCache = { token: (await t.json()).access_token, exp: nowSec + 3000 };
  return tokenCache.token;
}

let cache: { at: number; users: ReturnType<typeof countUsers>; letters: { all: number; today: number; week: number } } | null = null;

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
    const auth = { Authorization: `Bearer ${await googleToken(sa, nowSec)}` };
    const now = Date.now();

    // 가입자: 계정 목록을 1,000명씩 받아 셈(최대 20,000명, 넘으면 그만큼만)
    const listUsers = async () => {
      const users: AuthUser[] = [];
      let page = "";
      for (let i = 0; i < 20; i++) {
        const r = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${sa.project_id}/accounts:batchGet?maxResults=1000${page ? `&nextPageToken=${encodeURIComponent(page)}` : ""}`, { headers: auth });
        if (!r.ok) throw new Error(`accounts-${r.status}`);
        const j = await r.json();
        users.push(...((j.users ?? []) as AuthUser[]));
        page = j.nextPageToken ?? "";
        if (!page) break;
      }
      return users;
    };

    // 편지 수: 전체·오늘·7일(서버가 세기만 하고 내용은 읽지 않음)
    const count = async (since?: number) => {
      const r = await fetch(`https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents:runAggregationQuery`, {
        method: "POST",
        headers: { ...auth, "Content-Type": "application/json" },
        body: JSON.stringify(lettersCountQuery(since)),
      });
      if (!r.ok) throw new Error(`count-${r.status}`);
      return readCount(await r.json());
    };
    // 네 가지를 동시에 물어봐서 기다리는 시간을 한 번으로 줄여요
    const [users, all, today, week] = await Promise.all([listUsers(), count(), count(kstMidnight(now)), count(now - 7 * 86_400_000)]);

    cache = { at: now, users: countUsers(users, now), letters: { all, today, week } };
    return NextResponse.json(cache);
  } catch (e) {
    return NextResponse.json({ error: "server-error", detail: e instanceof Error ? e.message : "" }, { status: 502 });
  }
}
