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
let lastSig = "";
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
    // 이름·사진·내 새가 바뀌면 친구들 화면에도 바로(예전엔 홈을 다시 열어야 바뀌었어요, 2026-11-09 대표님)
    const sig = `${p.nickname}|${p.avatarBird}|${p.photo?.length ?? 0}:${p.photo?.slice(-16) ?? ""}`;
    if (sig !== lastSig) {
      lastSig = sig;
      void import("./firebase/friends").then(async (f) => {
        const list = await f.listFriends();
        if (list.length) await f.syncMyName(list, p.nickname, p.avatarBird, p.photo);
      }).catch(() => {});
    }
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

/**
 * 이름 화면을 띄울지 정하려고 내 계정에서 알 수 있는 것을 한 번에 모아요.
 * - profile: 다른 폰·앱에서 정해 둔 프로필
 * - serverName: 예전에 쓰던 이름(랭킹·친구 랭킹 기록에 남은 이름) — 계정 프로필이 생기기 전부터 쓰던 사람
 * - asked: 이 계정에 이름 화면을 이미 한 번 보여 줬는지(폰을 바꾸거나 스토어 앱으로 옮겨도 다시 안 띄움)
 * 2026-11-01 대표님: "편지든 친구든 뒤로 가든 이게 계속 떠, 처음에만 떠야 해"
 */
export async function loadAccountName(uid: string): Promise<{ profile: Partial<Profile> | null; serverName: string; serverBird: string; asked: boolean }> {
  const out = { profile: null as Partial<Profile> | null, serverName: "", serverBird: "", asked: false };
  if (!firebaseEnabled) return out;
  const read = (col: string) => getDoc(doc(db(), col, uid)).then((s) => s.data() ?? null).catch(() => null);
  const [me, rank, stats] = await Promise.all([read("users"), read("ranking"), read("stats")]);
  const p = me?.profile as Partial<Profile> | undefined;
  if (p && typeof p.nickname === "string" && p.nickname.trim()) out.profile = p;
  out.asked = me?.onboard?.nameAsked === true;
  for (const d of [rank, stats]) {
    const n = typeof d?.name === "string" ? d.name.trim() : "";
    if (n && n !== "새 친구" && !out.serverName) { out.serverName = n.slice(0, 12); out.serverBird = typeof d?.bird === "string" ? d.bird : ""; }
  }
  return out;
}

/** 이 계정에 이름 화면을 보여 줬다고 남겨요(users/{uid}.onboard.nameAsked, 내 계정만·규칙 변경 없음) */
export function markNameAsked(uid: string) {
  try { localStorage.setItem(`saepyeonji.nameasked.v1.${uid}`, "1"); } catch {}
  if (!firebaseEnabled) return;
  void setDoc(doc(db(), "users", uid), { onboard: { nameAsked: true } }, { merge: true }).catch(() => {});
}
export const nameAskedHere = (uid: string) => { try { return !!localStorage.getItem(`saepyeonji.nameasked.v1.${uid}`); } catch { return false; } };
