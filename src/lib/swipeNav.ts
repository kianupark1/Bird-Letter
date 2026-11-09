"use client";
/**
 * 아이폰 앱에서 화면 왼쪽 끝을 오른쪽으로 밀어 뒤로(앞으로 가기는 2026-11-09 대표님 요청으로 끔).
 * 사파리 브라우저는 원래 이 동작이 있고, 안드로이드는 폰 자체 뒤로 가기 몸짓이 있어서 아이폰 앱·홈 화면 앱에서만 켜요.
 * 계산은 core/swipeNav.ts(시험 있음). 지도·입력칸·옆으로 미는 줄 위에서 시작하면 건드리지 않아요.
 */
import { swipeAction, swipeProgress, EDGE } from "../../core/swipeNav";

const TAB_ROOTS = ["/", "/friends", "/pen", "/rank"];
const SKIP = "[data-noswipe], input, textarea, select, .ch-birds";
let started = false;

function isIOS() {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}
function isAppLike() {
  const w = window as any;
  return !!w.Capacitor?.isNativePlatform?.() || w.matchMedia?.("(display-mode: standalone)").matches || (navigator as any).standalone === true;
}

export function goBack() {
  // 열린 창(얼굴 크게 보기·아래 시트·크게 보기 지도·편지 쓰기 이름 칸)이 있으면 그것부터 닫아요(안드로이드 뒤로 가기와 같은 순서)
  const close = document.querySelector<HTMLElement>(".pz-x, .ch-dim, .mf-close, .whobtn");
  if (close) { close.click(); return; }
  if (TAB_ROOTS.includes(location.pathname) && !location.search) return; // 탭 첫 화면에서는 아무 데도 안 감
  if (history.length > 1) history.back();
  else location.href = "/";
}

export function initSwipeNav() {
  if (started || typeof window === "undefined" || !isIOS() || !isAppLike()) return;
  started = true;
  const tip = document.createElement("div");
  tip.className = "swipe-tip";
  tip.setAttribute("aria-hidden", "true");
  document.body.appendChild(tip);
  let s: { x0: number; y0: number; t: number; x1: number; y1: number } | null = null;
  const hide = () => { tip.style.opacity = "0"; };

  document.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) { s = null; return; }
    const t = e.touches[0];
    if (t.clientX > EDGE) { s = null; return; }
    if ((e.target as Element | null)?.closest?.(SKIP)) { s = null; return; }
    s = { x0: t.clientX, y0: t.clientY, t: Date.now(), x1: t.clientX, y1: t.clientY };
  }, { passive: true, capture: true });

  document.addEventListener("touchmove", (e) => {
    if (!s) return;
    const t = e.touches[0];
    s.x1 = t.clientX; s.y1 = t.clientY;
    const pr = swipeProgress(s.x0, s.x1, window.innerWidth);
    if (!pr || Math.abs(s.y1 - s.y0) > Math.abs(s.x1 - s.x0)) { hide(); return; }
    tip.textContent = "‹";
    tip.style.opacity = String(0.25 + pr.p * 0.75);
    tip.style.transform = `translateY(-50%) scale(${0.6 + pr.p * 0.4})`;
    tip.style.top = `${s.y0}px`;
  }, { passive: true, capture: true });

  const end = () => {
    if (!s) return;
    const act = swipeAction({ x0: s.x0, y0: s.y0, x1: s.x1, y1: s.y1, ms: Date.now() - s.t, width: window.innerWidth });
    s = null;
    hide();
    if (act === "back") goBack();
  };
  document.addEventListener("touchend", end, { passive: true, capture: true });
  document.addEventListener("touchcancel", () => { s = null; hide(); }, { passive: true, capture: true });
}
