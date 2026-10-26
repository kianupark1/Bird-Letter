import { createAccessAssertion, parseServiceAccount } from "../../core/serverAuth";
import type { PreviewMeta } from "../../core/letterPreview";

// 서버에서만 씀: 링크 미리보기 카드에 넣을 편지 겉정보(보낸 사람 이름·새·노선)를 읽어요. 편지 내용은 읽지 않아요.
let tokenCache: { token: string; exp: number } | null = null;
async function googleToken(sa: NonNullable<ReturnType<typeof parseServiceAccount>>, nowSec: number, signal: AbortSignal) {
  if (tokenCache && tokenCache.exp > nowSec) return tokenCache.token;
  const t = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", signal,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: createAccessAssertion(sa, "https://www.googleapis.com/auth/cloud-platform", nowSec) }),
  });
  if (!t.ok) throw new Error("google-token");
  tokenCache = { token: (await t.json()).access_token, exp: nowSec + 3000 };
  return tokenCache.token;
}

/** 못 읽으면(열쇠 없음·느림·없는 편지) null. 미리보기가 늦어지지 않게 2.5초에서 끊어요 */
export async function readLetterMeta(id: string): Promise<PreviewMeta | null> {
  const sa = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (!sa || !/^[A-Za-z0-9]{10,40}$/.test(id)) return null;
  const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 2500);
  try {
    const token = await googleToken(sa, Math.floor(Date.now() / 1000), ctl.signal);
    const r = await fetch(`https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents/letters/${id}?mask.fieldPaths=fromName&mask.fieldPaths=birdId&mask.fieldPaths=routeId&mask.fieldPaths=departAt&mask.fieldPaths=penpal`, {
      headers: { Authorization: `Bearer ${token}` }, signal: ctl.signal, cache: "no-store",
    });
    if (!r.ok) return null;
    const f = (await r.json()).fields ?? {};
    return {
      fromName: f.fromName?.stringValue, birdId: f.birdId?.stringValue, routeId: f.routeId?.stringValue,
      departAt: f.departAt?.timestampValue ? Date.parse(f.departAt.timestampValue) : undefined,
      penpal: f.penpal?.booleanValue === true,
    };
  } catch { return null; } finally { clearTimeout(timer); }
}
