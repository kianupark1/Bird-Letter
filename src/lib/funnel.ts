"use client";
import { kstDate, type FunnelStep } from "../../core/funnel";

/** 단계 세기(core/funnel.ts). 폰마다 하루 한 번만 보내요. 실패해도 화면에는 아무 영향 없어요 */
export function track(step: FunnelStep) {
  try {
    const key = `saepyeonji.funnel.${step}`;
    const today = kstDate(Date.now());
    if (localStorage.getItem(key) === today) return;
    localStorage.setItem(key, today);
    const body = JSON.stringify({ step });
    if (navigator.sendBeacon?.("/api/funnel", new Blob([body], { type: "application/json" }))) return;
    void fetch("/api/funnel", { method: "POST", body, keepalive: true }).catch(() => {});
  } catch {}
}
