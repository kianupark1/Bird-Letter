"use client";
/**
 * "앱처럼 설치" 도우미의 판단 부분: 지금 어떤 환경에서 열렸는지, 어떻게 안내할지.
 * - 카톡·인스타 같은 앱 안 브라우저에서는 설치가 안 돼요 → 기본 브라우저로 열기를 안내해요.
 * - 안드로이드 크롬은 버튼 한 번으로 설치할 수 있어요(beforeinstallprompt).
 * - 아이폰은 Safari의 공유 버튼 → 홈 화면에 추가 (그림으로 안내).
 */
import { useEffect, useState } from "react";
import { IS_TOSS } from "./target";

export type InstallEnv = "checking" | "installed" | "inapp" | "ios" | "android-chrome" | "android-other" | "desktop";

const OPEN = "saepyeonji:install-open";
const CHANGED = "saepyeonji:install-changed";
const SNOOZE_KEY = "saepyeonji.installsnooze.v1";

type DeferredPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
let deferred: DeferredPrompt | null = null;
let listening = false;

function listen() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as DeferredPrompt;
    window.dispatchEvent(new Event(CHANGED));
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    window.dispatchEvent(new Event(CHANGED));
  });
}

export const canOneTapInstall = () => !!deferred;

export async function oneTapInstall(): Promise<boolean> {
  if (!deferred) return false;
  const d = deferred;
  deferred = null;
  try {
    await d.prompt();
    const r = await d.userChoice;
    window.dispatchEvent(new Event(CHANGED));
    return r.outcome === "accepted";
  } catch { return false; }
}

const ua = () => navigator.userAgent;
export const isKakao = () => /KAKAOTALK/i.test(ua());
const isInApp = () => /KAKAOTALK|Instagram|FBAN|FBAV|Line\/|NAVER\(inapp|DaumApps|everytimeApp|; wv\)/i.test(ua());
const isIos = () => /iphone|ipad|ipod/i.test(ua()) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isAndroid = () => /android/i.test(ua());
const isStandalone = () => (navigator as any).standalone === true || window.matchMedia("(display-mode: standalone)").matches;

export function detectEnv(): InstallEnv {
  if (IS_TOSS) return "installed";
  if (isStandalone()) return "installed";
  if (isInApp()) return "inapp";
  if (isIos()) return "ios";
  if (isAndroid()) return /Chrome\//.test(ua()) && !/SamsungBrowser|OPR|Edg/i.test(ua()) ? "android-chrome" : "android-other";
  return "desktop";
}

/** 지금 주소를 기본 브라우저로 여는 주소(가능한 환경에서만). 못 하면 null */
export function externalOpenUrl(): string | null {
  const href = location.href;
  if (isKakao()) return `kakaotalk://web/openExternal?url=${encodeURIComponent(href)}`;
  if (isAndroid()) {
    const u = new URL(href);
    return `intent://${u.host}${u.pathname}${u.search}#Intent;scheme=https;package=com.android.chrome;end`;
  }
  return null;
}

export const openInstallGuide = () => { try { window.dispatchEvent(new Event(OPEN)); } catch {} };
export const onInstallGuideOpen = (fn: () => void) => { window.addEventListener(OPEN, fn); return () => window.removeEventListener(OPEN, fn); };

export function snoozeInstallCard(days = 7) {
  try { localStorage.setItem(SNOOZE_KEY, String(Date.now() + days * 86400000)); } catch {}
  try { window.dispatchEvent(new Event(CHANGED)); } catch {}
}
const snoozed = () => { try { return Number(localStorage.getItem(SNOOZE_KEY) || 0) > Date.now(); } catch { return false; } };

/** 환경과 "한 번에 설치" 가능 여부, 안내 카드를 숨길지 */
export function useInstall() {
  const [env, setEnv] = useState<InstallEnv>("checking");
  const [oneTap, setOneTap] = useState(false);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    listen();
    const sync = () => { setEnv(detectEnv()); setOneTap(canOneTapInstall()); setHidden(snoozed()); };
    sync();
    window.addEventListener(CHANGED, sync);
    return () => window.removeEventListener(CHANGED, sync);
  }, []);
  return { env, oneTap, hidden, needsInstall: env === "inapp" || env === "ios" };
}
