/**
 * 지역 찾기: "송" → 서울 송파구, "ㅅㅍ" → 송파, "경복" → 종로구 · 경복궁 처럼 한두 글자만 쳐도 찾아요.
 * 이름·랜드마크·지역 이름(서울, 수도권…)을 모두 보고, 앞글자가 맞는 것을 먼저 보여줘요.
 */
import type { Place } from "./places";

const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
const isJamo = (ch: string) => ch >= "ㄱ" && ch <= "ㅎ";

/** 한글 글자의 첫 자음(초성)만 뽑아요. 한글이 아닌 글자는 그대로 */
export function choseong(s: string): string {
  let out = "";
  for (const ch of s) {
    const c = ch.charCodeAt(0);
    out += c >= 0xac00 && c <= 0xd7a3 ? CHO[Math.floor((c - 0xac00) / 588)] : ch;
  }
  return out;
}

const norm = (s: string) => s.replace(/\s+/g, "").toLowerCase();
const words = (s: string) => s.split(/[\s·]+/).filter(Boolean);

/** 이름 앞의 "서울 " 같은 말머리를 뺀 짧은 이름(송파구) */
const shortName = (p: Place) => (p.name.startsWith("서울 ") ? p.name.slice(3) : p.name);

/** 글자가 맞은 부분(강조용). 없으면 null */
export function matchRange(text: string, q: string): [number, number] | null {
  const query = q.trim();
  if (!query) return null;
  const i = text.toLowerCase().indexOf(query.toLowerCase());
  return i >= 0 ? [i, i + query.length] : null;
}

/** 낮을수록 잘 맞아요. 안 맞으면 null */
function score(p: Place, q: string): number | null {
  const nq = norm(q);
  if (!nq) return 0;
  const jamo = [...nq].every(isJamo);
  const fields = [p.name, shortName(p), p.landmark.name];
  let best: number | null = null;
  const take = (v: number) => { if (best === null || v < best) best = v; };

  for (const [fi, f] of fields.entries()) {
    const weight = fi === 2 ? 0.5 : 0; // 랜드마크로 찾으면 조금 뒤에
    const nf = norm(f);
    if (!jamo) {
      if (nf.startsWith(nq)) take(0 + weight);
      else if (words(f).some((w) => norm(w).startsWith(nq))) take(1 + weight);
      else if (nf.includes(nq)) take(3 + weight);
    } else {
      const cf = choseong(nf);
      if (cf.startsWith(nq)) take(1 + weight);
      else if (words(f).some((w) => choseong(norm(w)).startsWith(nq))) take(2 + weight);
      else if (cf.includes(nq)) take(4 + weight);
    }
  }
  // "서울", "수도권", "경상"처럼 지역 이름으로 찾기
  if (!jamo && norm(p.region).startsWith(nq)) take(2.5);
  if (jamo && choseong(norm(p.region)).startsWith(nq)) take(3.5);
  return best;
}

/** 검색어에 맞는 지역을 잘 맞는 순서로(같으면 큰 도시·서울 구 먼저). 검색어가 비면 빈 목록 */
export function searchPlaces(places: Place[], q: string, limit = 30): Place[] {
  if (!norm(q)) return [];
  return places
    .map((p, i) => ({ p, i, s: score(p, q) }))
    .filter((x): x is { p: Place; i: number; s: number } => x.s !== null)
    .sort((a, b) => a.s - b.s || a.i - b.i)
    .slice(0, limit)
    .map((x) => x.p);
}
