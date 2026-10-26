/**
 * 한국 휴대폰 번호를 국제 형식(+8210…)으로 바꿔요. 휴대폰 번호가 아니면 null.
 * "010-1234-5678", "01012345678", "+82 10 1234 5678", "82-10-…" 모두 받아요.
 */
export function toE164(input: string): string | null {
  let d = input.replace(/[^\d+]/g, "");
  if (d.startsWith("+82")) d = "0" + d.slice(3);
  else if (d.startsWith("82") && d.length >= 11) d = "0" + d.slice(2);
  d = d.replace(/\+/g, "");
  if (!/^01[016789]\d{7,8}$/.test(d)) return null;
  return "+82" + d.slice(1);
}

/** 화면에 보여 줄 때(가운데를 가려요): 010-12**-5678 */
export function maskPhone(e164: string): string {
  const d = "0" + e164.replace(/^\+82/, "");
  const tail = d.slice(-4), mid = d.slice(3, -4);
  return `${d.slice(0, 3)}-${mid.slice(0, 2)}${"*".repeat(Math.max(0, mid.length - 2))}-${tail}`;
}
