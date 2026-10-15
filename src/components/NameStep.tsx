"use client";
import { useEffect, useState } from "react";
import BirdIcon from "@/components/BirdIcon";
import { DEFAULT_PROFILE, useProfile } from "@/lib/settings";
import { auth, firebaseEnabled } from "@/lib/firebase/client";

/** 처음 로그인한 사람에게 친구들에게 보일 이름을 한 번 물어봐요(이름이 "새 친구" 그대로면 이 화면) */
export function needsName(nickname: string) {
  return nickname.trim() === "" || nickname === DEFAULT_PROFILE.nickname;
}

/** 로그인한 사람(익명 아님)이고 이름이 아직 없을 때만 물어봐요 */
export function shouldAskName(nickname: string) {
  if (!needsName(nickname) || !firebaseEnabled) return false;
  try { const u = auth().currentUser; return !!u && !u.isAnonymous; } catch { return false; }
}

export default function NameStep({ onDone }: { onDone: () => void }) {
  const { update } = useProfile();
  const [name, setName] = useState("");
  useEffect(() => {
    // 구글·애플이 알려 준 이름이 있으면 미리 채워 둬요
    if (firebaseEnabled) {
      try { const n = auth().currentUser?.displayName?.trim(); if (n) setName(n.slice(0, 12)); } catch {}
    }
  }, []);
  const ok = name.trim().length > 0;
  const save = () => { if (!ok) return; update({ nickname: name.trim().slice(0, 12) }); onDone(); };
  return (
    <main className="start">
      <div className="start-hero">
        <BirdIcon id="magpie" size={150} className="bob" />
        <h1 style={{ fontSize: 28 }}>친구들에게 보일<br />이름을 알려 주세요</h1>
        <input className="field namefield" value={name} maxLength={12} placeholder="예: 지민" aria-label="내 이름" autoFocus
          onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} />
        <p style={{ fontSize: 15 }}>나중에 내 정보에서 바꿀 수 있어요</p>
      </div>
      <div className="start-btns">
        <button type="button" className="sbtn kakao" style={{ background: "var(--dahong)", color: "var(--on-dahong)" }} disabled={!ok} onClick={save}>이 이름으로 시작</button>
      </div>
    </main>
  );
}
