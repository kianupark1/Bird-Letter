/**
 * 가입 없이 먼저 써 본 편지(2026-11-24 대표님: "바로 안 나가게, 머무르게 하는 게 가장 중요").
 * 첫 화면에서 쓴 편지를 이 폰에만 잠깐 담아 두었다가, 가입하고 편지 쓰기 화면(/send?draft=1)에 그대로 채워 줘요.
 */
/** replyId: 받은 편지(링크)에서 가입 없이 먼저 쓴 답장이면 그 편지 ID */
export type TrialDraft = { to: string; message: string; birdId: string; at: number; replyId?: string };
const KEY = "saepyeonji.trialDraft.v1";
const KEEP_MS = 7 * 24 * 3600 * 1000; // 일주일 지나면 버려요

export function saveTrialDraft(d: Omit<TrialDraft, "at">) {
  try { localStorage.setItem(KEY, JSON.stringify({ ...d, at: Date.now() })); } catch {}
}

export function readTrialDraft(): TrialDraft | null {
  try {
    const d = JSON.parse(localStorage.getItem(KEY) ?? "null") as TrialDraft | null;
    if (!d || typeof d.message !== "string" || Date.now() - (d.at ?? 0) > KEEP_MS) return null;
    return d;
  } catch { return null; }
}

export function clearTrialDraft() {
  try { localStorage.removeItem(KEY); } catch {}
}
