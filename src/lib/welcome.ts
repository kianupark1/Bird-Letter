"use client";
/**
 * 환영 편지를 이 폰에 기억해 두는 곳(계산·문구는 core/welcome.ts).
 * 새로 가입한 계정(만든 지 3일 안, 임시 계정 제외)이 처음 홈을 열면 그때부터 1분 비행을 시작해요.
 * 예전부터 쓰던 계정에는 보내지 않아요. 기록은 계정별로 한 번만.
 */
import { welcomeId, welcomeMeta, welcomeText, type WelcomeRecord } from "../../core/welcome";
import { readProfile } from "./settings";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, firebaseEnabled } from "./firebase/client";

/**
 * 계정에 "처음 안내" 기록을 남겨요(users/{uid}.onboard, 내 계정만 읽고 씀·규칙 변경 없음).
 * 아이폰은 홈 화면에 추가한 앱이 Safari와 저장 공간이 따로라서, 폰에만 적어 두면
 * 홈 화면 앱으로 처음 열 때 환영 편지·사용법 안내가 또 나와요(2026-10-28 홈 화면 추가 점검).
 */
type Onboard = { welcomeAt?: number; tourDone?: boolean };
export async function readOnboard(uid: string): Promise<Onboard> {
  if (!firebaseEnabled) return {};
  try { const s = await getDoc(doc(db(), "users", uid)); return (s.data()?.onboard as Onboard) ?? {}; } catch { return {}; }
}
export async function saveOnboard(uid: string, v: Onboard) {
  if (!firebaseEnabled) return;
  try { await setDoc(doc(db(), "users", uid), { onboard: v }, { merge: true }); } catch {}
}

const KEY = "saepyeonji.welcome.v1";
const NEW_ACCOUNT_MS = 3 * 86400000;

const readAll = (): Record<string, WelcomeRecord> => {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
};

/**
 * 이 계정의 환영 편지(없으면 null). eligible이면 처음 부를 때 만들어요.
 * serverStart: 다른 폰(또는 Safari)에서 이미 받은 환영 편지의 시작 시각 → 그 시각 그대로(다시 1분 기다리지 않음)
 */
export function welcomeFor(uid: string, opts: { eligible: boolean; serverStart?: number }) {
  const all = readAll();
  let r = all[uid];
  if (!r && (opts.eligible || opts.serverStart)) {
    const p = readProfile();
    r = { uid, start: opts.serverStart ?? Date.now(), name: p.nickname || "", home: p.homePlace || "seoul" };
    all[uid] = r;
    try { localStorage.setItem(KEY, JSON.stringify(all)); } catch {}
  }
  return r ? welcomeMeta(r) : null;
}
/** 이 폰에 이미 환영 편지 기록이 있는지 */
export const hasWelcome = (uid: string) => !!readAll()[uid];

/** 서버 계정이 환영 편지를 받을 대상인지(로그인 계정 + 만든 지 3일 안) */
export function isNewAccount(user: { isAnonymous: boolean; metadata?: { creationTime?: string } }) {
  if (user.isAnonymous) return false;
  const t = Date.parse(user.metadata?.creationTime ?? "");
  return Number.isFinite(t) && Date.now() - t < NEW_ACCOUNT_MS;
}

/** 편지 ID로 기록 찾기(내용·정보 보여 줄 때) */
function recordOf(id: string): WelcomeRecord | null {
  return Object.values(readAll()).find((r) => welcomeId(r.uid) === id) ?? null;
}
export const welcomeBody = (id: string) => { const r = recordOf(id); return r ? welcomeText(r.name) : welcomeText(""); };
export const welcomeMetaById = (id: string) => { const r = recordOf(id); return r ? welcomeMeta(r) : null; };
