"use client";
import { useEffect, useState } from "react";
import Face from "@/components/Face";
import { compressAvatar } from "@/lib/photo";
import { useProfile, type Profile } from "@/lib/settings";
import { auth, firebaseEnabled } from "@/lib/firebase/client";
import { BIRDS } from "../../core/birds";

/**
 * 처음 한 번 프로필(사진·이름)을 만들어요. 내 계정에 올려 둬서(src/lib/profileSync.ts) 계정마다 딱 한 번만 나와요.
 * 로그인에서 이름을 받았거나 계정에 프로필이 있으면 홈(src/app/page.tsx Inbox)이 이 화면 없이 바로 시작해요.
 */
export function needsName(nickname: string) {
  return nickname.trim() === "" || nickname.trim() === "새 친구";
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
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [msg, setMsg] = useState("");
  const [bird, setBird] = useState("");
  useEffect(() => {
    if (!ready) return;
    // 새는 지금 고르지 않아요(얼굴 대신 보일 새는 무작위, 설정에서 바꿈) — 2026-11-01 대표님: "여기서는 프로필 설정으로, 새는 나중에"
    setBird(profile.avatarBird || BIRDS[Math.floor(Math.random() * BIRDS.length)].id);
    setPhoto(profile.photo);
    if (!needsName(profile.nickname)) { setName(profile.nickname); return; }
    // 카카오·구글·애플이 알려 준 이름이 있으면 미리 채워 둬요
    try { const k = localStorage.getItem("saepyeonji.kakaoNick.v1"); if (k) { setName(k); return; } } catch {}
    if (firebaseEnabled) {
      try { const n = auth().currentUser?.displayName?.trim(); if (n) setName(n.slice(0, 12)); } catch {}
    }
  }, [ready, profile.nickname, profile.avatarBird, profile.photo]);
  const ok = name.trim().length > 0 && bird !== "";
  const save = () => {
    if (!ok) return;
    update({ nickname: name.trim().slice(0, 12), avatarBird: bird, ...(photo && photo !== profile.photo ? { photo, photoFromKakao: false, photoOff: false } : {}) });
    onDone();
  };
  return (
    <main className="start">
      <div className="start-hero" style={{ justifyContent: "flex-start", paddingTop: 24 }}>
        <div className="bubble">짹짹! 반가워요</div>
        <h1 style={{ fontSize: 26, margin: "14px 0 0" }}>프로필을 만들어 주세요</h1>
        <p style={{ fontSize: 15, margin: "6px 0 0" }}>친구들에게 보이는 사진과 이름이에요</p>
        <label className="avatarpick" aria-label="프로필 사진 고르기" style={{ marginTop: 18 }}>
          <Face name={name || "새"} bird={bird} photo={photo} size={120} />
          <span className="cam" aria-hidden>📷</span>
          <input type="file" accept="image/*" hidden onChange={async (e) => {
            const f = e.target.files?.[0]; e.target.value = "";
            if (!f) return;
            setMsg("사진을 줄이는 중…");
            try { setPhoto(await compressAvatar(f)); setMsg(""); } catch { setMsg("이 사진은 쓸 수 없어요. 다른 사진을 골라 주세요."); }
          }} />
        </label>
        <p className="small" role="status" style={{ margin: "6px 0 0" }}>{msg || (photo ? "사진을 누르면 바꿀 수 있어요" : "사진은 골라도 되고 안 골라도 돼요")}</p>
        <input className="field namefield" value={name} maxLength={12} placeholder="이름 (예: 지민)" aria-label="내 이름"
          onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && save()} />
        <p style={{ fontSize: 15 }}>한 번만 정하면 돼요 · 나중에 설정에서 바꿀 수 있어요</p>
      </div>
      <div className="start-btns">
        <button type="button" className="chunky" disabled={!ok} onClick={save}>시작하기</button>
      </div>
    </main>
  );
}
