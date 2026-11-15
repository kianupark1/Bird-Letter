import { providerOf, type AuthUser, type SocialMap } from "../../../core/adminStats";
import { backfillPenpal } from "../../../core/penpal";
import { googleToken, type ServiceAccount } from "./google";
import { listAuthUsers, socialMap } from "./stats";

/**
 * 펜팔 명단 채우기(2026-11-15 대표님: "기본 등록하고 가입하면 다 펜팔 받을 수 있게"):
 * 로그인 가입자 중 penpals/{uid} 줄이 없는 사람을 넣어요. 꺼져 있는 줄도 다시 켜요(2026-11-15 2차: 예전 기본 꺼짐 값 때문에 내려간 사람) — 본인이 새로 끈 사람(profile.penpalOff)만 빼요.
 */
export async function backfillPenpals(sa: ServiceAccount, given?: { users: AuthUser[]; social: SocialMap }) {
  const auth = { Authorization: `Bearer ${await googleToken(sa)}` };
  const db = `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents`;
  const users = given?.users ?? (await listAuthUsers(sa));
  const social = given?.social ?? (await socialMap(sa));
  const members = users.filter((u) => providerOf(u, social) !== "anonymous").map((u) => u.localId);

  const have = new Set<string>();
  const closed = new Set<string>();
  let page = "";
  for (let i = 0; i < 20; i++) {
    const r = await fetch(`${db}/penpals?pageSize=1000&mask.fieldPaths=open${page ? `&pageToken=${encodeURIComponent(page)}` : ""}`, { headers: auth });
    if (!r.ok) throw new Error(`penpals-${r.status}`);
    const j = await r.json();
    for (const d of j.documents ?? []) { const id = String(d.name).split("/").pop()!; have.add(id); if (d.fields?.open?.booleanValue !== true) closed.add(id); }
    page = j.nextPageToken ?? "";
    if (!page) break;
  }

  let added = 0, skipped = 0, reopened = 0;
  for (const uid of members.filter((u) => !have.has(u) || closed.has(u))) {
    const read = async (path: string) => { const r = await fetch(`${db}/${path}`, { headers: auth }); return r.ok ? r.json() : null; };
    const [u, st] = await Promise.all([read(`users/${encodeURIComponent(uid)}`), read(`stats/${encodeURIComponent(uid)}`)]);
    const pf = u?.fields?.profile?.mapValue?.fields ?? {};
    const profile = {
      avatarBird: pf.avatarBird?.stringValue, homePlace: pf.homePlace?.stringValue, penpalName: pf.penpalName?.stringValue,
      penpalOff: pf.penpalOff?.booleanValue,
    };
    const doc = backfillPenpal(profile, st?.fields?.place?.stringValue);
    if (!doc) { skipped++; continue; }
    if (have.has(uid)) {
      // 예전 기본값(꺼짐)으로 내려가 있던 줄을 다시 켜요(본인이 새로 끈 사람 penpalOff=true는 위에서 빠짐)
      const r = await fetch(`${db}/penpals/${encodeURIComponent(uid)}?updateMask.fieldPaths=open&updateMask.fieldPaths=listed`, { method: "PATCH", headers: { ...auth, "Content-Type": "application/json" }, body: JSON.stringify({ fields: { open: { booleanValue: true }, listed: { booleanValue: true } } }) });
      if (r.ok) reopened++; else skipped++;
      continue;
    }
    const body = { fields: {
      name: { stringValue: doc.name }, bird: { stringValue: doc.bird }, region: { stringValue: doc.region },
      tags: { arrayValue: {} }, open: { booleanValue: true }, listed: { booleanValue: true }, at: { timestampValue: new Date().toISOString() },
    } };
    const r = await fetch(`${db}/penpals/${encodeURIComponent(uid)}?currentDocument.exists=false`, { method: "PATCH", headers: { ...auth, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (r.ok) added++; else skipped++;
  }
  return { members: members.length, had: members.filter((u) => have.has(u)).length, added, reopened, skipped };
}
