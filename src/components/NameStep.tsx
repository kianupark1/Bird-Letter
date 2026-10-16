"use client";
import { useEffect, useState } from "react";
import BirdIcon from "@/components/BirdIcon";
import BirdPicker from "@/components/BirdPicker";
import { DEFAULT_PROFILE, useProfile, type Profile } from "@/lib/settings";
import { auth, firebaseEnabled } from "@/lib/firebase/client";

/** 이름 또는 "내 새"가 아직 없으면 처음 한 번 물어봐요(이름이 "새 친구" 그대로이거나 새를 안 골랐을 때) */
export function needsName(nickname: string) {
  return nickname.trim() === "" || nickname === DEFAULT_PROFILE.nickname;
}
export const needsProfile = (p: Pick<Profile, "nickname" | "avatarBird">) => needsName(p.nickname) || !p.avatarBird;

/** 로그인한 사람(익명 아님)이고 이름·내 새가 아직 없을 때만 물어봐요 */
export function shouldAskName(p: Pick<Profile, "nickname" | "avatarBird">) {
  if (!needsProfile(p) || !firebaseEnabled) return false;
  try { const u = auth().currentUser; return !!u && !u.isAnonymous; } catch { return false; }
}

export default function NameStep({ onDone }: { onDone: () => void }) {
  const { profile, ready, update } = useProfile();
  const [name, setName] = useState("");
  const [bird, setBird] = useState("");
  useEffect(() => {
    if (!ready) return;
    setBird(profile.avatarBird);
    if (!needsName(profile.nickname)) { setName(profile.nickname); return; }
    // 카카오·구글·애플이 알려 준 이름이 있으면 미리 채워 둬요
    try { const k = localStorage.getItem("saepyeonji.kakaoNick.v1"); if (k) { setName(k); return; } } catch {}
    if (firebaseEnabled) {
      try { const n = auth().currentUser?.displayName?.trim(); if (n) setName(n.slice(0, 12)); } catch {}
    }
  }, [ready, profile.nickname, profile.avatarBird]);
  const ok = name.trim().length > 0 && bird !== "";
  const save = () => { if (!ok) return; update({ nickname: name.trim().slice(0, 12), avatarBird: bird }); onDone(); };
  return (
    <main className="start">
      <div className="start-hero" style={{ justifyContent: "flex-start", paddingTop: 24 }}>
        <div className="bubble">짹짹! 나는 누구일까요?</div>
        <h1 style={{ fontSize: 26, margin: "14px 0 0" }}>이름을 알려 주고<br />내 새를 골라 주세요</h1>
        <input className="field namefield" value={name} maxLength={12} placeholder="이름 (예: 지민)" aria-label="내 이름"
          onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} />
        <BirdPicker value={bird} onChange={setBird} />
        <p style={{ fontSize: 15 }}>친구들에게 이 이름과 새가 보여요 · 나중에 바꿀 수 있어요</p>
      </div>
      <div className="start-btns">
        <button type="button" className="chunky" disabled={!ok} onClick={save}>
          {bird ? <BirdIcon id={bird} size={36} /> : null} 이 새로 시작하기
        </button>
      </div>
    </main>
  );
}
