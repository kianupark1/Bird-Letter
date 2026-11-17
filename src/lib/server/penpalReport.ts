import { googleToken, type ServiceAccount } from "./google";
import { listAuthUsers } from "./stats";
import { lastSeen } from "../../../core/adminStats";

// 펜팔 편지가 왜 안 읽히는지 숫자로(2026-11-17 대표님: "펜팔 도통 안 읽지? 보낼 때·중간·받을 때 알림 잘 가고 있는 거 맞음?")
// 최근 14일 펜팔 편지만, 이름·내용은 안 읽고 개수만: 받는 사람에게 알림 주소가 있었는지, 최근에 앱을 열었는지, 읽었는지.
export type PenpalReport = { letters: number; arrived: number; read: number; recipients: number; toWithPush: number; toNoPush: number; toActive7d: number; noPushLetters: number };

export async function penpalReport(sa: ServiceAccount): Promise<PenpalReport> {
  const token = await googleToken(sa);
  const auth = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  const base = `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents`;
  const r = await fetch(`${base}:runQuery`, {
    method: "POST", headers: auth,
    body: JSON.stringify({ structuredQuery: {
      from: [{ collectionId: "letters" }],
      select: { fields: [{ fieldPath: "recipientUid" }, { fieldPath: "sentAt" }, { fieldPath: "arriveAt" }, { fieldPath: "readAt" }] },
      where: { fieldFilter: { field: { fieldPath: "penpal" }, op: "EQUAL", value: { booleanValue: true } } },
      limit: 500,
    } }),
  });
  if (!r.ok) throw new Error(`penpal-${r.status}`);
  const rows = ((await r.json()) as { document?: { fields?: Record<string, { stringValue?: string; timestampValue?: string }> } }[]).filter((x) => x.document);
  const now = Date.now(), since = now - 14 * 86_400_000;
  const ts = (v?: { timestampValue?: string }) => (v?.timestampValue ? Date.parse(v.timestampValue) : NaN);
  const list = rows.map((x) => x.document!.fields ?? {}).filter((f) => ts(f.sentAt) >= since);
  const tos = [...new Set(list.map((f) => f.recipientUid?.stringValue).filter((u): u is string => !!u))];
  const hasPush = new Map<string, boolean>();
  await Promise.all(tos.map(async (u) => {
    const s = await fetch(`${base}/users/${encodeURIComponent(u)}/push/sub`, { headers: auth });
    hasPush.set(u, s.ok);
  }));
  const users = await listAuthUsers(sa).catch(() => []);
  const seen = new Map(users.map((u) => [u.localId, lastSeen(u)]));
  const active = (u: string) => { const t = seen.get(u); return typeof t === "number" && now - t < 7 * 86_400_000; };
  return {
    letters: list.length,
    arrived: list.filter((f) => ts(f.arriveAt) <= now).length,
    read: list.filter((f) => Number.isFinite(ts(f.readAt))).length,
    recipients: tos.length,
    toWithPush: tos.filter((u) => hasPush.get(u)).length,
    toNoPush: tos.filter((u) => !hasPush.get(u)).length,
    toActive7d: tos.filter(active).length,
    noPushLetters: list.filter((f) => { const u = f.recipientUid?.stringValue; return !!u && !hasPush.get(u); }).length,
  };
}

/** 알림 주소 목록(2026-11-17 점검): 종류·저장 시각·운영자 계정인지만(uid·토큰은 공개 저장소 로그에 남지 않게 빼요) */
export async function pushSubList(sa: ServiceAccount, admins: string[]): Promise<{ type: string; savedKst: string; admin: boolean }[]> {
  const token = await googleToken(sa);
  const base = `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents`;
  const r = await fetch(`${base}:runQuery`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId: "push", allDescendants: true }], select: { fields: [{ fieldPath: "at" }, { fieldPath: "fcm" }] }, limit: 100 } }),
  });
  if (!r.ok) throw new Error(`subs-${r.status}`);
  const rows = ((await r.json()) as { document?: { name: string; fields?: Record<string, { integerValue?: string; doubleValue?: number; stringValue?: string }> } }[]).filter((x) => x.document);
  return rows.map((x) => {
    const f = x.document!.fields ?? {};
    const uid = decodeURIComponent(x.document!.name.split("/users/")[1]?.split("/")[0] ?? "");
    const at = Number(f.at?.integerValue ?? f.at?.doubleValue ?? 0);
    return { type: f.fcm?.stringValue ? "앱" : "웹", at, admin: admins.includes(uid) };
  }).sort((a, b) => b.at - a.at).slice(0, 15).map(({ type, at, admin }) => ({ type, admin, savedKst: at ? new Date(at + 9 * 3600_000).toISOString().slice(5, 16).replace("T", " ") : "?" }));
}

/** 마지막 앱 알림 성공·실패 기록(sendPush.ts note) */
export async function pushOps(sa: ServiceAccount) {
  const token = await googleToken(sa);
  const base = `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents/ops`;
  const get = async (n: string) => {
    const r = await fetch(`${base}/${n}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) return null;
    const f = ((await r.json()).fields ?? {}) as Record<string, { integerValue?: string; stringValue?: string }>;
    const at = Number(f.at?.integerValue ?? 0);
    return { kst: at ? new Date(at + 9 * 3600_000).toISOString().slice(5, 16).replace("T", " ") : "?", status: f.status?.integerValue, detail: f.detail?.stringValue, tag: f.tag?.stringValue };
  };
  return { lastOk: await get("pushOk"), lastFail: await get("pushFail") };
}
