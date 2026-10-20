"use client";
import { useEffect, useState } from "react";
import BirdIcon from "@/components/BirdIcon";
import { readPenpal } from "@/lib/firebase/penpal";
import { avatarBirdFor, avatarTone } from "../../core/threads";
import { cityLabel, tagLabel } from "../../core/penpal";

/**
 * 얼굴을 누르면 크게 보기(카카오톡 프로필처럼). 친구는 프로필 사진(없으면 새 얼굴)을 화면 가득,
 * 펜팔은 진짜 사진 대신 펜팔 프로필 카드(고른 새·펜팔 이름·도시·관심사·한 줄 소개)를 보여 줘요(펜팔은 사진을 주고받지 않는 약속).
 */
export default function ProfileZoom({ name, bird, photo, penpalUid, onClose }: {
  name: string; bird?: string | null; photo?: string; penpalUid?: string; onClose: () => void;
}) {
  const [pp, setPp] = useState<{ bird: string; region: string; tags: string[]; intro: string } | null>(null);
  useEffect(() => {
    if (!penpalUid) return;
    readPenpal(penpalUid).then((p) => p && setPp({ bird: p.bird, region: p.region, tags: p.tags, intro: p.intro ?? "" })).catch(() => {});
  }, [penpalUid]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  const big = "min(78vw, 360px)";
  const showPhoto = !penpalUid && !!photo;
  const birdId = avatarBirdFor(name, penpalUid ? pp?.bird || bird : bird);
  return (
    <div className="pzoom" role="dialog" aria-label={`${name} 프로필`} onClick={onClose}>
      <div className="pz-pic" style={{ width: big, height: big }}>
        {showPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={`${name} 프로필 사진`} />
        ) : (
          <span className={`face tone${avatarTone(name)}`} style={{ width: "100%", height: "100%" }}><BirdIcon id={birdId} size={280} /></span>
        )}
      </div>
      <div className="pz-name">{name}</div>
      {penpalUid && (
        <div className="pz-pen">
          <div>펜팔 🌏{pp?.region ? ` · 📍 ${cityLabel(pp.region)}` : ""}</div>
          {pp?.intro && <div className="pz-intro">&ldquo;{pp.intro}&rdquo;</div>}
          {!!pp?.tags.length && <div className="pz-tags">{pp.tags.map((t) => <span key={t}>{tagLabel(t)}</span>)}</div>}
          <small>펜팔은 진짜 사진 대신 고른 새 얼굴로 보여요</small>
        </div>
      )}
      <button type="button" className="pz-x" aria-label="닫기" onClick={onClose}>✕</button>
    </div>
  );
}
