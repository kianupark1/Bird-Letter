/**
 * 애플 앱 결제(StoreKit 2) 영수증 확인. 폰이 보낸 "서명된 거래"(JWS)를 서버가 직접 확인해요.
 * - 서명 사슬(x5c): 거래 서명 인증서 → 애플 중간 인증서 → 애플 루트(Apple Root CA - G3, 지문 고정)
 * - 열쇠(App Store Server API 키) 없이 확인할 수 있어서 대표님이 따로 받을 것이 없어요.
 * 2026-11-09 대표님: "펜팔 우표 그냥 하자" → 우표(소모형) 결제의 바탕.
 */
import { X509Certificate, createPublicKey, verify as cryptoVerify, createHash } from "node:crypto";

/** Apple Root CA - G3 인증서의 SHA-256 지문(애플 공개 인증서, https://www.apple.com/certificateauthority/) */
export const APPLE_ROOT_G3_SHA256 = "63343abfb89a6a03ebb57e9b3f5fa7be7c4f5c756f3017b3a8c488c3653e9179";
export const BUNDLE_ID = "com.saepyeonji.app";
/** 상품 번호 → 우표 장수(App Store Connect에 같은 번호로 만들어야 함) */
export const STAMP_PRODUCTS: Record<string, number> = { "com.saepyeonji.app.stamp1": 1 };

export type AppleTxn = {
  transactionId: string; originalTransactionId: string; bundleId: string; productId: string;
  purchaseDate: number; quantity: number; type: string; environment: "Production" | "Sandbox" | string; revocationDate?: number;
};

const b64u = (s: string) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");

/** ES256 JWS 서명(64바이트 r||s)을 node가 읽는 DER로 */
function joseToDer(sig: Buffer): Buffer {
  const enc = (b: Buffer) => { let i = 0; while (i < b.length - 1 && b[i] === 0) i++; let v = b.subarray(i); if (v[0] & 0x80) v = Buffer.concat([Buffer.from([0]), v]); return Buffer.concat([Buffer.from([2, v.length]), v]); };
  const r = enc(sig.subarray(0, 32)), s = enc(sig.subarray(32));
  return Buffer.concat([Buffer.from([0x30, r.length + s.length]), r, s]);
}

/**
 * 서명된 거래를 확인하고 내용을 돌려줘요. 틀리면 null.
 * rootSha256는 시험에서만 바꿔요(실제로는 애플 루트 고정).
 */
export function verifyAppleJws(jws: string, opts: { rootSha256?: string; now?: number } = {}): AppleTxn | null {
  try {
    const [h, p, s] = jws.split(".");
    if (!h || !p || !s) return null;
    const header = JSON.parse(b64u(h).toString("utf8"));
    if (header.alg !== "ES256" || !Array.isArray(header.x5c) || header.x5c.length !== 3) return null;
    const [leaf, mid, root] = (header.x5c as string[]).map((c) => new X509Certificate(Buffer.from(c, "base64")));
    const rootFp = createHash("sha256").update(root.raw).digest("hex");
    if (rootFp !== (opts.rootSha256 ?? APPLE_ROOT_G3_SHA256)) return null;
    const now = new Date(opts.now ?? Date.now());
    for (const c of [leaf, mid, root]) if (new Date(c.validFrom) > now || new Date(c.validTo) < now) return null;
    if (!root.verify(root.publicKey) || !mid.verify(root.publicKey) || !leaf.verify(mid.publicKey)) return null;
    if (!mid.ca || leaf.ca) return null;
    const ok = cryptoVerify("sha256", Buffer.from(`${h}.${p}`), { key: createPublicKey(leaf.publicKey.export({ type: "spki", format: "pem" })), dsaEncoding: "der" }, joseToDer(b64u(s)));
    if (!ok) return null;
    const t = JSON.parse(b64u(p).toString("utf8"));
    if (typeof t.transactionId !== "string" || typeof t.productId !== "string") return null;
    return { transactionId: t.transactionId, originalTransactionId: String(t.originalTransactionId ?? t.transactionId), bundleId: t.bundleId, productId: t.productId,
      purchaseDate: Number(t.purchaseDate), quantity: Number(t.quantity ?? 1), type: String(t.type), environment: t.environment, revocationDate: t.revocationDate ? Number(t.revocationDate) : undefined };
  } catch { return null; }
}

/** 확인된 거래로 몇 장을 넣어 줄지(우리 앱·우표 상품·환불 안 된 것만). sandbox는 시험 계정 결제 */
export function stampsFor(t: AppleTxn, allowSandbox: boolean): number {
  if (t.bundleId !== BUNDLE_ID || t.revocationDate) return 0;
  if (t.environment !== "Production" && !(allowSandbox && t.environment === "Sandbox")) return 0;
  const per = STAMP_PRODUCTS[t.productId];
  return per ? per * Math.max(1, Math.min(10, t.quantity || 1)) : 0;
}
