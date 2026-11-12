"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { readChecked, useLetters, useNow } from "@/lib/letters";
import { cachedFriends, listFriends, type Friend } from "@/lib/firebase/friends";
import { firebaseEnabled } from "@/lib/firebase/client";
import { saveMyPenpal } from "@/lib/firebase/penpal";
import { myPenpalDoc } from "@/lib/penpalSync";
import { buildThreads, isPenpalThread, visibleThreads } from "../../../core/threads";
import { INTRO_MAX, cityLabel, cityOf, cleanIntro, penpalName } from "../../../core/penpal";
import { useProfile } from "@/lib/settings";
import { useSession } from "@/lib/session";
import { usePeople } from "@/lib/people";
import { useBeforePaint } from "@/lib/fastStart";
import { roomHref } from "@/lib/room";
import { rowInfo } from "@/lib/chatRow";
import LoginStart from "@/components/LoginStart";
import BirdIcon from "@/components/BirdIcon";
import Face from "@/components/Face";
import GearLink from "@/components/GearLink";

/**
 * 하단 메뉴 "펜팔" 탭(2026-10-19, 대표님: "펜팔이 중요한 기능인데 랭킹 안에 있어"):
 * 펜팔 친구 찾기(/penpal) · 랜덤 편지 받기 스위치 · 내 펜팔 대화 목록.
 */
export default function PenTab() {
  const { state, recheck } = useSession();
  if (state === "checking") return <main className="app" aria-busy="true" />;
  if (state === "login") return <LoginStart onDone={recheck} next="/pen" />;
  return <PenList />;
}

function PenList() {
  const { letters, received, ready, backend } = useLetters();
  const now = useNow();
  const { profile, update } = useProfile();
  const { book } = usePeople();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [opened, setOpened] = useState<Set<string>>(new Set());
  useBeforePaint(() => {
    setOpened(readChecked());
    if (firebaseEnabled) { const c = cachedFriends(); if (c.length) setFriends(c); }
  }, []);
  useEffect(() => { listFriends().then(setFriends).catch(() => {}); }, []);

  const pens = useMemo(
    () => visibleThreads(buildThreads(letters, received, friends, book).filter((t) => t.entries.length > 0 && isPenpalThread(t)), book.hidden),
    [letters, received, friends, book],
  );
  const penName = profile.penpalName?.trim() || penpalName(cityLabel(cityOf(profile.homePlace)), profile.avatarBird || "magpie");

  const editIntro = () => {
    const v = window.prompt(`펜팔 카드에 보일 한 줄 소개 (${INTRO_MAX}자까지 · 연락처는 자동으로 가려져요)`, profile.penpalIntro ?? "");
    if (v === null) return;
    const intro = cleanIntro(v);
    update({ penpalIntro: intro });
    void saveMyPenpal(myPenpalDoc(profile, { intro })).catch(() => {});
  };

  return (
    <main className="app pentab">
      <header className="tabhead">
        <div><h1 className="pagetitle">펜팔 🌏</h1><div className="greet">어딘가의 누군가와 천천히 주고받는 편지</div></div>
        <GearLink />
      </header>

      {/* 2026-11-12 대표님: "펜팔 창 너무 복잡해, 찾기·보내기 합치고, 받기·둘러보기에 나 보이기·카드 사진은 다 자동으로, 깔끔하게"
          → 버튼 하나(펜팔 친구 찾기 → 카드 고르거나 🎲 아무에게나), 스위치는 모두 없앰(myPenpalDoc이 자동으로 켬, 끄기는 설정에만) */}
      <Link href={firebaseEnabled ? "/pen/browse" : "/penpal"} prefetch className="ppcard">
        <BirdIcon id={profile.avatarBird || "pigeon"} size={48} letter />
        <div><b>펜팔 친구 찾기</b><span>카드를 보고 고르거나, 아무에게나 날려 보내요</span></div>
      </Link>
      {firebaseEnabled && (
        <button type="button" className="listrow" onClick={editIntro} style={{ width: "100%", textAlign: "left", font: "inherit", color: "inherit", border: 0, background: "none", cursor: "pointer" }}>
          <div className="grow">
            <div className="name">{penName} · 한 줄 소개 ✎</div>
            <div className="note">{profile.penpalIntro ? `"${profile.penpalIntro}"` : "펜팔 카드에 보여요. 예: 고양이 두 마리랑 사는 부산 사람이에요"}</div>
          </div>
        </button>
      )}

      <div className="pphead">내 펜팔</div>
      {ready && backend !== "checking" && pens.length === 0 && <p className="sub" style={{ margin: "4px 4px 12px" }}>아직 펜팔이 없어요. 위에서 첫 편지를 날려 보세요 🕊</p>}
      <ul className="klist">
        {pens.map((t) => {
          const info = rowInfo(t, now, opened);
          return (
            <li key={t.key}>
              <Link href={roomHref(t)} prefetch className="krow pen">
                <Face name={t.name} size={58} />
                <span className="kmid">
                  <span className="kline"><b className="kname">{t.name}</b><span className="ktime">{info.time}</span></span>
                  <span className="kline"><span className={`kprev ${info.hot ? "hot" : ""}`}>{info.preview}</span>{info.badge ? <span className="kbadge" aria-label={`안 읽은 편지 ${info.badge}통`}>{info.badge}</span> : null}</span>
                  {info.progress !== undefined && <span className="kbar"><i style={{ width: `${Math.round(info.progress * 100)}%` }} /></span>}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <p className="sub" style={{ fontSize: 14, margin: "16px 4px" }}>진짜 이름·동네는 보이지 않고 펜팔 이름·도시만 보여요(프로필 사진이 있으면 카드에 보여요 · 펜팔을 안 받으려면 설정에서 끄기) · 만 14세 이상 · 이상한 편지는 대화방에서 🚩 신고·차단</p>
    </main>
  );
}
