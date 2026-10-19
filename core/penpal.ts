/**
 * 펜팔(모르는 누군가에게 새 날려 보내기) 계산(화면과 상관없는 순수 계산). 시안: docs/시안/images/v5-*.png
 * - 펜팔 이름: "부산 사는 두루미"처럼 시·도 + 내 새로 자동(진짜 이름은 모르는 사람에게 보이지 않아요)
 * - 위치는 시·도까지만: 편지 노선도 시·도의 대표 지역끼리 이어요
 * - 전화번호·주소·아이디처럼 보이는 글은 보내기 전에 가려요
 */
import { PLACES, getPlace } from "./places";

export const PENPAL_TAGS = [
  { id: "book", label: "📚 책" }, { id: "music", label: "🎵 음악" }, { id: "travel", label: "✈️ 여행" }, { id: "cook", label: "🍳 요리" },
  { id: "pet", label: "🐶 동물" }, { id: "game", label: "🎮 게임" }, { id: "plant", label: "🌱 식물" }, { id: "sport", label: "⚽ 운동" },
] as const;
export const TAG_IDS: string[] = PENPAL_TAGS.map((t) => t.id);
export const tagLabel = (id: string) => PENPAL_TAGS.find((t) => t.id === id)?.label ?? "";

const BIRD_NAME: Record<string, string> = { magpie: "까치", pigeon: "비둘기", swallow: "제비", crane: "두루미", bungbungi: "붕붕이", hawk: "매" };

/**
 * 펜팔에서 알려 주는 위치는 "시" 단위까지: 서울의 구는 모두 "서울", 그 밖에는 그 도시(부산·수원·제주…).
 * 펜팔 명단의 region 칸에는 이 도시의 지역 id를 저장해요.
 */
export function cityOf(placeId: string | undefined): string {
  const p = getPlace(placeId ?? "");
  if (!p) return "seoul";
  return p.region === "서울" ? "seoul" : p.id;
}
export const cityLabel = (cityId: string) => (cityId === "seoul" ? "서울" : getPlace(cityId)?.name ?? "어딘가");

/** 펜팔을 날려 보낼 수 있는 도시(보내는 사람이 "어디로"를 고를 때). 동네·구는 없고 도시까지만 */
export const PENPAL_CITIES: string[] = [...new Set(PLACES.map((p) => cityOf(p.id)))];

/** "어디로"를 골랐으면 그 도시에서 받기를 켠 사람만 남겨요(없으면 빈 목록) */
export const poolIn = <T extends { region: string }>(pool: T[], city: string | null): T[] => (city ? pool.filter((p) => p.region === city) : pool);

/** 자동 펜팔 이름(12글자 이하): "부산 사는 두루미" */
export function penpalName(region: string, bird: string): string {
  return `${region} 사는 ${BIRD_NAME[bird] ?? "새"}`.slice(0, 12);
}

/**
 * 연락처처럼 보이는 글 가리기: 전화번호, 이메일, 링크, @아이디, "카톡/인스타/아이디 ○○"
 * (완벽하지 않아요. 신고·차단과 함께 써요)
 */
export function maskContacts(text: string): { text: string; masked: number } {
  let masked = 0;
  const hide = (s: string) => { masked++; return "●".repeat(Math.min(8, Math.max(3, s.replace(/\s/g, "").length))); };
  let t = text;
  t = t.replace(/https?:\/\/\S+|www\.\S+|\b[\w.-]+\.(com|net|kr|io|me|co)\b\S*/gi, hide);
  t = t.replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, hide);
  t = t.replace(/(?:\+?82[\s-]?)?0?1[016-9][\s.-]?\d{3,4}[\s.-]?\d{4}/g, hide);
  t = t.replace(/\b\d{2,4}[\s.-]\d{3,4}[\s.-]\d{4}\b/g, hide);
  t = t.replace(/(?:^|\s)@[A-Za-z0-9_.]{3,}/g, (m) => (m.startsWith(" ") || m.startsWith("\n") ? m[0] : "") + hide(m));
  t = t.replace(/(카톡|카카오톡|인스타|인스타그램|insta|kakao|아이디|id|텔레그램|라인)\s*[:：은는]?\s*([A-Za-z0-9_.]{3,})/gi, (_m, k) => `${k} ${hide("xxxx")}`);
  return { text: t, masked };
}

export type PoolRow = { uid: string; tags: string[]; region: string };

/**
 * 펜팔 상대 고르기: 나·이미 편지를 주고받은 사람·넘긴 사람·차단한 사람은 빼고,
 * 관심사가 겹치는 사람 중에서 무작위(겹치는 사람이 없으면 아무나). rand는 0~1(시험할 때 고정값)
 */
export function pickPenpal(pool: PoolRow[], me: string, exclude: Set<string>, tags: string[], rand: () => number = Math.random): PoolRow | null {
  const ok = pool.filter((p) => p.uid !== me && !exclude.has(p.uid));
  if (!ok.length) return null;
  const match = tags.length ? ok.filter((p) => p.tags.some((t) => tags.includes(t))) : [];
  const from = match.length ? match : ok;
  return from[Math.floor(rand() * from.length) % from.length];
}

/** 펜팔 노선: 도시끼리(같은 도시면 가까운 다른 지역으로). 정확한 동네는 쓰지 않아요 */
export function penpalRoute(fromCity: string, toCity: string): string {
  const from = getPlace(fromCity) ? fromCity : "seoul";
  let to = getPlace(toCity) ? toCity : "seoul";
  if (to === from) {
    const me = getPlace(from)!;
    to = PLACES.filter((p) => p.id !== from).sort((x, y) => (Math.abs(x.lat - me.lat) + Math.abs(x.lng - me.lng)) - (Math.abs(y.lat - me.lat) + Math.abs(y.lng - me.lng)))[0].id;
  }
  return `${from}-${to}`;
}
