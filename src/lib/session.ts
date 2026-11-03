"use client";
import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, firebaseEnabled } from "./firebase/client";
import { clearFastCache, SESSION_HINT_KEY, useBeforePaint } from "./fastStart";

/**
 * 첫 화면을 보여줄지 정하는 로그인 상태.
 *  checking: 확인 중 / login: 로그인(카카오·구글·애플)이 필요 / ready: 앱을 써도 되는 상태
 * 서버 없이 내 컴퓨터에서 개발할 때(firebaseEnabled=false)는 항상 ready 입니다.
 * 자동 시험(e2e)만 아래 값으로 로그인 없이 열어요. 예전엔 소개 화면을 본 기기(onboarded.v1)도 그냥 열려서
 * 그런 폰은 계속 임시 계정으로 남았고, 같은 사람이 둘로 갈라지는 원인이 됐어요(2026-10-26 고침: 그런 폰도 한 번 로그인).
 * 지난번에 로그인해 있던 폰은 확인을 기다리지 않고 바로 열고(빈 화면 없음), 확인 결과 로그인이 풀렸으면 그때 로그인 화면으로 바꿔요.
 */
const BYPASS_KEYS = ["saepyeonji.e2e.v1"];
export type SessionState = "checking" | "login" | "ready";

function bypassed() {
  try { return BYPASS_KEYS.some((k) => localStorage.getItem(k)); } catch { return false; }
}
function hinted() {
  try { return localStorage.getItem(SESSION_HINT_KEY) === "1"; } catch { return false; }
}
function remember(ok: boolean) {
  if (ok) { try { localStorage.setItem(SESSION_HINT_KEY, "1"); } catch {} }
  else if (hinted()) clearFastCache(); // 로그아웃했거나 로그인이 풀렸으면 적어 둔 화면 내용도 지워요
}

export function useSession() {
  const [state, setState] = useState<SessionState>("checking");

  // 화면에 보이기 전에: 지난번에 로그인해 있었으면 바로 "ready"
  // 처음 깐 폰(로그인한 적 없음)은 확인(1~3초)을 기다리지 않고 바로 로그인 화면(2026-11-03 대표님: "첫 실행 5~6초 → 1~2초로").
  // 혹시 로그인돼 있었다면 확인이 끝나는 대로 저절로 홈으로 바뀌어요.
  useBeforePaint(() => {
    if (!firebaseEnabled || bypassed() || hinted()) setState("ready");
    else setState("login");
  }, []);

  const check = useCallback(() => {
    if (!firebaseEnabled || bypassed()) { setState("ready"); return () => {}; }
    // 로그인 확인이 5초 넘게 안 끝나면(앱 속 웹 화면 등) 빈 화면 대신 로그인 화면을 먼저 보여 줘요. 확인이 끝나면 맞게 바뀌어요
    const late = setTimeout(() => setState((s) => (s === "checking" ? "login" : s)), 5000);
    let off = () => {};
    try {
      off = onAuthStateChanged(auth(), (u) => {
        clearTimeout(late);
        const ok = !!u && !u.isAnonymous;
        remember(ok);
        setState(ok ? "ready" : "login");
      });
    } catch { clearTimeout(late); setState("login"); }
    return () => { clearTimeout(late); off(); };
  }, []);

  useEffect(() => check(), [check]);

  /** 로그인 직후 상태를 다시 확인(구글·애플은 팝업이 끝나도 상태 신호가 오지 않을 수 있어요) */
  const recheck = useCallback(() => {
    const u = auth().currentUser;
    const ok = !!u && !u.isAnonymous;
    remember(ok);
    setState(ok ? "ready" : "login");
  }, []);

  return { state, recheck };
}
