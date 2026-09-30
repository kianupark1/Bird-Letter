export type Bird = {
  id: string;
  name: string;
  badge: string;
  /** 서울-부산(325km) 기준 소요 분 */
  minutesSeoulBusan: number;
  note: string;
};

export const BIRDS: Bird[] = [
  { id: "hawk", name: "매", badge: "프리미엄", minutesSeoulBusan: 15, note: "가장 빠른 특급 배달" },
  { id: "swallow", name: "제비", badge: "추천", minutesSeoulBusan: 30, note: "빠르고 가벼운 봄 소식" },
  { id: "pigeon", name: "비둘기", badge: "기본", minutesSeoulBusan: 40, note: "믿음직한 기본 배달" },
  { id: "magpie", name: "까치", badge: "특별", minutesSeoulBusan: 55, note: "도착 연출이 특별해요" },
  { id: "bungbungi", name: "붕붕이", badge: "재미", minutesSeoulBusan: 20, note: "드론 새 마스코트" },
  { id: "crane", name: "두루미", badge: "귀한 소식", minutesSeoulBusan: 90, note: "가장 귀한 소식용" },
];

export const REFERENCE_KM = 325;
