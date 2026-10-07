/** 한글 이름 끝 글자에 받침이 있는지 */
export function hasFinalConsonant(word: string): boolean {
  const ch = word.trim().slice(-1);
  if (!ch) return false;
  const code = ch.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return false; // 한글이 아니면 받침 없음으로 취급
  return (code - 0xac00) % 28 !== 0;
}

/** 주격 조사: 받침이 있으면 "이", 없으면 "가" (예: 지민이, 민수가) */
export const iGa = (word: string) => (hasFinalConsonant(word) ? "이" : "가");

/** 이름 + 주격 조사 (예: "지민이", "민수가") */
export const withIGa = (word: string) => `${word}${iGa(word)}`;

/** 목적격 조사: 받침이 있으면 "을", 없으면 "를" (예: 한라산을, 오동도를) */
export const eulReul = (word: string) => (hasFinalConsonant(word) ? "을" : "를");

/** 이름 + 목적격 조사 */
export const withEulReul = (word: string) => `${word}${eulReul(word)}`;
