/**
 * 운영자 숫자판(/admin)에 보여 줄 숫자 계산. 서버(api/admin/stats)가 구글에서 받아 온 계정 목록을 여기서 셉니다.
 * 이름·편지 내용은 다루지 않고 숫자만 돌려줘요.
 */

/** 숫자판을 볼 수 있는 계정(대표님). 계정 번호는 비밀 값이 아니고, 서버가 로그인 토큰으로 본인인지 확인해요 */
export const ADMIN_UIDS: string[] = [];

export const isAdmin = (uid: string, extra: string[] = []) => [...ADMIN_UIDS, ...extra].includes(uid);

/** 환경 변수 ADMIN_UIDS("a,b,c")도 함께 받아요(코드를 안 바꾸고 추가할 때) */
export const adminFromEnv = (raw: string | undefined) => (raw ?? "").split(",").map((s) => s.trim()).filter(Boolean);

/** 구글 Identity Toolkit accounts:batchGet 의 계정 한 줄(필요한 칸만) */
export type AuthUser = {
  localId: string;
  createdAt?: string; // 밀리초(글자)
  lastLoginAt?: string;
  lastRefreshAt?: string; // ISO
  providerUserInfo?: { providerId?: string }[];
  email?: string;
};

export type Provider = "kakao" | "google" | "apple" | "other" | "anonymous";

export function providerOf(u: AuthUser): Provider {
  if (u.localId.startsWith("kakao:")) return "kakao";
  const ids = (u.providerUserInfo ?? []).map((p) => p.providerId ?? "");
  if (ids.includes("google.com")) return "google";
  if (ids.includes("apple.com")) return "apple";
  if (ids.length || u.email) return "other";
  return "anonymous";
}

const DAY = 86_400_000;

/** 한국 시간 오늘 0시(밀리초) */
export function kstMidnight(now: number) {
  const k = now + 9 * 3600_000;
  return k - (k % DAY) - 9 * 3600_000;
}

/** 마지막으로 앱을 연 시각: 로그인 토큰을 새로 받은 때(lastRefreshAt)가 더 정확하고, 없으면 마지막 로그인 */
const lastSeen = (u: AuthUser) => Math.max(Number(u.lastLoginAt ?? 0), u.lastRefreshAt ? Date.parse(u.lastRefreshAt) || 0 : 0);

export type UserCounts = {
  members: number; // 로그인한 진짜 사용자(익명 제외)
  anonymous: number; // 로그인 전 임시 계정·시험 계정
  byProvider: Record<Exclude<Provider, "anonymous">, number>;
  newToday: number; // 오늘 가입(로그인 계정)
  new7d: number;
  active1d: number; // 최근 24시간 안에 앱을 연 로그인 계정
  active7d: number;
};

export function countUsers(users: AuthUser[], now: number): UserCounts {
  const out: UserCounts = { members: 0, anonymous: 0, byProvider: { kakao: 0, google: 0, apple: 0, other: 0 }, newToday: 0, new7d: 0, active1d: 0, active7d: 0 };
  const today = kstMidnight(now);
  for (const u of users) {
    const p = providerOf(u);
    if (p === "anonymous") { out.anonymous++; continue; }
    out.members++;
    out.byProvider[p]++;
    const made = Number(u.createdAt ?? 0);
    if (made >= today) out.newToday++;
    if (made >= now - 7 * DAY) out.new7d++;
    const seen = lastSeen(u);
    if (seen >= now - DAY) out.active1d++;
    if (seen >= now - 7 * DAY) out.active7d++;
  }
  return out;
}

/** Firestore runAggregationQuery 응답에서 count 하나 꺼내기 */
export function readCount(res: unknown): number {
  const row = Array.isArray(res) ? res[0] : null;
  const v = row?.result?.aggregateFields?.n?.integerValue;
  return v === undefined ? 0 : Number(v);
}

/** letters를 보낸 시각(sentAt) 기준으로 세는 요청서. since가 없으면 전체 */
export function lettersCountQuery(since?: number) {
  const structuredQuery: Record<string, unknown> = { from: [{ collectionId: "letters" }] };
  if (since !== undefined) {
    structuredQuery.where = { fieldFilter: { field: { fieldPath: "sentAt" }, op: "GREATER_THAN_OR_EQUAL", value: { timestampValue: new Date(since).toISOString() } } };
  }
  return { structuredAggregationQuery: { structuredQuery, aggregations: [{ alias: "n", count: {} }] } };
}
