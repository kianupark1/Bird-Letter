"use client";

/**
 * 새가 짹짹이는 소리(파일 없이 소리를 직접 만들어 냄). 앱이 열려 있을 때 알림 팝업에 맞춰 울려요.
 * 브라우저는 사람이 한 번 화면을 누르기 전에는 소리를 막아서, 막히면 조용히 건너뜀.
 * 앱을 닫았을 때의 푸시 소리는 폰이 정해요(웹은 소리를 바꿀 수 없음 → 스토어 앱에서 짹짹 소리 파일로 교체 예정).
 */
let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = ctx ?? new AC();
    return ctx;
  } catch { return null; }
}

/** 짧은 "짹" 한 번: 높은 음에서 더 높은 음으로 쑥 올라갔다 내려와요 */
function tweet(c: AudioContext, t: number, base: number, len = 0.11) {
  const o = c.createOscillator(), g = c.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(base, t);
  o.frequency.exponentialRampToValueAtTime(base * 1.45, t + len * 0.55);
  o.frequency.exponentialRampToValueAtTime(base * 1.1, t + len);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.16, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + len + 0.02);
}

export async function playChirp(): Promise<boolean> {
  const c = context();
  if (!c) return false;
  try {
    if (c.state === "suspended") await c.resume();
    if (c.state !== "running") return false;
    const t = c.currentTime + 0.02;
    tweet(c, t, 2300);
    tweet(c, t + 0.16, 2700);
    tweet(c, t + 0.32, 2500, 0.16);
    return true;
  } catch { return false; }
}

/** 폰 진동(안드로이드 등 지원하는 기기만. 아이폰 사파리·홈 화면 앱은 진동을 막아 둬서 조용히 건너뜀) */
export function buzz(pattern: number | number[]) {
  try { if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern); } catch {}
}

/** "푸드덕" 날갯짓 한 번: 짧은 잡음을 낮게 빠르게 */
function flap(c: AudioContext, t: number) {
  const len = 0.07, buf = c.createBuffer(1, Math.floor(c.sampleRate * len), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  s.buffer = buf; f.type = "lowpass"; f.frequency.value = 900; g.gain.value = 0.35;
  s.connect(f).connect(g).connect(c.destination);
  s.start(t);
}

/** 출발: 푸드덕푸드덕 날갯짓 + 짹! */
export async function playDepart(): Promise<boolean> {
  const c = context();
  if (!c) return false;
  try {
    if (c.state === "suspended") await c.resume();
    if (c.state !== "running") return false;
    const t = c.currentTime + 0.02;
    for (let i = 0; i < 4; i++) flap(c, t + i * 0.09);
    tweet(c, t + 0.42, 2600, 0.14);
    return true;
  } catch { return false; }
}

/** 새 소리 + 진동을 한 번에(설정의 "새 짹짹 소리"가 꺼져 있으면 아무것도 안 해요) */
export function birdFx(kind: "depart" | "arrive", on = true) {
  if (!on) return;
  if (kind === "depart") { void playDepart(); buzz([40, 60, 40]); }
  else { void playChirp(); buzz([120, 80, 120, 80, 220]); }
}
