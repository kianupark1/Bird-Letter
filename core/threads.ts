/**
 * 메신저처럼 "사람 한 명 = 대화방 하나"로 편지를 묶는 계산(화면과 상관없는 순수 계산).
 * 보낸 편지는 받는 사람(친구 uid, 없으면 입력한 이름), 받은 편지는 보낸 사람(uid)으로 묶어요.
 * 친구인데 아직 편지를 주고받지 않은 사람도 빈 대화방으로 나와요.
 */
export type SentLike = { id: string; to: string; toUid?: string; sentAt: number };
export type ReceivedLike = { id: string; fromUid: string; fromName: string; sentAt: number };
export type FriendLike = { uid: string; name: string };

export type ThreadEntry<S, R> = { dir: "sent"; item: S; at: number } | { dir: "received"; item: R; at: number };
export type Thread<S, R> = {
  /** 주소에 쓰는 구분값: u:<uid> 또는 n:<이름> */
  key: string;
  uid?: string;
  name: string;
  /** 최신 편지가 맨 앞 */
  entries: ThreadEntry<S, R>[];
  /** 가장 최근 편지 시각(편지가 없으면 0) */
  lastAt: number;
  /** 이 사람의 계정들(같은 사람으로 합친 계정 포함). uid는 그중 편지를 보낼 계정 */
  uids?: string[];
};

export const keyForUid = (uid: string) => `u:${uid}`;
export const keyForName = (name: string) => `n:${name}`;

/** 주소의 ?u=<uid> 또는 ?n=<이름> 값을 구분값으로 */
export function keyFromParams(u: string | null, n: string | null): string | null {
  if (u) return keyForUid(u);
  if (n) return keyForName(n);
  return null;
}

/**
 * 사람 정리장(내 계정에 저장): 같은 사람이 둘로 갈라지지 않게 해요(사람은 이름이 아니라 계정 uid로 구분).
 * - alias: 이름만 적어 보낸 사람 → 친구 uid
 * - same: 같은 사람의 다른 계정 uid → 대표 uid (예: 예전 시험용 계정, 다른 로그인으로 만든 계정)
 * - nick: 친구를 내가 부르는 이름
 * 이름을 아직 안 정한 기본 이름("새 친구")은 서로 다른 사람일 수 있어서 저절로 합치지 않아요.
 */
export type PeopleBook = { alias?: Record<string, string>; same?: Record<string, string>; nick?: Record<string, string> };
export const PLACEHOLDER_NAMES = new Set(["", "새 친구", "누군가", "보낸 사람"]);

/**
 * 계정마다 겹치지 않는 짧은 표(카카오톡 아이디처럼): 계정 uid로 정해지는 4글자. 예: #K7Q2
 * 이름이 없거나 같아도 이 표로 사람을 구분해요. "새 친구" 같은 기본 이름은 화면에 쓰지 않아요.
 */
export function uidTag(uid: string): string {
  let h = 2166136261 >>> 0;
  for (const ch of uid) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 헷갈리는 글자(0·O·1·I) 뺌
  let out = "";
  for (let i = 0; i < 4; i++) { h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; h = (h ^ (h >>> 13)) >>> 0; out += A[h % A.length]; }
  return out;
}
/** 이름이 아직 없는 친구를 부르는 이름: "친구 #K7Q2" */
export const unnamed = (uid: string) => `친구 #${uidTag(uid)}`;
/** 이름이 정해지지 않은(기본 이름이거나 표로만 부르는) 사람인지 */
export const isUnnamed = (name: string) => PLACEHOLDER_NAMES.has(name.trim()) || /^친구 #[A-Z2-9]{4}$/.test(name);

export function buildThreads<S extends SentLike, R extends ReceivedLike>(sent: S[], received: R[], friends: FriendLike[], book: PeopleBook = {}): Thread<S, R>[] {
  const alias = book.alias ?? {}, nick = book.nick ?? {};
  const same: Record<string, string> = { ...(book.same ?? {}) };
  const friendName = new Map(friends.map((f) => [f.uid, f.name]));
  const shown = (uid: string) => nick[uid] || friendName.get(uid) || "";
  // 이름이 똑같은 친구 계정들은 같은 사람으로 봐요(기본 이름 "새 친구"는 제외)
  const byName = new Map<string, string>();
  for (const f of [...friends].sort((x, y) => x.uid.localeCompare(y.uid))) {
    const n = shown(f.uid);
    if (PLACEHOLDER_NAMES.has(n)) continue;
    const first = byName.get(n);
    if (!first) byName.set(n, f.uid);
    else if (!same[f.uid] && first !== f.uid) same[f.uid] = first;
  }
  const root = (uid: string) => { let x = uid; for (let i = 0; i < 10 && same[x] && same[x] !== x; i++) x = same[x]; return x; };

  type T = Omit<Thread<S, R>, "uids"> & { uids: Set<string> };
  const map = new Map<string, T>();
  const get = (key: string, name: string): T => {
    const hit = map.get(key);
    if (hit) return hit;
    const t: T = { key, uid: undefined, name, entries: [], lastAt: 0, uids: new Set() };
    map.set(key, t);
    return t;
  };
  const forUid = (uid: string) => { const r = root(uid); const t = get(keyForUid(r), ""); t.uids.add(uid); t.uids.add(r); return t; };
  for (const f of friends) forUid(f.uid);
  // 이름만 적어 보낸 편지도, 같은 이름(친구가 정한 이름이나 내가 부르는 이름)의 친구가 있으면 그 친구 한 명으로 합쳐요
  const friendByName = new Map<string, string>();
  for (const f of friends) for (const n of [f.name, nick[f.uid]]) if (n && !PLACEHOLDER_NAMES.has(n) && !friendByName.has(n)) friendByName.set(n, f.uid);
  const sendTo = new Map<string, { uid: string; at: number }>(); // 방마다 최근에 쓰인 계정(보낼 대상)
  const note = (t: T, uid: string, at: number) => { const cur = sendTo.get(t.key); if (!cur || at > cur.at) sendTo.set(t.key, { uid, at }); };
  for (const s of sent) {
    const uid = s.toUid ?? alias[s.to] ?? friendByName.get(s.to);
    const t = uid ? forUid(uid) : get(keyForName(s.to), s.to);
    if (uid && s.toUid) note(t, s.toUid, s.sentAt);
    t.entries.push({ dir: "sent", item: s, at: s.sentAt });
  }
  const recvName = new Map<string, string>();
  for (const r of received) {
    const t = forUid(r.fromUid);
    note(t, r.fromUid, r.sentAt + 1); // 받은 편지가 있으면 그 계정이 지금 쓰는 계정일 가능성이 커요
    if (r.fromName) recvName.set(r.fromUid, r.fromName);
    t.entries.push({ dir: "received", item: r, at: r.sentAt });
  }
  const list = [...map.values()];
  for (const t of list) {
    t.entries.sort((a, b) => b.at - a.at);
    t.lastAt = t.entries[0]?.at ?? 0;
    if (t.uids.size) {
      const ids = [...t.uids];
      const r = root(ids[0]);
      t.uid = sendTo.get(t.key)?.uid ?? (friendName.has(r) ? r : ids.find((u) => friendName.has(u)) ?? r);
      // 이름: 내가 부르는 이름 > 친구가 정한 진짜 이름 > 받은 편지에 적힌 이름 > 기본 이름
      const names = [...ids.map((u) => nick[u]), ...ids.map((u) => friendName.get(u)), ...ids.map((u) => recvName.get(u))].filter((n): n is string => !!n);
      t.name = names.find((n) => !PLACEHOLDER_NAMES.has(n)) ?? unnamed(r); // 이름이 없으면 "새 친구" 대신 겹치지 않는 표로
    }
  }
  return list.map(({ uids, ...t }): Thread<S, R> => ({ ...t, uids: [...uids] })).sort((a, b) => (b.lastAt - a.lastAt) || a.name.localeCompare(b.name, "ko"));
}

export const initialOf = (name: string) => (name.trim()[0] ?? "새");

/** 이름을 고르게 흩어 놓는 계산(한글은 단순 곱셈으로는 한쪽으로 몰려요) */
function mix(name: string) {
  let h = 2166136261;
  for (const ch of name) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995) >>> 0; h ^= h >>> 15;
  return h >>> 0;
}

/** 아바타 배경색 번호(이름이 같으면 항상 같은 색) */
export function avatarTone(name: string, tones = 4) {
  return mix(name + "#") % tones;
}

/** 새 얼굴 후보(core/birds.ts의 id와 같아야 해요) */
export const AVATAR_BIRDS = ["magpie", "pigeon", "swallow", "crane", "bungbungi", "hawk"] as const;

/** 친구가 "내 새"를 고르지 않았거나 아직 모를 때: 이름으로 항상 같은 새를 정해 줘요 */
export function avatarBirdFor(name: string, chosen?: string | null): string {
  if (chosen && (AVATAR_BIRDS as readonly string[]).includes(chosen)) return chosen;
  return AVATAR_BIRDS[mix(name) % AVATAR_BIRDS.length];
}
