"use client";
import { readJson, writeJson } from "./fastStart";

/**
 * 로그인하기 전에 편지 링크를 열어 받은 편지의 보낸 사람들을 기억해 뒀다가, 로그인하면 그 사람들과 친구로 이어요.
 * 그때 쓰던 임시 계정도 같이 알려서, 보낸 사람 화면에서 한 사람으로 모이게 해요(사람이 둘로 나뉘지 않게).
 */
const KEY = "saepyeonji.linksenders.v1";
type Pending = { anon: string[]; senders: { uid: string; name: string }[] };

export function rememberSender(anonUid: string, sender: { uid: string; name: string }) {
  const p = readJson<Pending>(KEY) ?? { anon: [], senders: [] };
  if (!p.anon.includes(anonUid)) p.anon.push(anonUid);
  if (!p.senders.some((s) => s.uid === sender.uid)) p.senders.push(sender);
  writeJson(KEY, { anon: p.anon.slice(-10), senders: p.senders.slice(-50) });
}

export function pendingSenders(): Pending | null {
  const p = readJson<Pending>(KEY);
  return p && p.senders?.length ? p : null;
}

export function clearSenders() {
  try { localStorage.removeItem(KEY); } catch {}
}
