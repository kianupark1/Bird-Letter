"use client";
import { getIdTokenResult, signInWithCustomToken } from "firebase/auth";
import { auth, ensureUser, firebaseEnabled } from "./client";

/**
 * 카카오로 "연결": 카카오 로그인 화면으로 보냈다가 /auth/kakao 로 돌아오면 서버가 확인해 준다.
 * 카카오 REST API 키(공개되는 값)를 NEXT_PUBLIC_KAKAO_REST_KEY 에 넣어야 켜진다(docs/로그인-설정.md).
 * 카카오 개발자 콘솔의 Redirect URI에 `<사이트주소>/auth/kakao` 를 등록해야 한다.
 */
const KEY = (process.env.NEXT_PUBLIC_KAKAO_REST_KEY ?? "").replace(/^﻿/, "").trim();
export const KAKAO_LOGIN_READY = Boolean(KEY) && firebaseEnabled;
const STATE_KEY = "saepyeonji.kakao.state.v1";

export function startKakaoLogin() {
  if (!KAKAO_LOGIN_READY) return;
  const state = crypto.randomUUID();
  try { sessionStorage.setItem(STATE_KEY, state); } catch {}
  const redirect = `${location.origin}/auth/kakao`;
  location.href = `https://kauth.kakao.com/oauth/authorize?${new URLSearchParams({ client_id: KEY, redirect_uri: redirect, response_type: "code", state })}`;
}

export type KakaoOutcome = { ok: true; switched: boolean } | { ok: false; message: string };

/** 카카오가 돌려보낸 주소(?code=&state=)를 처리한다 */
export async function finishKakaoLogin(search: string): Promise<KakaoOutcome> {
  const q = new URLSearchParams(search);
  if (q.get("error")) return { ok: false, message: "카카오 연결을 취소했어요." };
  const code = q.get("code"), state = q.get("state");
  let saved: string | null = null;
  try { saved = sessionStorage.getItem(STATE_KEY); sessionStorage.removeItem(STATE_KEY); } catch {}
  if (!code || !state || !saved || state !== saved) return { ok: false, message: "연결 정보가 맞지 않아요. 설정에서 다시 눌러 주세요." };
  try {
    const user = await ensureUser();
    const res = await fetch("/api/auth/kakao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, idToken: await user.getIdToken() }),
    });
    if (res.status === 409) return { ok: false, message: "이 계정에는 이미 다른 카카오가 연결돼 있어요." };
    if (res.status === 503) return { ok: false, message: "카카오 연결이 아직 준비 중이에요." };
    if (!res.ok) return { ok: false, message: "카카오 연결에 실패했어요. 잠시 뒤에 다시 해 주세요." };
    const { customToken, switched } = await res.json();
    await signInWithCustomToken(auth(), customToken);
    return { ok: true, switched: Boolean(switched) };
  } catch {
    return { ok: false, message: "인터넷 연결을 확인해 주세요." };
  }
}

/** 지금 계정에 카카오가 연결돼 있는지 */
export async function isKakaoLinked(): Promise<boolean> {
  const u = auth().currentUser;
  if (!u) return false;
  try { return (await getIdTokenResult(u)).claims.kakao === true; } catch { return false; }
}
