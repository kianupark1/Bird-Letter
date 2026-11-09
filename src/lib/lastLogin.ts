"use client";
/**
 * 같은 사람이 계정 둘로 갈라지지 않게(2026-11-09 대표님: "번호 기반·카톡 기반으로 사람이 겹치면 안 돼").
 * 카카오 계정 하나 = 새편지 계정 하나(서버 kakaoAccounts)라서, 겹치는 건 같은 사람이 다른 방법(구글·애플)으로 또 가입할 때예요.
 *  ① 이 폰에서 마지막으로 들어온 방법을 기억해 첫 화면에 "지난번에 카카오로 들어왔어요"를 띄워요(다른 버튼으로 새로 가입하지 않게)
 *  ② 그래도 이 폰에서 다른 계정으로 들어오면 "전에 쓰던 ○○ 계정과 같은 사람인가요?"를 한 번 묻고, 네면 친구들 화면에서 한 사람으로 이어요
 * 로그아웃해도 지우지 않아요(이 폰의 기록일 뿐, 서버로 보내지 않아요). 이름·친구 번호만, 편지 내용은 없어요.
 */
import { getIdTokenResult, type User } from "firebase/auth";
import { readJson, writeJson } from "./fastStart";

export type LoginKind = "kakao" | "naver" | "google" | "apple" | "phone";
export type LastLogin = { uid: string; kind: LoginKind; name: string; friends: { uid: string; name: string }[]; at: number };
const KEY = "saepyeonji.lastlogin.v1";
const ASKED = "saepyeonji.sameme.v1";

export const KIND_LABEL: Record<LoginKind, string> = { kakao: "카카오", naver: "네이버", google: "구글", apple: "애플", phone: "휴대폰 번호" };

export async function loginKind(u: User): Promise<LoginKind | null> {
  try {
    const c = (await getIdTokenResult(u)).claims;
    if (c.kakao === true) return "kakao";
    if (c.naver === true) return "naver";
  } catch {}
  const p = u.providerData.map((x) => x.providerId);
  if (p.includes("apple.com")) return "apple";
  if (p.includes("google.com")) return "google";
  if (p.includes("phone")) return "phone";
  return null;
}

export const lastLogin = () => readJson<LastLogin>(KEY);
export function saveLastLogin(v: LastLogin) { writeJson(KEY, v); }

/** 지금 계정이 이 폰의 지난 계정과 다르고, 아직 안 물어봤으면 그 지난 계정 */
export function otherAccountHere(uid: string): LastLogin | null {
  const l = lastLogin();
  if (!l || l.uid === uid || !l.friends?.length) return null;
  const asked = readJson<Record<string, string>>(ASKED) ?? {};
  return asked[`${l.uid}>${uid}`] ? null : l;
}
export function markSameAsked(oldUid: string, uid: string, answer: "yes" | "no") {
  const asked = readJson<Record<string, string>>(ASKED) ?? {};
  asked[`${oldUid}>${uid}`] = answer;
  writeJson(ASKED, asked);
}
