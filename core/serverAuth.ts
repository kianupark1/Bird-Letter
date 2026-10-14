/**
 * 서버에서 쓰는 로그인 부품(Node 내장 암호 기능만 사용, 추가 설치 없음).
 * - Firebase "커스텀 토큰"을 서비스 계정 키로 직접 서명해서 만든다(카카오 등으로 확인된 사람에게 발급).
 * - 폰이 보낸 Firebase 로그인 토큰(ID 토큰)이 진짜인지 구글 공개 인증서로 확인한다.
 * - 서비스 계정으로 구글 API(Firestore) 접근 토큰을 얻는다.
 * 비밀 키는 환경 변수(FIREBASE_SERVICE_ACCOUNT_JSON)에만 두고 코드·채팅에 적지 않는다.
 */
import { createSign, createVerify, createPublicKey, type KeyObject } from "node:crypto";

export type ServiceAccount = { project_id: string; client_email: string; private_key: string };

const b64u = (b: Buffer | string) => Buffer.from(b).toString("base64url");
const fromB64u = (s: string) => Buffer.from(s, "base64url");

export function parseServiceAccount(raw: string | undefined): ServiceAccount | null {
  if (!raw) return null;
  try {
    const text = raw.trim().startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8"); // JSON 그대로 또는 base64 둘 다 허용
    const j = JSON.parse(text);
    if (typeof j.project_id === "string" && typeof j.client_email === "string" && typeof j.private_key === "string") {
      return { project_id: j.project_id, client_email: j.client_email, private_key: j.private_key.replace(/\\n/g, "\n") };
    }
  } catch {}
  return null;
}

function signJwt(payload: Record<string, unknown>, privateKey: string, header: Record<string, unknown> = {}): string {
  const head = b64u(JSON.stringify({ alg: "RS256", typ: "JWT", ...header }));
  const body = b64u(JSON.stringify(payload));
  const sig = createSign("RSA-SHA256").update(`${head}.${body}`).sign(privateKey);
  return `${head}.${body}.${b64u(sig)}`;
}

/** Firebase 커스텀 토큰: 이 토큰으로 로그인하면 uid가 그대로 정해진다(유효 1시간) */
export function createCustomToken(sa: ServiceAccount, uid: string, claims: Record<string, unknown>, nowSec: number): string {
  return signJwt(
    {
      iss: sa.client_email,
      sub: sa.client_email,
      aud: "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit",
      iat: nowSec,
      exp: nowSec + 3600,
      uid,
      claims,
    },
    sa.private_key,
  );
}

/** 구글 API 접근 토큰을 받기 위한 서명된 요청서 */
export function createAccessAssertion(sa: ServiceAccount, scope: string, nowSec: number): string {
  return signJwt({ iss: sa.client_email, scope, aud: "https://oauth2.googleapis.com/token", iat: nowSec, exp: nowSec + 3600 }, sa.private_key);
}

export type IdTokenInfo = { uid: string; claims: Record<string, unknown> };

/**
 * 폰이 보낸 Firebase ID 토큰 확인. keyFor(kid)는 구글 공개 인증서(x509 PEM) 또는 공개 키를 돌려준다.
 * 서명, 발급처(iss), 대상(aud=프로젝트), 만료를 모두 본다.
 */
export function verifyFirebaseIdToken(token: string, projectId: string, keyFor: (kid: string) => KeyObject | string | undefined, nowSec: number): IdTokenInfo | null {
  try {
    const [h, p, s] = token.split(".");
    if (!h || !p || !s) return null;
    const head = JSON.parse(fromB64u(h).toString("utf8"));
    const body = JSON.parse(fromB64u(p).toString("utf8"));
    if (head.alg !== "RS256" || typeof head.kid !== "string") return null;
    const k = keyFor(head.kid);
    if (!k) return null;
    const key = typeof k === "string" ? createPublicKey(k) : k;
    if (!createVerify("RSA-SHA256").update(`${h}.${p}`).verify(key, fromB64u(s))) return null;
    if (body.aud !== projectId || body.iss !== `https://securetoken.google.com/${projectId}`) return null;
    if (typeof body.exp !== "number" || body.exp <= nowSec || typeof body.iat !== "number" || body.iat > nowSec + 60) return null;
    const uid = body.sub ?? body.user_id;
    if (typeof uid !== "string" || !uid) return null;
    return { uid, claims: body };
  } catch {
    return null;
  }
}
