import { NextResponse } from "next/server";
import { googleToken, serviceAccount } from "@/lib/server/google";
import { isFunnelStep, kstDate } from "../../../../core/funnel";

/**
 * 단계 한 번 세기(src/lib/funnel.ts) → funnel/{한국 날짜} 문서의 그 단계 숫자 +1. 단계 이름만 받아요(이름·편지·계정 없음).
 * 매일 저녁 7시 숫자 알림(api/admin/daily)이 오늘 줄을 읽어요.
 */
export const runtime = "nodejs";

export async function POST(req: Request) {
  const sa = serviceAccount();
  if (!sa) return NextResponse.json({ ok: false });
  let step: unknown;
  try { step = JSON.parse((await req.text()).slice(0, 200)).step; } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  if (!isFunnelStep(step)) return NextResponse.json({ ok: false }, { status: 400 });
  try {
    const t = await googleToken(sa);
    const db = `projects/${sa.project_id}/databases/(default)`;
    await fetch(`https://firestore.googleapis.com/v1/${db}/documents:commit`, {
      method: "POST", headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      body: JSON.stringify({ writes: [{ transform: { document: `${db}/documents/funnel/${kstDate(Date.now())}`, fieldTransforms: [{ fieldPath: step, increment: { integerValue: "1" } }] } }] }),
    });
  } catch {}
  return NextResponse.json({ ok: true });
}
