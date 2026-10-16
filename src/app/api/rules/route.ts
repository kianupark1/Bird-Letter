import { createHash, createPublicKey, type JsonWebKey, type KeyObject } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { createAccessAssertion, parseServiceAccount, verifyGithubOidc } from "../../../../core/serverAuth";

// Firestore 보안 규칙 자동 게시 입구(2026-10-16, 대표님 허락: "열쇠 없이 자동으로").
// - 부를 수 있는 건 우리 GitHub 저장소(kianupark1/Bird-Letter) main에서 돈 "규칙 자동 게시" 작업뿐이다.
//   GitHub가 그 작업에 발급한 신분증(OIDC 토큰)을 GitHub 공개 키로 확인한다(core/serverAuth.ts verifyGithubOidc).
// - 올리는 규칙은 이 배포에 같이 들어간 firebase/firestore.rules 하나뿐이고, 요청으로 내용을 바꿀 수 없다.
// - 이미 같은 규칙이 걸려 있으면 아무것도 하지 않는다.
// 열쇠는 카카오 로그인에 쓰는 FIREBASE_SERVICE_ACCOUNT_JSON(Vercel 환경 변수)을 그대로 쓴다.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const rules = () => readFileSync(join(process.cwd(), "firebase", "firestore.rules"), "utf8");
const sha = (s: string) => createHash("sha256").update(s).digest("hex");

/** 이 배포에 들어간 규칙의 지문만 알려 줘요(GitHub가 새 배포가 떴는지 확인할 때 씀, 규칙 내용은 안 보여 줌) */
export async function GET() {
  try { return NextResponse.json({ sha: sha(rules()) }); }
  catch { return NextResponse.json({ error: "no-rules" }, { status: 500 }); }
}

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

export async function POST(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const now = Math.floor(Date.now() / 1000);
  let keys: Map<string, KeyObject>;
  try { keys = await githubKeys(); } catch { return NextResponse.json({ error: "jwks" }, { status: 502 }); }
  if (!verifyGithubOidc(token, (kid) => keys.get(kid), now)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const sa = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (!sa) return NextResponse.json({ error: "not-configured" }, { status: 503 });
  const content = rules();
  try {
    const t = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: createAccessAssertion(sa, "https://www.googleapis.com/auth/firebase", now) }),
    });
    if (!t.ok) return NextResponse.json({ error: "token", detail: (await t.text()).slice(0, 300) }, { status: 502 });
    const auth = { Authorization: `Bearer ${(await t.json()).access_token}`, "Content-Type": "application/json" };
    const base = `https://firebaserules.googleapis.com/v1/projects/${sa.project_id}`;
    const relName = `projects/${sa.project_id}/releases/cloud.firestore`;

    // 지금 걸려 있는 규칙과 같으면 건너뛰기
    const cur = await fetch(`${base}/releases/cloud.firestore`, { headers: auth });
    if (cur.ok) {
      const rs = await fetch(`https://firebaserules.googleapis.com/v1/${(await cur.json()).rulesetName}`, { headers: auth });
      if (rs.ok && ((await rs.json()).source?.files ?? []).some((f: { content?: string }) => f.content === content)) return NextResponse.json({ status: "same" });
    }

    const made = await fetch(`${base}/rulesets`, { method: "POST", headers: auth, body: JSON.stringify({ source: { files: [{ name: "firestore.rules", content }] } }) });
    if (!made.ok) return NextResponse.json({ error: "ruleset", detail: (await made.text()).slice(0, 500) }, { status: 502 });
    const rulesetName = (await made.json()).name;
    const rel = cur.ok
      ? await fetch(`${base}/releases/cloud.firestore`, { method: "PATCH", headers: auth, body: JSON.stringify({ release: { name: relName, rulesetName } }) })
      : await fetch(`${base}/releases`, { method: "POST", headers: auth, body: JSON.stringify({ name: relName, rulesetName }) });
    if (!rel.ok) return NextResponse.json({ error: "release", detail: (await rel.text()).slice(0, 500) }, { status: 502 });
    return NextResponse.json({ status: "published", ruleset: rulesetName });
  } catch {
    return NextResponse.json({ error: "server-error" }, { status: 502 });
  }
}
