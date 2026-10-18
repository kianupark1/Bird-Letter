/**
 * 받는 사람 이름 찾기(2026-10-18, 대표님: "어 자만 쳐도 가깝고 비슷한 것만 남게").
 * 한글을 치는 중간 글자("엄" → "어머니"의 "어+ㅁ")와 초성("ㅇㅁㄴ" → "어머니")까지 맞춰 줘요.
 */
const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
// 받침 → 다음 글자의 초성으로 읽을 때(겹받침은 뒤 자음)
const JONG_TO_CHO = ["", "ㄱ", "ㄲ", "ㅅ", "ㄴ", "ㅈ", "ㅎ", "ㄷ", "ㄹ", "ㄱ", "ㅁ", "ㅂ", "ㅅ", "ㅌ", "ㅍ", "ㅎ", "ㅁ", "ㅂ", "ㅅ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
const isSyl = (c: string) => c >= "가" && c <= "힣";

export function choseong(s: string) {
  return [...s].map((c) => (isSyl(c) ? CHO[Math.floor((c.charCodeAt(0) - 0xac00) / 588)] : c)).join("");
}
const isChoOnly = (q: string) => q.length > 0 && [...q].every((c) => CHO.includes(c));
const norm = (s: string) => s.replace(/\s+/g, "").toLowerCase();

/** 이름과 친 글자가 얼마나 가까운지: 0 같음, 1 앞부분이 같음, 2 중간에 들어 있음, 3 초성이 맞음, -1 안 맞음 */
export function matchName(name: string, query: string): number {
  const n = norm(name), q = norm(query);
  if (!q) return -1;
  if (n === q) return 0;
  if (n.startsWith(q)) return 1;
  if (n.includes(q)) return 2;
  // 치는 중인 마지막 글자: "엄"은 "어"+다음 글자 초성 "ㅁ"으로도 봐요
  const last = q[q.length - 1];
  if (isSyl(last)) {
    const code = last.charCodeAt(0) - 0xac00, jong = code % 28;
    if (jong) {
      const head = q.slice(0, -1) + String.fromCharCode(0xac00 + code - jong), cho = JONG_TO_CHO[jong];
      const i = n.indexOf(head);
      if (i >= 0 && isSyl(n[i + head.length] ?? "") && choseong(n[i + head.length]) === cho) return i === 0 ? 1 : 2;
    }
  }
  if (isChoOnly(q) && choseong(n).includes(q)) return 3;
  return -1;
}

/** 후보 이름들 중 가까운 것만 골라 가까운 순서로(같은 이름은 한 번만) */
export function suggestNames<T extends { name: string }>(items: T[], query: string, limit = 5): T[] {
  const seen = new Set<string>();
  return items
    .map((it) => ({ it, s: matchName(it.name, query) }))
    .filter(({ it, s }) => s > 0 && it.name.trim() && !seen.has(norm(it.name)) && (seen.add(norm(it.name)), true))
    .sort((a, b) => a.s - b.s || a.it.name.length - b.it.name.length)
    .slice(0, limit)
    .map(({ it }) => it);
}
