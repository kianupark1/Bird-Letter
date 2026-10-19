"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { readOpened, useLetters, useNow } from "@/lib/letters";
import { cachedFriends, listFriends, type Friend } from "@/lib/firebase/friends";
import { firebaseEnabled } from "@/lib/firebase/client";
import { saveMyPenpal } from "@/lib/firebase/penpal";
import { buildThreads, isPenpalThread, visibleThreads } from "../../../core/threads";
import { cityLabel, cityOf, penpalName } from "../../../core/penpal";
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
  const { letters, received, ready } = useLetters();
  const now = useNow();
  const { profile, update } = useProfile();
  const { book } = usePeople();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [opened, setOpened] = useState<Set<string>>(new Set());
  useBeforePaint(() => {
    setOpened(readOpened());
    if (firebaseEnabled) { const c = cachedFriends(); if (c.length) setFriends(c); }
  }, []);
  useEffect(() => { listFriends().then(setFriends).catch(() => {}); }, []);

  const pens = useMemo(
    () => visibleThreads(buildThreads(letters, received, friends, book).filter((t) => t.entries.length > 0 && isPenpalThread(t)), book.hidden),
    [letters, received, friends, book],
  );
  const penName = profile.penpalName?.trim() || penpalName(cityLabel(cityOf(profile.homePlace)), profile.avatarBird || "magpie");
  const toggleRecv = () => {
    const open = profile.penpalRecv !== true;
    update({ penpalRecv: open });
    void saveMyPenpal({ name: penName, bird: profile.avatarBird || "magpie", region: cityOf(profile.homePlace), tags: profile.penpalTags ?? [], open }).catch(() => {});
  };

  return (
    <main className="app pentab">
      <header className="tabhead">
        <div><h1 className="pagetitle">펜팔 🌏</h1><div className="greet">어딘가의 누군가와 천천히 주고받는 편지</div></div>
        <GearLink />
      </header>

      <Link href="/penpal" prefetch className="ppcard">
        <BirdIcon id="crane" size={56} />
        <div><b>펜팔 친구 찾기</b><span>어느 누군가에게 새 편지를 날려 보내요</span></div>
      </Link>

      {firebaseEnabled && (
        profile.penpalAgreed ? (
          <div className="listrow">
            <div className="grow">
              <div className="name">나도 랜덤 편지 받기</div>
              <div className="note">켜면 모르는 누군가의 펜팔 편지가 나에게도 날아와요 · 내 펜팔 이름: {penName}</div>
            </div>
            <button role="switch" aria-checked={profile.penpalRecv === true} aria-label="랜덤 편지 받기" className="switch" onClick={toggleRecv} />
          </div>
        ) : (
          <Link href="/penpal" className="listrow" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="grow">
              <div className="name">나도 랜덤 편지 받기</div>
              <div className="note">처음 한 번 펜팔 약속을 확인하면 켤 수 있어요 ›</div>
            </div>
          </Link>
        )
      )}

      <div className="pphead">내 펜팔</div>
      {ready && pens.length === 0 && <p className="sub" style={{ margin: "4px 4px 12px" }}>아직 펜팔이 없어요. 위에서 첫 편지를 날려 보세요 🕊</p>}
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

      <p className="sub" style={{ fontSize: 14, margin: "16px 4px" }}>진짜 이름·사진·동네는 보이지 않고 도시까지만 보여요 · 만 14세 이상 · 이상한 편지는 대화방에서 🚩 신고·차단</p>
    </main>
  );
}
