"use client";
import { signInWithCustomToken } from "firebase/auth";
import { auth, ensureUser, firebaseEnabled } from "./client";
import { applyKakaoProfile } from "./kakao";

/**
 * 네이버로 가입·로그인(2026-10-28, 대표님: "어른들을 위해 네이버로 로그인도"). 카카오와 같은 흐름:
 * 네이버 로그인 화면 → /auth/naver 로 돌아오면 서버(/api/auth/naver)가 확인 → Firebase 로그인.
 * 네이버 개발자 센터에서 받은 Client ID를 NEXT_PUBLIC_NAVER_CLIENT_ID 에 넣어야 켜져요(docs/네이버-로그인.md).
 */
const ID = (process.env.NEXT_PUBLIC_NAVER_CLIENT_ID ?? "").replace(/^﻿/, "").trim();
export const NAVER_LOGIN_READY = Boolean(ID) && firebaseEnabled;
const STATE_KEY = "saepyeonji.naver.state.v1";
const NEXT_KEY = "saepyeonji.naver.next.v1";

export function naverNext(): string {
  let n = "/";
  try { n = sessionStorage.getItem(NEXT_KEY) || n; sessionStorage.removeItem(NEXT_KEY); } catch {}
  return n;
}

export function startNaverLogin(next?: string) {
  if (!NAVER_LOGIN_READY) return;
  try { if (next) sessionStorage.setItem(NEXT_KEY, next); } catch {}
  const state = crypto.randomUUID();
  try { sessionStorage.setItem(STATE_KEY, state); } catch {}
  location.href = `https://nid.naver.com/oauth2.0/authorize?${new URLSearchParams({ response_type: "code", client_id: ID, redirect_uri: `${location.origin}/auth/naver`, state })}`;
}

export type NaverOutcome = { ok: true; switched: boolean } | { ok: false; message: string };

export async function finishNaverLogin(search: string): Promise<NaverOutcome> {
  const q = new URLSearchParams(search);
  if (q.get("error")) return { ok: false, message: "네이버 로그인을 취소했어요." };
  const code = q.get("code"), state = q.get("state");
  let saved: string | null = null;
  try { saved = sessionStorage.getItem(STATE_KEY); sessionStorage.removeItem(STATE_KEY); } catch {}
  if (!code || !state || !saved || state !== saved) return { ok: false, message: "로그인 정보가 맞지 않아요. 처음 화면에서 다시 눌러 주세요." };
  try {
    const user = await ensureUser();
    const res = await fetch("/api/auth/naver", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, state, idToken: await user.getIdToken() }),
    });
    if (res.status === 409) return { ok: false, message: "이 계정에는 이미 다른 네이버가 연결돼 있어요." };
    if (res.status === 503) return { ok: false, message: "네이버 로그인이 아직 준비 중이에요." };
    if (!res.ok) return { ok: false, message: "네이버 로그인에 실패했어요. 잠시 뒤에 다시 해 주세요." };
    const { customToken, switched, nickname, photo } = await res.json();
    await signInWithCustomToken(auth(), customToken);
    await applyKakaoProfile(nickname, photo); // 이름·사진 맞추는 규칙은 카카오와 같아요
    return { ok: true, switched: Boolean(switched) };
  } catch {
    return { ok: false, message: "인터넷 연결을 확인해 주세요." };
  }
}
