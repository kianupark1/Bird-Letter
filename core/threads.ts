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
 * 사람 정리(내 폰에만 저장): alias = 내가 이름만 적어 보낸 사람이 실제로는 어느 친구(uid)인지, nick = 친구를 내가 부르는 이름.
 * 같은 사람이 "내가 정한 이름"과 "친구가 정한 이름"으로 둘로 갈라지지 않게 해요(사람은 이름이 아니라 uid로 구분).
 */
export type PeopleBook = { alias?: Record<string, string>; nick?: Record<string, string> };

export function buildThreads<S extends SentLike, R extends ReceivedLike>(sent: S[], received: R[], friends: FriendLike[], book: PeopleBook = {}): Thread<S, R>[] {
  const map = new Map<string, Thread<S, R>>();
  const alias = book.alias ?? {}, nick = book.nick ?? {};
  const friendName = new Map(friends.map((f) => [f.uid, nick[f.uid] || f.name]));
  const get = (key: string, uid: string | undefined, name: string) => {
    let t = map.get(key);
    if (!t) { t = { key, uid, name, entries: [], lastAt: 0 }; map.set(key, t); }
    return t;
  };
  for (const f of friends) get(keyForUid(f.uid), f.uid, friendName.get(f.uid) ?? f.name);
  // 이름만 적어 보낸 편지도, 같은 이름의 친구가 있으면 그 친구 한 명으로 합쳐요(같은 사람이 둘로 갈라지지 않게)
  const friendByName = new Map<string, string>();
  for (const f of friends) for (const n of [f.name, nick[f.uid]]) if (n && !friendByName.has(n)) friendByName.set(n, f.uid);
  for (const s of sent) {
    const uid = s.toUid ?? alias[s.to] ?? friendByName.get(s.to);
    const t = uid ? get(keyForUid(uid), uid, friendName.get(uid) ?? nick[uid] ?? s.to) : get(keyForName(s.to), undefined, s.to);
    t.entries.push({ dir: "sent", item: s, at: s.sentAt });
  }
  for (const r of received) {
    const t = get(keyForUid(r.fromUid), r.fromUid, friendName.get(r.fromUid) ?? nick[r.fromUid] ?? (r.fromName || "누군가"));
    t.entries.push({ dir: "received", item: r, at: r.sentAt });
  }
  const list = [...map.values()];
  for (const t of list) {
    t.entries.sort((a, b) => b.at - a.at);
    t.lastAt = t.entries[0]?.at ?? 0;
  }
  return list.sort((a, b) => (b.lastAt - a.lastAt) || a.name.localeCompare(b.name, "ko"));
}

/** 이름 첫 글자(동그란 얼굴 그림에 쓰는 글자) */
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
