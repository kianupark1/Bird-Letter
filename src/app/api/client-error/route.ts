import { NextResponse } from "next/server";
import { googleToken, serviceAccount } from "@/lib/server/google";

/** 화면 오류 한 줄 받기(src/lib/reportError.ts) → clientErrors 모음에 남겨 매일 점검에서 봐요. 편지 내용·이름은 받지 않아요 */
export async function POST(req: Request) {
  const sa = serviceAccount();
  if (!sa) return NextResponse.json({ ok: false });
  let j: Record<string, unknown> = {};
  try { j = JSON.parse((await req.text()).slice(0, 2000)); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  const s = (k: string, n: number) => ({ stringValue: String(j[k] ?? "").slice(0, n) });
  try {
    const t = await googleToken(sa);
    await fetch(`https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents/clientErrors`, {
      method: "POST", headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fields: { at: { integerValue: String(Date.now()) }, where: s("where", 80), path: s("path", 120), msg: s("msg", 300), stack: s("stack", 500), ua: s("ua", 20) } }),
    });
  } catch {}
  return NextResponse.json({ ok: true });
}
