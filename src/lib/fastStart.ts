"use client";
import { useEffect, useLayoutEffect } from "react";

/**
 * 앱이 카카오톡처럼 "팍" 뜨게 하는 장치(2026-10-18, 대표님: "창 뜰 때 느리지 않게").
 * 지난번에 본 화면 내용(편지 목록·친구 목록·로그인 여부)을 내 폰에 적어 두었다가, 열자마자 먼저 보여 주고
 * 서버에서 새 내용이 오면 조용히 바꿔요. 로그아웃하면 모두 지워요.
 */
export const SESSION_HINT_KEY = "saepyeonji.session.v1";
export const LETTERS_CACHE_KEY = "saepyeonji.cache.letters.v1";
export const FRIENDS_CACHE_KEY = "saepyeonji.cache.friends.v1";
export const ADMIN_CACHE_KEY = "saepyeonji.cache.admin.v1";

/** 서버에서 그린 첫 화면과 어긋나지 않게, 그리기 직전(화면에 보이기 전)에 저장해 둔 내용을 넣어요 */
export const useBeforePaint = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function readJson<T>(key: string): T | null {
  try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : null; } catch { return null; }
}
export function writeJson(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
}

const clearers = new Set<() => void>();
/** 메모리에 들고 있는 내용도 같이 지우도록 등록해요 */
export function onClearFastCache(f: () => void) { clearers.add(f); }
/** 로그아웃·다른 계정: 적어 둔 내용을 모두 지워요 */
export function clearFastCache() {
  for (const k of [SESSION_HINT_KEY, LETTERS_CACHE_KEY, FRIENDS_CACHE_KEY, ADMIN_CACHE_KEY]) try { localStorage.removeItem(k); } catch {}
  clearers.forEach((f) => f());
}
