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
const NEXT_KEY = "saepyeonji.kakao.next.v1";
const REFRESH_KEY = "saepyeonji.kakao.refresh.v1";
const NICK_KEY = "saepyeonji.kakaoNick.v1";
const PROFILE_KEY = "saepyeonji.profile.v1";

/** 카카오 로그인이 끝난 뒤 돌아갈 화면(로그인 시작 화면에서 눌렀으면 홈, 설정에서 눌렀으면 설정) */
export function kakaoNext(): string {
  let n = "/settings?linked=kakao";
  try { n = sessionStorage.getItem(NEXT_KEY) || n; sessionStorage.removeItem(NEXT_KEY); } catch {}
  return n;
}

/** refresh: 카카오의 지금 이름·사진으로 다시 맞추기(설정의 "카카오에서 다시 가져오기") */
export function startKakaoLogin(next?: string, refresh = false) {
  if (!KAKAO_LOGIN_READY) return;
  try { if (refresh) sessionStorage.setItem(REFRESH_KEY, "1"); } catch {}
  try { if (next) sessionStorage.setItem(NEXT_KEY, next); } catch {}
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
    const { customToken, switched, nickname, photo } = await res.json();
    await signInWithCustomToken(auth(), customToken);
    await applyKakaoProfile(nickname, photo);
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

/**
 * 카카오톡처럼 "그 사람의 카카오 이름·사진"을 그대로 써요.
 * - 이름: 아직 없거나, 지난번 카카오 이름 그대로 쓰고 있었으면(직접 바꾸지 않았으면) 지금 카카오 이름으로
 * - 사진: 아직 없거나, 지난번에도 카카오 사진이었으면 지금 카카오 사진으로(직접 올린 사진은 그대로)
 * - "다시 가져오기"를 눌렀으면 둘 다 카카오 것으로
 * 친구들 화면의 내 이름·사진은 홈이 열릴 때 자동으로 고쳐져요(syncMyName).
 */
async function applyKakaoProfile(nickname: unknown, photo: unknown) {
  let refresh = false;
  try { refresh = sessionStorage.getItem(REFRESH_KEY) === "1"; sessionStorage.removeItem(REFRESH_KEY); } catch {}
  let p: Record<string, unknown> = {};
  try { p = JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}"); } catch {}
  const next = { ...p };
  if (typeof nickname === "string" && nickname.trim()) {
    const nick = nickname.trim().slice(0, 12);
    let prev = "";
    try { prev = localStorage.getItem(NICK_KEY) || ""; localStorage.setItem(NICK_KEY, nick); } catch {}
    const cur = typeof p.nickname === "string" ? p.nickname : "";
    if (refresh || !cur || cur === "새 친구" || cur === prev) next.nickname = nick;
  }
  if (typeof photo === "string" && photo.startsWith("data:image/") && (refresh || (!p.photo && !p.photoOff) || p.photoFromKakao)) {
    try {
      const { compressAvatar } = await import("../photo");
      next.photo = await compressAvatar(await (await fetch(photo)).blob());
      next.photoFromKakao = true; next.photoOff = false;
    } catch {}
  }
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(next)); } catch {}
}
