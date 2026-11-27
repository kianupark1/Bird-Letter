import { createPublicKey } from "node:crypto";
import { NextResponse } from "next/server";
import { parseServiceAccount, verifyFirebaseIdToken } from "../../../../../core/serverAuth";
import { adminFromEnv, isAdmin } from "../../../../../core/adminStats";
import { googleToken } from "@/lib/server/google";

// 신고 처리(2026-11-27, 애플 1.2 "신고는 24시간 안에 내용을 지우고 보낸 사람을 내보내야 해요").
// 운영자만: list = 최근 신고와 그 편지 / remove = 편지 지우기 + 보낸 사람 계정 막기·펜팔 명단에서 빼기 / dismiss = 문제없음으로 닫기
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

type F = Record<string, { stringValue?: string; timestampValue?: string; booleanValue?: boolean; integerValue?: string }>;
const str = (f: F | undefined, k: string) => f?.[k]?.stringValue ?? "";

export async function POST(req: Request) {
  const sa = parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (!sa) return NextResponse.json({ error: "not-configured" }, { status: 503 });
  const raw = await req.text();
  if (raw.length > 6000) return NextResponse.json({ error: "too-large" }, { status: 413 });
  let body: { idToken?: unknown; action?: unknown; reportId?: unknown; letterId?: unknown; uid?: unknown };
  try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "bad-json" }, { status: 400 }); }
  if (typeof body.idToken !== "string") return NextResponse.json({ error: "no-token" }, { status: 400 });
  let me: { uid: string } | null = null;
  try {
    const certs = await googleCerts();
    me = verifyFirebaseIdToken(body.idToken, sa.project_id, (kid) => (certs[kid] ? createPublicKey(certs[kid]) : undefined), Math.floor(Date.now() / 1000));
  } catch {}
  if (!me) return NextResponse.json({ error: "bad-token" }, { status: 401 });
  if (!isAdmin(me.uid, adminFromEnv(process.env.ADMIN_UIDS))) return NextResponse.json({ error: "not-admin", uid: me.uid }, { status: 403 });

  const token = await googleToken(sa);
  const auth = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const base = `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents`;
  const id = (v: unknown) => (typeof v === "string" && /^[A-Za-z0-9_:.-]{1,128}$/.test(v) ? v : null);
  const markReport = async (reportId: string, result: string) =>
    fetch(`${base}/reports/${reportId}?updateMask.fieldPaths=handled&updateMask.fieldPaths=handledAt&updateMask.fieldPaths=result`, {
      method: "PATCH", headers: auth,
      body: JSON.stringify({ fields: { handled: { booleanValue: true }, handledAt: { timestampValue: new Date().toISOString() }, result: { stringValue: result } } }),
    });

  try {
    if (body.action === "list") {
      const r = await fetch(`${base}:runQuery`, {
        method: "POST", headers: auth,
        body: JSON.stringify({ structuredQuery: { from: [{ collectionId: "reports" }], orderBy: [{ field: { fieldPath: "createdAt" }, direction: "DESCENDING" }], limit: 40 } }),
      });
      if (!r.ok) throw new Error(`reports-${r.status}`);
      const rows = ((await r.json()) as { document?: { name: string; fields?: F } }[]).filter((x) => x.document);
      const list = await Promise.all(rows.map(async (x) => {
        const f = x.document!.fields;
        const letterId = str(f, "letterId");
        let letter: { fromUid: string; fromName: string; message: string; penpal: boolean } | null = null;
        if (id(letterId)) {
          const l = await fetch(`${base}/letters/${letterId}`, { headers: auth });
          if (l.ok) { const lf = (await l.json()).fields as F; letter = { fromUid: str(lf, "fromUid"), fromName: str(lf, "fromName"), message: str(lf, "message").slice(0, 400), penpal: lf?.penpal?.booleanValue === true }; }
        }
        return {
          id: x.document!.name.split("/").pop(), letterId, reason: str(f, "reason"),
          at: Date.parse(f?.createdAt?.timestampValue ?? "") || 0, handled: f?.handled?.booleanValue === true, result: str(f, "result"), letter,
        };
      }));
      return NextResponse.json({ reports: list });
    }
    const reportId = id(body.reportId);
    if (!reportId) return NextResponse.json({ error: "bad-id" }, { status: 400 });
    if (body.action === "dismiss") { await markReport(reportId, "문제없음"); return NextResponse.json({ ok: true }); }
    if (body.action === "remove") {
      const letterId = id(body.letterId), uid = id(body.uid);
      if (letterId) await fetch(`${base}/letters/${letterId}`, { method: "DELETE", headers: auth });
      if (uid && !isAdmin(uid, adminFromEnv(process.env.ADMIN_UIDS))) {
        // 보낸 사람 내보내기: 로그인 막기 + 펜팔 명단에서 빼기 + 막은 기록
        await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${sa.project_id}/accounts:update`, { method: "POST", headers: auth, body: JSON.stringify({ localId: uid, disableUser: true }) });
        await fetch(`${base}/penpals/${encodeURIComponent(uid)}`, { method: "DELETE", headers: auth });
        await fetch(`${base}/bans/${encodeURIComponent(uid)}`, { method: "PATCH", headers: auth, body: JSON.stringify({ fields: { at: { timestampValue: new Date().toISOString() }, reportId: { stringValue: reportId } } }) });
      }
      await markReport(reportId, "편지 지움·이용 막음");
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "bad-action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: "server-error", detail: e instanceof Error ? e.message : "" }, { status: 502 });
  }
}
