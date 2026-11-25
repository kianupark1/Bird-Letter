/**
 * 들어온 사람이 어디서 나가는지 세는 단계(2026-11-24 대표님: "숫자부터 해", 안드로이드 출시 전 반드시 해결).
 * 폰마다 하루 한 번만 세요(같은 사람이 여러 번 눌러도 1). 이름·편지 내용·계정은 보내지 않고 단계 이름만 보내요.
 */
export const FUNNEL_STEPS = [
  "welcome_view", // 소개 페이지(/welcome, 광고 링크가 오는 곳)를 봄
  "welcome_try", // 소개 페이지에서 [설치 없이 지금 편지 써 보기]
  "welcome_store", // 소개 페이지에서 [앱스토어에서 받기]
  "welcome_kakao", // 소개 페이지에서 [카카오로 1초 시작]
  "start_view", // 첫 화면(가입 버튼 화면)을 봄
  "trial_open", // [가입 없이 편지 먼저 써 보기]를 누름
  "trial_ready", // 편지를 써서 [새에게 맡기기]를 누름
  "trial_join", // 써 둔 편지를 들고 가입해서 편지 쓰기 화면에 옴
  "letter_sent", // 편지를 보냄(앱 쓰는 사람·앱 없는 사람 모두)
  "kakao_share", // 보낸 뒤 [카카오톡으로 보내기]를 누름
  "link_open", // 앱 없이(가입 전) 편지 링크를 열어 봄
  "reply_open", // 받은 편지에서 [가입 없이 답장 먼저 쓰기]
  "reply_ready", // 답장을 써서 [새에게 맡기기]
  "reply_join", // 써 둔 답장을 들고 가입해서 답장 화면에 옴
  "push_ask", // 보낸 직후 "도착하면 알려 드릴까요?"를 봄
  "push_on", // 거기서 알림을 켬
] as const;
export type FunnelStep = (typeof FUNNEL_STEPS)[number];

export const FUNNEL_LABEL: Record<FunnelStep, string> = {
  welcome_view: "소개",
  welcome_try: "바로 써 보기",
  welcome_store: "앱스토어로",
  welcome_kakao: "카카오 시작",
  start_view: "첫 화면",
  trial_open: "써 보기",
  trial_ready: "맡기기",
  trial_join: "써 보고 가입",
  letter_sent: "편지 보냄",
  kakao_share: "카톡 보냄",
  link_open: "받은 링크 열기",
  reply_open: "답장 써 보기",
  reply_ready: "답장 맡기기",
  reply_join: "답장 가입",
  push_ask: "알림 물음",
  push_on: "알림 켬",
};

export const isFunnelStep = (s: unknown): s is FunnelStep => typeof s === "string" && (FUNNEL_STEPS as readonly string[]).includes(s);

/** 한국 날짜 "2026-11-24" */
export function kstDate(ms: number) {
  return new Date(ms + 9 * 3_600_000).toISOString().slice(0, 10);
}

/** 매일 숫자 알림에 붙일 한 줄: "첫 화면 40 → 써 보기 12 → 맡기기 6 → 써 보고 가입 2 · 편지 보냄 5 → 카톡 보냄 3 · 받은 링크 열기 4" */
export function funnelLine(c: Partial<Record<FunnelStep, number>>) {
  const n = (k: FunnelStep) => `${FUNNEL_LABEL[k]} ${c[k] ?? 0}`;
  return `${n("welcome_view")} → ${n("welcome_try")}·${n("welcome_kakao")}·${n("welcome_store")} | ${["start_view", "trial_open", "trial_ready", "trial_join"].map((k) => n(k as FunnelStep)).join(" → ")} · ${n("letter_sent")} → ${n("kakao_share")} · ${n("link_open")} → ${n("reply_open")} → ${n("reply_ready")} → ${n("reply_join")} · ${n("push_ask")} → ${n("push_on")}`;
}
