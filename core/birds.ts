export type MishapKind = "lost" | "tree";

export type Bird = {
  id: string;
  name: string;
  emoji: string;
  badge: string;
  /** 실제 비행 속도(시속 km, 순항 기준 대략값). 도착 시간은 이 값으로 계산해요 */
  kmh: number;
  /** 편지 N통에 한 번꼴로 길을 잃거나 나무에 걸려요(도착이 늦어질 뿐 편지는 꼭 도착해요) */
  mishapOneIn: number;
  /** 서울-부산(325km) 기준 소요 분. kmh에서 계산한 값 */
  minutesSeoulBusan: number;
  note: string;
  /** 속도 옆에 붙이는 한 줄(왜 이 속도인지) */
  speedNote: string;
};

export const REFERENCE_KM = 325;

const make = (b: Omit<Bird, "minutesSeoulBusan">): Bird => ({ ...b, minutesSeoulBusan: Math.round((REFERENCE_KM / b.kmh) * 60) });

export const BIRDS: Bird[] = [
  make({ id: "hawk", name: "매", emoji: "🦅", badge: "프리미엄", kmh: 90, mishapOneIn: 100, note: "가장 빠른 특급 배달", speedNote: "눈이 밝아 길을 잘 찾아요" }),
  make({ id: "swallow", name: "제비", emoji: "🐦", badge: "추천", kmh: 40, mishapOneIn: 60, note: "가볍고 경쾌한 봄 소식", speedNote: "작고 가벼워 바람을 타요" }),
  make({ id: "pigeon", name: "비둘기", emoji: "🕊️", badge: "기본", kmh: 65, mishapOneIn: 80, note: "믿음직한 기본 배달", speedNote: "집 찾는 본능이 뛰어나요" }),
  make({ id: "magpie", name: "까치", emoji: "🐦‍⬛", badge: "특별", kmh: 35, mishapOneIn: 50, note: "도착 연출이 특별해요", speedNote: "나무를 좋아해서 자주 들러요" }),
  make({ id: "bungbungi", name: "붕붕이", emoji: "🚁", badge: "재미", kmh: 60, mishapOneIn: 50, note: "드론 새 마스코트", speedNote: "소형 드론 속도예요" }),
  make({ id: "crane", name: "두루미", emoji: "🦢", badge: "귀한 소식", kmh: 55, mishapOneIn: 100, note: "가장 귀한 소식용", speedNote: "느긋하지만 길을 잃지 않아요" }),
];

/** 소개 화면용: 느린 새부터 빠른 새 순서 */
export const BIRDS_SLOW_TO_FAST: Bird[] = [...BIRDS].sort((a, b) => a.kmh - b.kmh);

export const getBird = (id: string) => BIRDS.find((b) => b.id === id) ?? BIRDS[2];

/** "약 100통에 1번" 같은 표시 문구 */
export const mishapText = (b: Bird) => `약 ${b.mishapOneIn}통에 1번 길을 잃거나 나무에 걸려 늦어져요`;

/** 카드용 짧은 문구 */
export const mishapShort = (b: Bird) => `길 잃음·나무 걸림: 약 ${b.mishapOneIn}통에 1번`;
