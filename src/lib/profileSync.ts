"use client";
/**
 * 내 프로필(이름·사진·내 새·내 동네·설정)을 내 계정(users/{uid}.profile)에도 올려 둬요(내 계정만 읽고 씀·규칙 변경 없음).
 * 아이폰 스토어 앱·홈 화면 앱은 Safari와 저장 공간이 따로라서, 폰에만 적어 두면 새 앱에서 처음 열 때
 * "이름을 알려 주세요"가 또 나왔어요(2026-11-01 대표님: "한번 설정하면 끝나야 해").
 */
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, firebaseEnabled } from "./firebase/client";
import type { Profile } from "./settings";

const signedIn = () => { try { const u = auth().currentUser; return u && !u.isAnonymous ? u : null; } catch { return null; } };

let timer: ReturnType<typeof setTimeout> | null = null;
/** 바뀐 프로필을 1.5초 모았다가 한 번에 올려요(글자 하나 칠 때마다 올리지 않게) */
export function saveProfileRemote(p: Profile) {
  if (!firebaseEnabled) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    const u = signedIn();
    if (!u || !p.nickname.trim()) return;
    // 글씨 크기는 폰마다 다르게 쓸 수 있어서 올리지 않아요
    const { fontScale: _f, ...rest } = p; // eslint-disable-line @typescript-eslint/no-unused-vars
    const clean = JSON.parse(JSON.stringify(rest)); // undefined 칸은 빼요(Firestore가 거절)
    void setDoc(doc(db(), "users", u.uid), { profile: clean }, { merge: true }).catch(() => {});
  }, 1500);
}

/** 내 계정에 올려 둔 프로필(없으면 null) */
export async function loadProfileRemote(): Promise<Partial<Profile> | null> {
  if (!firebaseEnabled) return null;
  const u = signedIn();
  if (!u) return null;
  try {
    const p = (await getDoc(doc(db(), "users", u.uid))).data()?.profile as Partial<Profile> | undefined;
    return p && typeof p.nickname === "string" && p.nickname.trim() ? p : null;
  } catch {
    return null;
  }
}
