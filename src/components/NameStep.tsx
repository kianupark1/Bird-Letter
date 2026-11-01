"use client";
import { useEffect, useRef, useState } from "react";
import Face from "@/components/Face";
import { compressAvatar } from "@/lib/photo";
import { useProfile, type Profile } from "@/lib/settings";
import { auth, firebaseEnabled } from "@/lib/firebase/client";
import { BIRDS } from "../../core/birds";
import { getPlace, placesByRegion } from "../../core/places";
import { locate } from "../../core/districts";
import { markNameAsked, nameAskedHere } from "@/lib/profileSync";

/**
 * 처음 한 번 프로필(사진·이름)을 만들어요. 내 계정에 올려 둬서(src/lib/profileSync.ts) 계정마다 딱 한 번만 나와요.
 * 로그인에서 이름을 받았거나 계정에 프로필이 있으면 홈(src/app/page.tsx Inbox)이 이 화면 없이 바로 시작해요.
 */
export function needsName(nickname: string) {
  return nickname.trim() === "" || nickname.trim() === "새 친구";
}
export const needsProfile = (p: Pick<Profile, "nickname" | "avatarBird">) => needsName(p.nickname) || !p.avatarBird;

/** 로그인한 사람(익명 아님)이고 이름이 없고, 이 계정에 아직 한 번도 안 물어봤을 때만(초대 화면용) */
export function shouldAskName(p: Pick<Profile, "nickname" | "avatarBird">) {
  if (!needsName(p.nickname) || !firebaseEnabled) return false;
  try { const u = auth().currentUser; return !!u && !u.isAnonymous && !nameAskedHere(u.uid); } catch { return false; }
}

/**
 * 처음 한 번: 사진(선택) · 이름(카카오 이름을 미리 넣어 둠, 바꿀 수 있음) · 내 동네(선택).
 * 2026-11-01 대표님: "처음에만 뜨고, 카톡서 불러오면 이름 그대로, 바꿀 수 있게, 위치 설정도 여기"
 */
export default function NameStep({ onDone, prefill = "" }: { onDone: (name: string, bird: string) => void; prefill?: string }) {
  const { profile, ready, update } = useProfile();
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [msg, setMsg] = useState("");
  const [bird, setBird] = useState("");
  const [home, setHome] = useState<{ id: string; label?: string } | null>(null);
  const [homeMsg, setHomeMsg] = useState("");
  const inited = useRef(false);
  useEffect(() => {
    if (!ready || inited.current) return;
    inited.current = true;
    try { const u = auth().currentUser; if (u && !u.isAnonymous) markNameAsked(u.uid); } catch {}
    // 새는 지금 고르지 않아요(얼굴 대신 보일 새는 무작위, 설정에서 바꿈)
    setBird(profile.avatarBird || BIRDS[Math.floor(Math.random() * BIRDS.length)].id);
    setPhoto(profile.photo);
    if (profile.homeSet) setHome({ id: profile.homePlace, label: profile.homeLabel });
    if (!needsName(profile.nickname)) { setName(profile.nickname); return; }
    if (prefill) { setName(prefill); return; }
    try { const k = localStorage.getItem("saepyeonji.kakaoNick.v1"); if (k) { setName(k); return; } } catch {}
    if (firebaseEnabled) {
      try { const n = auth().currentUser?.displayName?.trim(); if (n) setName(n.slice(0, 12)); } catch {}
    }
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps
  const locateMe = () => {
    if (!navigator.geolocation) return setHomeMsg("이 기기에서는 위치를 알 수 없어요. 아래에서 골라 주세요.");
    setHomeMsg("위치를 찾는 중이에요…");
    navigator.geolocation.getCurrentPosition((pos) => {
      const here = locate(pos.coords.latitude, pos.coords.longitude); // 구까지만, 좌표는 저장하지 않아요
      setHome({ id: here.place.id, label: here.label }); setHomeMsg("");
    }, () => setHomeMsg("위치를 허용하지 않았어요. 아래에서 골라 주세요."), { timeout: 10000, maximumAge: 600000 });
  };
  const ok = name.trim().length > 0 && bird !== "";
  const save = () => {
    if (!ok) return;
    if (home) try { localStorage.setItem("saepyeonji.homeMove.v1", JSON.stringify({ id: home.id, at: Date.now() })); } catch {}
    update({
      nickname: name.trim().slice(0, 12), avatarBird: bird,
      ...(photo && photo !== profile.photo ? { photo, photoFromKakao: false, photoOff: false } : {}),
      ...(home ? { homePlace: home.id, homeLabel: home.label, homeSet: true } : {}),
    });
    onDone(name.trim().slice(0, 12), bird);
  };
  const later = () => {
    if (!profile.avatarBird && bird) update({ avatarBird: bird });
    onDone("", bird);
  };
  const homeName = home ? home.label ?? getPlace(home.id)?.name ?? "" : "";
  return (
    <main className="start">
      <div className="start-hero" style={{ justifyContent: "flex-start", paddingTop: 24 }}>
        <div className="bubble">짹짹! 반가워요</div>
        <h1 style={{ fontSize: 26, margin: "14px 0 0" }}>프로필을 만들어 주세요</h1>
        <p style={{ fontSize: 15, margin: "6px 0 0" }}>친구들에게 보이는 사진과 이름이에요</p>
        <label className="avatarpick" aria-label="프로필 사진 고르기" style={{ marginTop: 18 }}>
          <Face name={name || "새"} bird={bird} photo={photo} size={110} />
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
          onChange={(e) => setName(e.target.value)} />
        <div className="homepick" role="group" aria-label="내 동네">
          <div className="hp-t">📍 내 동네 <span className="small">{homeName ? `· ${homeName}` : "· 친구가 보낼 때 받는 곳이 돼요"}</span></div>
          <div className="hp-row">
            <button type="button" className="ghost hp-btn" onClick={locateMe}>내 위치로 찾기</button>
            <select className="field hp-sel" aria-label="내 동네 직접 고르기" value={home?.id ?? ""} onChange={(e) => { if (e.target.value) setHome({ id: e.target.value }); setHomeMsg(""); }}>
              <option value="">직접 고르기</option>
              {placesByRegion().map((g) => (
                <optgroup key={g.region} label={g.region}>
                  {g.places.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          {homeMsg && <p className="small" role="status" style={{ margin: "4px 0 0" }}>{homeMsg}</p>}
        </div>
        <p style={{ fontSize: 14, margin: "10px 0 0" }}>한 번만 정하면 돼요 · 나중에 설정에서 바꿀 수 있어요</p>
      </div>
      <div className="start-btns">
        <button type="button" className="chunky" disabled={!ok} onClick={save}>시작하기</button>
        <button type="button" className="ghost" onClick={later}>나중에 할게요</button>
      </div>
    </main>
  );
}
