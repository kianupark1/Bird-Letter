/**
 * 비행 계획: 실제 속도로 걸리는 시간 + 아주 드문 "길 잃음/나무 걸림" 사고.
 *
 * 사고는 보낼 때 편지 ID와 새 종류로 정해져요(같은 ID면 누가 계산해도 같은 결과).
 * 그래서 서버에 따로 저장하는 값이 없고, 보낸 사람·받는 사람의 화면이 항상 같은 이야기를 보여줘요.
 * 사고가 나면 그만큼 도착 시각(arriveAt)이 늦어질 뿐이고, 편지는 사라지지 않아요.
 */
import { getBird, type MishapKind } from "./birds";

/** 이 시각 이후에 보낸 편지부터 사고 규칙을 적용해요(그전에 보낸 시험 편지는 옛 계산 그대로) */
export const MISHAP_SINCE = Date.parse("2026-10-08T00:00:00+09:00");

/** 길 잃음·나무 걸림이 편지를 붙잡아 두는 시간: 원래 비행 시간의 25%~75% */
export const DELAY_RANGE = [0.25, 0.75] as const;
/** 사고가 나는 지점: 경로의 20%~80% 사이 */
export const AT_RANGE = [0.2, 0.8] as const;

export type Mishap = { kind: MishapKind; /** 경로 진행률(0~1) */ at: number; /** 원래 비행 시간에 대한 지연 비율 */ delayFrac: number };

function hash32(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 이 편지에 사고가 있는지. 없으면 null */
export function rollMishap(letterId: string, birdId: string, sentAt: number): Mishap | null {
  if (sentAt < MISHAP_SINCE) return null;
  const r = rng(hash32(`${letterId}|${birdId}|mishap`));
  if (r() * getBird(birdId).mishapOneIn >= 1) return null;
  return {
    kind: r() < 0.5 ? "lost" : "tree",
    at: AT_RANGE[0] + r() * (AT_RANGE[1] - AT_RANGE[0]),
    delayFrac: DELAY_RANGE[0] + r() * (DELAY_RANGE[1] - DELAY_RANGE[0]),
  };
}

/** 사고 때문에 늘어나는 비율(없으면 0) */
export const extraFrac = (m: Mishap | null) => (m ? m.delayFrac : 0);

/** 보낼 때 쓰는 전체 비행 시간(분, 소수 포함). speed는 테스트 배속(평소 1) */
export function totalMinutes(letterId: string, birdId: string, km: number, sentAt: number, speed = 1) {
  const base = ((km / getBird(birdId).kmh) * 60) / speed;
  return base * (1 + extraFrac(rollMishap(letterId, birdId, sentAt)));
}

export type Plan = {
  mishap: Mishap | null;
  /** 사고가 없었을 때 걸리는 시간(ms) */
  baseMs: number;
  /** 보낸 시각부터 도착까지 전체(ms) */
  totalMs: number;
  /** 멈춰 있는 구간(보낸 시각 기준 ms). 사고가 없으면 null */
  stall: { from: number; to: number } | null;
};

/** 보낸 시각·도착 시각·편지 ID로 비행 계획을 세워요 */
export function planFor(letterId: string, birdId: string, sentAt: number, arriveAt: number): Plan {
  const totalMs = Math.max(1, arriveAt - sentAt);
  const mishap = rollMishap(letterId, birdId, sentAt);
  const baseMs = totalMs / (1 + extraFrac(mishap));
  const stall = mishap ? { from: mishap.at * baseMs, to: mishap.at * baseMs + mishap.delayFrac * baseMs } : null;
  return { mishap, baseMs, totalMs, stall };
}

/** 지금까지 흐른 시간(ms)에서 경로 진행률과 멈춤 여부 */
export function progressAt(plan: Plan, elapsedMs: number) {
  const done = elapsedMs >= plan.totalMs;
  if (done) return { p: 1, stalled: false, done: true };
  const e = Math.max(0, elapsedMs);
  if (!plan.stall || e < plan.stall.from) return { p: Math.min(1, e / plan.baseMs), stalled: false, done: false };
  if (e < plan.stall.to) return { p: plan.mishap!.at, stalled: true, done: false };
  return { p: Math.min(1, (e - (plan.stall.to - plan.stall.from)) / plan.baseMs), stalled: false, done: false };
}

/** 경로의 f(0~1) 지점을 지나는 시각이 보낸 시각으로부터 몇 ms 뒤인지 */
export function elapsedAtFraction(plan: Plan, f: number) {
  const base = f * plan.baseMs;
  if (!plan.stall || f <= plan.mishap!.at) return base;
  return base + (plan.stall.to - plan.stall.from);
}

/** 사고 안내 문구(화면·알림이 같이 써요) */
export function mishapMessage(kind: MishapKind, birdName: string) {
  return kind === "tree"
    ? { title: `${birdName}가 나무에 걸렸어요!`, body: "가지에서 빠져나오는 중이에요. 조금 늦어지지만 편지는 꼭 도착해요." }
    : { title: `${birdName}가 길을 잃었어요!`, body: "길을 다시 찾는 중이에요. 조금 늦어지지만 편지는 꼭 도착해요." };
}
