"use client";
/**
 * 앱을 닫아도 오는 알림(웹 푸시)의 브라우저 쪽.
 * 켜기 → 서비스 워커 등록 + 알림 허용 + 구독 → 편지가 날아가는 동안 도착·경유지 시각마다 알림을 서버에 예약해요.
 * 서버 쪽은 src/app/api/push/*, 설정 방법은 docs/푸시-설정.md 에 있어요.
 */
import { useCallback, useEffect, useState } from "react";
import { IS_TOSS } from "./target";
import type { PushPayload, PushSub } from "../../core/pushPayload";

// 값 앞뒤의 보이지 않는 글자(BOM)·공백은 걸러 써요
const PUBLIC_KEY = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "").replace(/^﻿/, "").trim();
/** 서버에 푸시 키가 설정돼 있는지(없으면 "준비 중"으로 보여요) */
export const PUSH_CONFIGURED = !IS_TOSS && PUBLIC_KEY.length > 0;

export type PushState = "unsupported" | "needs-install" | "default" | "denied" | "enabled";

const SUB_KEY = "saepyeonji.push.v1";
const SCHED_KEY = "saepyeonji.pushsched.v1";
const EVENT = "saepyeonji:push";

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const isStandalone = () => (navigator as any).standalone === true || window.matchMedia("(display-mode: standalone)").matches;

export function getStoredSub(): PushSub | null {
  try {
    const s = JSON.parse(localStorage.getItem(SUB_KEY) || "null");
    return s && typeof s.endpoint === "string" && s.keys?.p256dh && s.keys?.auth ? s : null;
  } catch { return null; }
}
export const hasPushSub = () => (typeof localStorage === "undefined" ? false : !!getStoredSub());

function urlBase64ToUint8Array(b64: string) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export async function detectState(): Promise<PushState> {
  if (!PUSH_CONFIGURED) return "unsupported";
  const capable = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  if (!capable) return isIos() && !isStandalone() ? "needs-install" : "unsupported";
  if (Notification.permission === "denied") return "denied";
  if (Notification.permission === "granted" && getStoredSub()) return "enabled";
  return "default";
}

const notify = () => { try { window.dispatchEvent(new Event(EVENT)); } catch {} };

export async function enablePush(): Promise<PushState> {
  try {
    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return perm === "denied" ? "denied" : "default";
    const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY) }));
    const j = sub.toJSON();
    if (!j.endpoint || !j.keys?.p256dh || !j.keys?.auth) return "default";
    localStorage.setItem(SUB_KEY, JSON.stringify({ endpoint: j.endpoint, keys: { p256dh: j.keys.p256dh, auth: j.keys.auth } }));
    localStorage.removeItem(SCHED_KEY); // 새 구독이면 예약을 처음부터 다시
    notify();
    return "enabled";
  } catch {
    return "default";
  }
}

export async function disablePush() {
  try {
    const reg = await navigator.serviceWorker.getRegistration("/sw.js");
    await (await reg?.pushManager.getSubscription())?.unsubscribe();
  } catch {}
  try { localStorage.removeItem(SUB_KEY); localStorage.removeItem(SCHED_KEY); } catch {}
  notify();
}

const loadSched = (): Record<string, 1> => { try { return JSON.parse(localStorage.getItem(SCHED_KEY) || "{}"); } catch { return {}; } };
let serverOff = false; // 서버에 푸시 설정이 없으면(503) 더 시도하지 않아요

/** 알림 하나를 서버에 예약해요. 이미 예약했으면 건너뛰고, 성공하면 기억해 둬요. */
export async function schedulePush(key: string, payload: PushPayload, atMs: number): Promise<boolean> {
  const sub = getStoredSub();
  if (!sub || serverOff) return false;
  const done = loadSched();
  if (done[key]) return true;
  try {
    const res = await fetch("/api/push/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription: sub, payload, at: atMs }),
    });
    if (res.status === 503) { serverOff = true; return false; }
    if (res.ok) {
      const next = loadSched(); next[key] = 1;
      try { localStorage.setItem(SCHED_KEY, JSON.stringify(next)); } catch {}
      return true;
    }
    if (res.status === 400) { // 형식이 맞지 않는 건 다시 보내도 같아서 건너뛰어요
      const next = loadSched(); next[key] = 1;
      try { localStorage.setItem(SCHED_KEY, JSON.stringify(next)); } catch {}
    }
  } catch {}
  return false;
}

/** 화면에서 푸시 상태를 보고 켜고 끄는 훅 */
/** 설정의 "알림 시험하기": 12초 뒤에 시험 알림을 보내요(앱을 닫거나 홈으로 나가 있어야 보여요) */
export async function sendTestPush(): Promise<boolean> {
  const sub = getStoredSub();
  if (!sub) return false;
  try {
    const res = await fetch("/api/push/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription: sub,
        payload: { title: "새편지 알림이 잘 켜졌어요", body: "이 알림이 보이면 앱을 닫아도 편지 소식이 와요.", url: "/", tag: `test-${Date.now()}` },
        at: Date.now() + 12_000,
      }),
    });
    return res.ok;
  } catch { return false; }
}

export function usePushState() {
  const [state, setState] = useState<PushState | "checking">("checking");
  const refresh = useCallback(async () => setState(await detectState()), []);
  useEffect(() => {
    refresh();
    window.addEventListener(EVENT, refresh);
    return () => window.removeEventListener(EVENT, refresh);
  }, [refresh]);
  const enable = useCallback(async () => { setState(await enablePush()); }, []);
  const disable = useCallback(async () => { await disablePush(); await refresh(); }, [refresh]);
  return { state, enable, disable };
}
