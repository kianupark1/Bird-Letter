"use client";
import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, firebaseEnabled } from "./firebase/client";

/**
 * 첫 화면을 보여줄지 정하는 로그인 상태.
 *  checking: 확인 중 / login: 로그인(카카오·구글·애플)이 필요 / ready: 앱을 써도 되는 상태
 * 서버 없이 내 컴퓨터에서 개발할 때(firebaseEnabled=false)는 항상 ready 입니다.
 * 이미 만든 시험(e2e)과 옛 사용자를 위해, 아래 두 값이 있는 기기는 로그인 없이도 열려요(일반 사용자는 해당 없음).
 */
const BYPASS_KEYS = ["saepyeonji.onboarded.v1", "saepyeonji.guest.v1"];
export type SessionState = "checking" | "login" | "ready";

function bypassed() {
  try { return BYPASS_KEYS.some((k) => localStorage.getItem(k)); } catch { return false; }
}

export function useSession() {
  const [state, setState] = useState<SessionState>("checking");

  const check = useCallback(() => {
    if (!firebaseEnabled || bypassed()) { setState("ready"); return () => {}; }
    return onAuthStateChanged(auth(), (u) => setState(u && !u.isAnonymous ? "ready" : "login"));
  }, []);

  useEffect(() => check(), [check]);

  /** 로그인 직후 상태를 다시 확인(구글·애플은 팝업이 끝나도 상태 신호가 오지 않을 수 있어요) */
  const recheck = useCallback(() => {
    const u = auth().currentUser;
    setState(u && !u.isAnonymous ? "ready" : "login");
  }, []);

  return { state, recheck };
}
