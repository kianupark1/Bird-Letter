"use client";
/**
 * 아이폰 앱에서 화면 왼쪽 끝을 오른쪽으로 밀어 뒤로(앞으로 가기는 2026-11-09 대표님 요청으로 끔).
 * 손맛(2026-11-09 "손맛 더 살려 줘"): 왼쪽에서 한지색 판이 손가락을 그대로 따라 들어오고, 가운데 ‹ 동그라미가
 * 넘어가는 지점에서 다홍으로 채워짐 → 놓으면 판이 화면을 덮었다가 뒤 화면을 열며 오른쪽으로 걷힘. 덜 밀면 제자리로 돌아감.
 * 화면(본문)을 직접 움직이면 아래 메뉴·입력줄처럼 바닥에 붙은 요소가 튀어서, 위에 얹는 판으로 만들었어요.
 * 사파리 브라우저(원래 기능)·안드로이드(폰 자체 몸짓)는 꺼 둠. 계산은 core/swipeNav.ts(시험 있음).
 */
import { EDGE, lockDirection, shouldGoBack, paneOffset } from "../../core/swipeNav";

const TAB_ROOTS = ["/", "/friends", "/pen", "/rank"];
const SKIP = "[data-noswipe], input, textarea, select, .ch-birds";
const CLOSERS = ".pz-x, .ch-dim, .mf-close, .whobtn";
let started = false;

function isIOS() {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}
function isAppLike() {
  const w = window as any;
  return !!w.Capacitor?.isNativePlatform?.() || w.matchMedia?.("(display-mode: standalone)").matches || (navigator as any).standalone === true;
}
/** 뒤로 갈 곳이 있는지(열린 창이 있거나 탭 첫 화면이 아님) */
function canGoBack() {
  return !!document.querySelector(CLOSERS) || !(TAB_ROOTS.includes(location.pathname) && !location.search);
}

export function goBack() {
  // 열린 창(얼굴 크게 보기·아래 시트·크게 보기 지도·편지 쓰기 이름 칸)이 있으면 그것부터 닫아요(안드로이드 뒤로 가기와 같은 순서)
  const close = document.querySelector<HTMLElement>(CLOSERS);
  if (close) { close.click(); return; }
  if (TAB_ROOTS.includes(location.pathname) && !location.search) return; // 탭 첫 화면에서는 아무 데도 안 감
  if (history.length > 1) history.back();
  else location.href = "/";
}

export function initSwipeNav() {
  if (started || typeof window === "undefined" || !isIOS() || !isAppLike()) return;
  started = true;
  // 판은 <html>에 바로 붙여요(본문의 글씨 크기 배율(zoom)과 상관없이 손가락과 1:1)
  const pane = document.createElement("div");
  pane.className = "swipe-pane";
  pane.setAttribute("aria-hidden", "true");
  pane.innerHTML = '<span class="swipe-arrow">‹</span>';
  document.documentElement.appendChild(pane);
  const arrow = pane.firstElementChild as HTMLElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let s: { x0: number; y0: number; dir: "h" | "v" | null; can: boolean; dx: number; lastX: number; lastT: number; vx: number } | null = null;
  let busy = false;
  const W = () => window.innerWidth;
  const place = (x: number, anim = 0) => {
    pane.style.transition = anim ? `transform ${anim}ms cubic-bezier(.2,.8,.2,1)` : "none";
    pane.style.transform = `translate3d(${x - W()}px,0,0)`;
  };
  const show = (on: boolean) => { pane.style.visibility = on ? "visible" : "hidden"; };
  const progressUI = (x: number) => {
    const p = Math.min(1, x / (W() * 0.3));
    arrow.style.opacity = String(0.35 + 0.65 * p);
    arrow.style.transform = `translate(-50%,-50%) scale(${0.7 + 0.3 * p})`;
    arrow.classList.toggle("on", p >= 1);
  };

  document.addEventListener("touchstart", (e) => {
    if (busy || e.touches.length !== 1) { s = null; return; }
    const t = e.touches[0];
    if (t.clientX > EDGE || (e.target as Element | null)?.closest?.(SKIP)) { s = null; return; }
    s = { x0: t.clientX, y0: t.clientY, dir: null, can: canGoBack(), dx: 0, lastX: t.clientX, lastT: performance.now(), vx: 0 };
  }, { passive: true, capture: true });

  document.addEventListener("touchmove", (e) => {
    if (!s) return;
    const t = e.touches[0];
    const dx = t.clientX - s.x0, dy = t.clientY - s.y0;
    if (!s.dir) {
      s.dir = lockDirection(dx, dy);
      if (s.dir === "v") { s = null; return; }
      if (s.dir === "h") show(true);
      else return;
    }
    const now = performance.now();
    const dt = Math.max(1, now - s.lastT);
    s.vx = 0.7 * ((t.clientX - s.lastX) / dt) + 0.3 * s.vx;
    s.lastX = t.clientX; s.lastT = now; s.dx = dx;
    const x = paneOffset(dx, s.can);
    place(x);
    progressUI(s.can ? x : 0);
  }, { passive: true, capture: true });

  const finish = (cancel: boolean) => {
    if (!s) return;
    const st = s; s = null;
    if (st.dir !== "h") return;
    const go = !cancel && st.can && shouldGoBack(st.dx, st.vx, W());
    if (!go) { place(0, reduce ? 0 : 220); setTimeout(() => show(false), 240); return; }
    busy = true;
    place(W(), reduce ? 0 : 170);
    setTimeout(() => {
      const before = location.href;
      goBack();
      // 뒤 화면이 그려질 틈을 조금 준 뒤 판을 오른쪽으로 걷어요
      const reveal = () => {
        place(W() * 2, reduce ? 0 : 260);
        setTimeout(() => { show(false); place(0); busy = false; }, reduce ? 0 : 280);
      };
      if (location.href !== before) setTimeout(reveal, 60);
      else {
        let n = 0;
        const wait = () => (location.href !== before || ++n > 6 ? setTimeout(reveal, 60) : setTimeout(wait, 50));
        wait();
      }
    }, reduce ? 0 : 175);
  };
  document.addEventListener("touchend", () => finish(false), { passive: true, capture: true });
  document.addEventListener("touchcancel", () => finish(true), { passive: true, capture: true });
}
