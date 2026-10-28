"use client";
/**
 * 환영 편지를 이 폰에 기억해 두는 곳(계산·문구는 core/welcome.ts).
 * 새로 가입한 계정(만든 지 3일 안, 임시 계정 제외)이 처음 홈을 열면 그때부터 1분 비행을 시작해요.
 * 예전부터 쓰던 계정에는 보내지 않아요. 기록은 계정별로 한 번만.
 */
import { welcomeId, welcomeMeta, welcomeText, type WelcomeRecord } from "../../core/welcome";
import { readProfile } from "./settings";

const KEY = "saepyeonji.welcome.v1";
const NEW_ACCOUNT_MS = 3 * 86400000;

const readAll = (): Record<string, WelcomeRecord> => {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
};

/** 이 계정의 환영 편지(없으면 null). eligible이면 처음 부를 때 만들어요 */
export function welcomeFor(uid: string, opts: { eligible: boolean }) {
  const all = readAll();
  let r = all[uid];
  if (!r && opts.eligible) {
    const p = readProfile();
    r = { uid, start: Date.now(), name: p.nickname || "", home: p.homePlace || "seoul" };
    all[uid] = r;
    try { localStorage.setItem(KEY, JSON.stringify(all)); } catch {}
  }
  return r ? welcomeMeta(r) : null;
}

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
