import { createAccessAssertion, parseServiceAccount } from "../../../core/serverAuth";

export type ServiceAccount = NonNullable<ReturnType<typeof parseServiceAccount>>;
export const serviceAccount = () => parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

// 구글 접근 토큰은 1시간짜리라 50분 동안 다시 씀(권한 범위마다 따로)
const cache = new Map<string, { token: string; exp: number }>();
export async function googleToken(sa: ServiceAccount, scope = "https://www.googleapis.com/auth/cloud-platform") {
  const nowSec = Math.floor(Date.now() / 1000);
  const hit = cache.get(scope);
  if (hit && hit.exp > nowSec) return hit.token;
  const t = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: createAccessAssertion(sa, scope, nowSec) }),
  });
  if (!t.ok) throw new Error("google-token");
  const token = (await t.json()).access_token as string;
  cache.set(scope, { token, exp: nowSec + 3000 });
  return token;
}
