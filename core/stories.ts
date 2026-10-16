/**
 * 비행 중 이야기: 편지가 날아가는 동안 생기는 작은 사건(소나기, 도토리 줍기…).
 * 편지 ID로 결정돼서 서버에 저장하는 값이 없고, 보내는 사람·받는 사람 화면이 같아요.
 * 도착 시각에는 영향을 주지 않는 이야기일 뿐이에요(기다림의 미학: 시간을 줄이거나 늘리지 않음).
 */
export type Story = { id: string; icon: string; text: string; item?: { id: string; name: string; emoji: string } };

/** {새}는 새 이름(조사는 문장 안에서 정해요) */
export const STORY_POOL: Story[] = [
  { id: "shower", icon: "🌦", text: "소나기가 지나가요! 잠깐 처마 밑에서 쉬었다 갔어요" },
  { id: "rainbow", icon: "🌈", text: "무지개를 만났어요! 그 아래를 지나 날아가요", item: { id: "rainbow", name: "무지개 조각", emoji: "🌈" } },
  { id: "acorn", icon: "🌰", text: "도토리를 하나 주웠어요", item: { id: "acorn", name: "도토리", emoji: "🌰" } },
  { id: "leaf", icon: "🍁", text: "단풍잎이 날아와 붙었어요", item: { id: "leaf", name: "단풍잎", emoji: "🍁" } },
  { id: "pine", icon: "🌲", text: "솔방울을 발견했어요", item: { id: "pine", name: "솔방울", emoji: "🌲" } },
  { id: "feather", icon: "🪶", text: "다른 새가 깃털 하나를 건네줬어요", item: { id: "feather", name: "깃털", emoji: "🪶" } },
  { id: "shell", icon: "🐚", text: "바닷가 조개껍데기를 주웠어요", item: { id: "shell", name: "조개껍데기", emoji: "🐚" } },
  { id: "star", icon: "⭐", text: "반짝이는 별가루를 맞았어요", item: { id: "star", name: "별가루", emoji: "⭐" } },
  { id: "tailwind", icon: "💨", text: "뒷바람을 탔어요! 기분 좋게 날아가요" },
  { id: "fog", icon: "🌫", text: "안개 속을 조심조심 지나가요" },
  { id: "sunset", icon: "🌇", text: "노을이 예뻐서 잠깐 구경했어요" },
  { id: "friend", icon: "🕊", text: "길에서 새 친구를 만나 인사했어요" },
  { id: "bread", icon: "🍞", text: "누가 빵 부스러기를 나눠 줬어요", item: { id: "bread", name: "빵 부스러기", emoji: "🍞" } },
  { id: "flower", icon: "🌸", text: "꽃잎이 바람에 날려 왔어요", item: { id: "flower", name: "꽃잎", emoji: "🌸" } },
];
export const STORY_ITEMS = STORY_POOL.filter((s) => s.item).map((s) => s.item!);

const mix = (s: string) => { let h = 2166136261 >>> 0; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995) >>> 0; return h ^ (h >>> 15); };
const rng = (seed: string) => { let a = mix(seed) >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

/** 이 편지에서 일어나는 이야기들. f는 경로 진행률(0.15~0.85), 거리가 멀수록 이야기가 많아요(1~3개) */
export function storiesFor(letterId: string, km: number): { f: number; story: Story }[] {
  if (!(km > 20)) return [];
  const n = km < 120 ? 1 : km < 300 ? 2 : 3;
  const r = rng(`story:${letterId}`);
  const pool = [...STORY_POOL];
  const out: { f: number; story: Story }[] = [];
  for (let i = 0; i < n; i++) {
    const f = 0.15 + ((i + 0.2 + r() * 0.6) / n) * 0.7; // 구간마다 한 번씩
    const story = pool.splice(Math.floor(r() * pool.length), 1)[0];
    out.push({ f: Math.round(f * 1000) / 1000, story });
  }
  return out;
}

/** 지금까지 주운 물건(이름→개수). passes: 편지 ID·거리·진행률 */
export function collectItems(passes: { id: string; km: number; p: number }[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const { id, km, p } of passes) for (const s of storiesFor(id, km)) if (s.f <= p && s.story.item) m.set(s.story.item.id, (m.get(s.story.item.id) ?? 0) + 1);
  return m;
}
