"use client";
/**
 * 아이폰 앱에서 화면 왼쪽 끝을 오른쪽으로 밀어 뒤로(앞으로 가기는 2026-11-09 대표님 요청으로 끔).
 * 손맛 3차(2026-11-09 "잔향이 남아, 깔끔하게 쓰윽, 다른 앱보다 자연스럽게"):
 *  - 덮개 판을 없애고 **지금 화면 자체**가 손가락을 1:1로 따라 오른쪽으로 밀려나요(왼쪽 가장자리에 옅은 그림자, 드러난 바탕은 살짝 어둡게).
 *  - 놓으면 남은 거리를 손가락 속도 그대로 이어서 쓱 밀려나고, 뒤 화면은 왼쪽에서 조금(25%) 겹쳐 들어오며 자리를 잡아요(아이폰 방식).
 *  - 덜 밀면 같은 곡선으로 제자리, 탭 첫 화면은 고무줄처럼 조금만.
 *  - 아래 시트·크게 보기 지도·얼굴 크게 보기가 열려 있으면 그 창이 손가락을 따라가다 닫혀요.
 * 사파리 브라우저(원래 기능)는 꺼 둠. 안드로이드는 스토어 앱에서 켬(2026-11-12 대표님: "안드로이드는 슬라이드로 뒤로 안 돼",
 * 갤럭시 세 버튼 메뉴는 화면 밀기 몸짓이 없음 — 폰 몸짓 내비게이션을 쓰면 폰이 가장자리를 먼저 가져가서 겹치지 않음). 계산은 core/swipeNav.ts(시험 있음).
 */
import { EDGE, lockDirection, shouldGoBack, paneOffset } from "../../core/swipeNav";

const TAB_ROOTS = ["/", "/friends", "/pen", "/rank"];
const SKIP = "[data-noswipe], input, textarea, select, .ch-birds";
const CLOSERS = ".pz-x, .ch-dim, .mf-close, .whobtn";
/** 열린 창이면 움직일 판(창 자체) */
const PANELS = ".pzoom, .mapfull, .ch-sheet";
let started = false;

function isIOS() {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}
const isNativeAndroid = () => /Android/.test(navigator.userAgent) && !!(window as any).Capacitor?.isNativePlatform?.();
function isAppLike() {
  const w = window as any;
  return !!w.Capacitor?.isNativePlatform?.() || w.matchMedia?.("(display-mode: standalone)").matches || (navigator as any).standalone === true;
}
const atTabRoot = () => TAB_ROOTS.includes(location.pathname) && !location.search;

export function goBack() {
  // 열린 창(얼굴 크게 보기·아래 시트·크게 보기 지도·편지 쓰기 이름 칸)이 있으면 그것부터 닫아요(안드로이드 뒤로 가기와 같은 순서)
  const close = document.querySelector<HTMLElement>(CLOSERS);
  if (close) { close.click(); return; }
  if (atTabRoot()) return; // 탭 첫 화면에서는 아무 데도 안 감
  if (history.length > 1) history.back();
  else location.href = "/";
}

const EASE = "cubic-bezier(.22,.9,.3,1)";
type Moving = { els: HTMLElement[]; scale: number; panel: boolean };

export function initSwipeNav() {
  if (started || typeof window === "undefined" || !(isIOS() || isNativeAndroid()) || !isAppLike()) return;
  started = true;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // 드러난 바탕을 살짝 어둡게(아이폰처럼 뒤 화면이 그늘져 있다가 밝아지는 느낌). <html>에 붙여 글씨 배율과 무관
  const shade = document.createElement("div");
  shade.className = "swipe-shade";
  shade.setAttribute("aria-hidden", "true");
  document.documentElement.appendChild(shade);

  let s: { x0: number; y0: number; dir: "h" | "v" | null; can: boolean; dx: number; lastX: number; lastT: number; vx: number; mv: Moving | null } | null = null;
  let busy = false;
  const W = () => window.innerWidth;

  /** 움직일 것: 열린 창이 있으면 그 창, 아니면 화면 본문과 바닥에 붙은 줄들(body의 바로 아래 요소들) */
  const pick = (): Moving => {
    const panel = document.querySelector<HTMLElement>(PANELS);
    if (panel) return { els: [panel], scale: panel.getBoundingClientRect().width / (panel.offsetWidth || 1) || 1, panel: true };
    const els = Array.from(document.body.children).filter((e): e is HTMLElement =>
      e instanceof HTMLElement && e.id !== "boot" && !e.classList.contains("swipe-ghost") && e.tagName !== "SCRIPT" && getComputedStyle(e).display !== "none" && e.getBoundingClientRect().height > 0);
    const main = els.find((e) => e.tagName === "MAIN") ?? els[0];
    const scale = main ? main.getBoundingClientRect().width / (main.offsetWidth || 1) || 1 : 1;
    return { els, scale, panel: false };
  };
  const setX = (mv: Moving, x: number, ms = 0, curve = EASE) => {
    for (const el of mv.els) {
      el.style.transition = ms ? `transform ${ms}ms ${curve}` : "none";
      el.style.transform = x ? `translate3d(${x / mv.scale}px,0,0)` : "";
      el.style.willChange = x ? "transform" : "";
      if (!mv.panel) el.style.boxShadow = x ? "-10px 0 24px rgba(40,25,10,.16)" : "";
    }
    // 드러난 바탕(왼쪽 x px)만 살짝 어둡게, 밀수록 밝아짐
    shade.style.transition = ms ? `width ${ms}ms ${curve}, opacity ${ms}ms ${curve}` : "none";
    shade.style.width = `${Math.max(0, x)}px`;
    shade.style.opacity = mv.panel ? "0" : String(Math.max(0, 0.16 * (1 - x / W())));
    shade.style.visibility = x > 0 ? "visible" : "hidden";
  };
  const clear = (mv: Moving) => { for (const el of mv.els) { el.style.transition = ""; el.style.transform = ""; el.style.willChange = ""; el.style.boxShadow = ""; } shade.style.visibility = "hidden"; };

  document.addEventListener("touchstart", (e) => {
    if (busy || e.touches.length !== 1) { s = null; return; }
    const t = e.touches[0];
    if (t.clientX > EDGE || (e.target as Element | null)?.closest?.(SKIP)) { s = null; return; }
    s = { x0: t.clientX, y0: t.clientY, dir: null, can: !!document.querySelector(CLOSERS) || !atTabRoot(), dx: 0, lastX: t.clientX, lastT: performance.now(), vx: 0, mv: null };
  }, { passive: true, capture: true });

  document.addEventListener("touchmove", (e) => {
    if (!s) return;
    const t = e.touches[0];
    const dx = t.clientX - s.x0, dy = t.clientY - s.y0;
    if (!s.dir) {
      s.dir = lockDirection(dx, dy);
      if (s.dir === "v") { s = null; return; }
      if (s.dir !== "h") return;
      s.mv = pick();
    }
    const now = performance.now();
    const dt = Math.max(1, now - s.lastT);
    s.vx = 0.7 * ((t.clientX - s.lastX) / dt) + 0.3 * s.vx;
    s.lastX = t.clientX; s.lastT = now; s.dx = dx;
    if (s.mv) setX(s.mv, paneOffset(dx, s.can));
  }, { passive: true, capture: true });

  const finish = (cancel: boolean) => {
    if (!s) return;
    const st = s; s = null;
    if (st.dir !== "h" || !st.mv) return;
    const mv = st.mv;
    const go = !cancel && st.can && shouldGoBack(st.dx, st.vx, W());
    if (!go) { setX(mv, 0, reduce ? 0 : 260); setTimeout(() => clear(mv), reduce ? 0 : 280); return; }
    busy = true;
    // 남은 거리를 손가락 속도 그대로 이어서(빠르게 튕기면 더 빨리) — 140~280ms
    const rest = W() - st.dx;
    const ms = reduce ? 0 : Math.round(Math.min(280, Math.max(140, rest / Math.max(1.3, st.vx * 1.5))));
    if (mv.panel) {
      setX(mv, W(), ms, "cubic-bezier(.25,.8,.35,1)");
      setTimeout(() => { goBack(); clear(mv); busy = false; }, ms);
      return;
    }
    // ① 지금 화면을 그대로 본뜬 '사진'을 위에 얹고, 진짜 화면은 바로 뒤 화면으로 바꿔요(빈 틈 없이)
    const ghost = document.createElement("div");
    ghost.className = "swipe-ghost";
    ghost.setAttribute("aria-hidden", "true");
    for (const el of mv.els) {
      const r = el.getBoundingClientRect();
      const c = el.cloneNode(true) as HTMLElement;
      c.removeAttribute("id");
      Object.assign(c.style, { position: "absolute", left: `${(r.left - st.dx) / mv.scale}px`, top: `${r.top / mv.scale}px`, width: `${el.offsetWidth}px`, margin: "0", transform: "none", transition: "none", boxShadow: "none" });
      ghost.appendChild(c);
    }
    // 사진 바탕은 화면 바탕(한지·구름) 그대로 — 아래 새 화면이 비쳐 보이지 않게
    const bs = getComputedStyle(document.body);
    ghost.style.backgroundColor = bs.backgroundColor;
    ghost.style.backgroundImage = bs.backgroundImage;
    ghost.style.backgroundSize = bs.backgroundSize;
    ghost.style.backgroundPosition = bs.backgroundPosition;
    ghost.style.backgroundRepeat = bs.backgroundRepeat;
    ghost.style.transform = `translate3d(${st.dx / mv.scale}px,0,0)`;
    document.body.appendChild(ghost);
    const oldMain = mv.els.find((e) => e.tagName === "MAIN");
    clear(mv);
    if (oldMain) oldMain.style.visibility = "hidden";
    for (const el of mv.els) if (el !== oldMain) { el.style.transition = "none"; el.style.transform = `translate3d(${-W() * 0.25 / mv.scale}px,0,0)`; }
    // ② 사진은 오른쪽으로 쓱 밀려나고, 드러나는 뒤 화면은 그늘이 걷히며 왼쪽 25%에서 제자리로
    shade.style.transition = "none"; shade.style.width = `${W()}px`; shade.style.opacity = "0.16"; shade.style.visibility = "visible";
    requestAnimationFrame(() => {
      ghost.style.transition = `transform ${ms}ms cubic-bezier(.25,.8,.35,1)`;
      ghost.style.transform = `translate3d(${W() / mv.scale}px,0,0)`;
      shade.style.transition = `opacity ${ms + 80}ms ease-out`;
      shade.style.opacity = "0";
    });
    goBack();
    let n = 0, moved = false;
    const slideIn = () => {
      const curMain = document.querySelector<HTMLElement>("body > main");
      const ready = !!curMain && curMain !== oldMain;
      if (!ready && ++n < 48) { setTimeout(slideIn, 20); return; }
      if (moved) return;
      moved = true;
      const now = pick();
      for (const el of now.els) if (!mv.els.includes(el) || el === curMain) { el.style.transition = "none"; el.style.transform = `translate3d(${-W() * 0.25 / now.scale}px,0,0)`; }
      requestAnimationFrame(() => requestAnimationFrame(() => {
        for (const el of now.els) { el.style.transition = reduce ? "none" : `transform ${Math.max(200, ms)}ms cubic-bezier(.22,.9,.3,1)`; el.style.transform = ""; }
        setTimeout(() => { for (const el of [...now.els, ...mv.els]) { el.style.transition = ""; el.style.transform = ""; el.style.willChange = ""; el.style.boxShadow = ""; } if (oldMain) oldMain.style.visibility = ""; }, Math.max(220, ms + 30));
      }));
    };
    slideIn();
    setTimeout(() => { ghost.remove(); shade.style.visibility = "hidden"; busy = false; }, ms + 120);
  };
  document.addEventListener("touchend", () => finish(false), { passive: true, capture: true });
  document.addEventListener("touchcancel", () => finish(true), { passive: true, capture: true });
}
