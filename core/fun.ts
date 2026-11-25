/**
 * 처음부터 재미있게(2026-11-25 대표님: "재미거리가 부족, 앱이 복잡해지지 않는 선에서 처음부터 재미를 느끼게").
 * 화면·버튼은 늘리지 않고, 이미 있는 자리의 글만 새마다 성격 있게 바꿔요.
 * - 새 고르기: 새마다 한 줄 성격(MBTI 느낌)
 * - 홈 "날아가는 중" 카드: 지금 새가 뭘 하는지 한 줄(편지 ID로 정해져 양쪽 화면이 같고, 진행에 따라 바뀜)
 * - 첫 화면 말풍선: 열 때마다 새 한마디
 * 실제 비행 시간·사고(길 잃음·나무 걸림)는 바꾸지 않아요. 한 줄 글은 재미일 뿐이에요.
 */
export const BIRD_FUN: Record<string, string> = {
  hawk: "칼배달 😎 도착하면 바로 퇴근해요",
  pigeon: "성실한 기본형 🕊 집 찾기는 자신 있어요",
  magpie: "오지랖 대장 📣 동네 소식까지 물어 와요",
  sparrow: "쉬엄쉬엄 🐤 붕어빵 냄새 맡으면 잠깐 멈춰요",
  owl: "밤에만 출근 🦉 아침엔 연락 두절이에요",
};
export const birdFun = (id: string) => BIRD_FUN[id] ?? "편지를 꼭 전해 줄게요 🕊";

const MOODS: Record<string, string[]> = {
  hawk: ["바람을 가르며 직진 중 💨", "구름 위로 지름길 찾는 중", "속도 줄일 생각 1도 없음", "눈빛이 아주 진지해요"],
  pigeon: ["날개 리듬 맞추는 중 🎵", "익숙한 길이라 콧노래 중", "전깃줄에서 숨 한 번 고르는 중", "편지 꼭 쥐고 성실하게 나는 중"],
  magpie: ["지나가는 새들한테 인사하는 중 👋", "동네 소식 귀동냥 중", "반짝이는 거 보면 한 번 쳐다봄", "편지 자랑하면서 나는 중"],
  sparrow: ["작은 날개로 열심히 퍼덕퍼덕", "붕어빵 냄새에 흔들리는 중 🐟", "참새 친구들한테 길 물어보는 중", "쉬엄쉬엄, 그래도 꼭 가요"],
  owl: ["별 보면서 나는 중 ✨", "달빛 따라 조용히 가는 중 🌙", "밤바람이 시원하대요", "눈을 크게 뜨고 길 찾는 중"],
};
const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };

/** 지금 새가 뭘 하는지 한 줄. 진행(0~1)을 4구간으로 나눠 구간마다 바뀌고, 같은 편지면 누가 봐도 같아요 */
export function flightMood(letterId: string, birdId: string, p: number) {
  const pool = MOODS[birdId] ?? MOODS.pigeon;
  const step = Math.min(3, Math.max(0, Math.floor(p * 4)));
  return pool[(hash(letterId) + step) % pool.length];
}

/** 첫 화면 말풍선 한마디 */
export const START_LINES = [
  "짹짹! 반가워요 🌤",
  "오늘은 누구한테 날아가 볼까요?",
  "카톡보다 느려요. 대신 더 설레요 💌",
  "편지 물고 날아갈 준비 완료! 🕊",
  "참새는 붕어빵 냄새만 안 나면 빨라요 🐟",
];
export const startLine = (seed: number) => START_LINES[Math.abs(Math.floor(seed)) % START_LINES.length];
