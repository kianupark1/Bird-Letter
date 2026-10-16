/**
 * 기다림의 미학 문구: 기다리는 시간이 설레도록(가장 중요한 원칙). 날마다·편지마다 바뀌어요.
 * 사실을 주장하지 않는 감성 문구만 써요(홍보 문구 규칙과 같음).
 */
export const WAITING_LINES = [
  "기다리는 시간도 편지의 일부예요",
  "천천히 와도 괜찮아요, 마음은 이미 출발했어요",
  "느리게 와서 더 반가운 편지",
  "기다림이 길수록 펼칠 때 더 반가워요",
  "빨리 오는 것보다 반갑게 오는 것",
  "창밖을 보며 기다려 볼까요?",
  "새가 마음을 싣고 날아가는 중이에요",
  "오늘의 설렘은 하늘을 날고 있어요",
  "곧 닿을 거예요, 조금만 더 기다려요",
  "기다리는 동안 무슨 말이 담겼을지 상상해 봐요",
];
export const HOME_LINES = [
  "오늘도 편지 날리기 좋은 날 ☀",
  "기다림이 즐거운 편지, 새 편지",
  "느리게 와서 더 반가운 소식",
  "누구에게 마음을 날려 볼까요?",
  "하늘 어딘가에 내 편지가 날고 있어요",
];
const mix = (s: string) => { let h = 2166136261 >>> 0; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h; };
/** 편지(또는 날짜)마다 정해지는 문구 하나 */
export const pickLine = (lines: string[], seed: string) => lines[mix(seed) % lines.length];
/** 오늘 날짜로 고르는 홈 인사말(한국 시간) */
export const todayLine = (now: number) => pickLine(HOME_LINES, new Date(now + 9 * 3600000).toISOString().slice(0, 10));
