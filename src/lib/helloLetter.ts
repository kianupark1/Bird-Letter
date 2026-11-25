"use client";
import { auth, firebaseEnabled } from "./firebase/client";
import { isNewAccount } from "./welcome";
import { readProfile } from "./settings";

/**
 * 가입한 지 3일 안 된 계정이 처음 홈을 열면 "만든 사람의 편지"(core/hello.ts, 약 1시간 비행)를 서버에 부탁해요. 계정마다 한 번.
 * again=true: 알림을 막 켰을 때 다시 불러서 아직 안 도착한 편지의 도착 알림을 예약해요.
 */
const key = (uid: string) => `saepyeonji.hello.${uid}`;
export async function requestHello(again = false) {
  if (!firebaseEnabled) return;
  try {
    await auth().authStateReady();
    const u = auth().currentUser;
    if (!u || !isNewAccount(u)) return;
    if (!again && localStorage.getItem(key(u.uid))) return;
    const r = await fetch("/api/welcome/letter", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: await u.getIdToken(), name: readProfile().nickname || "" }),
    });
    if (r.ok) localStorage.setItem(key(u.uid), "1");
  } catch {}
}
