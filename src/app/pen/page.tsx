"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { readOpened, useLetters, useNow } from "@/lib/letters";
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
    setOpened(readOpened());
    if (firebaseEnabled) { const c = cachedFriends(); if (c.length) setFriends(c); }
  }, []);
  useEffect(() => { listFriends().then(setFriends).catch(() => {}); }, []);

  const pens = useMemo(
    () => visibleThreads(buildThreads(letters, received, friends, book).filter((t) => t.entries.length > 0 && isPenpalThread(t)), book.hidden),
    [letters, received, friends, book],
  );
  const penName = profile.penpalName?.trim() || penpalName(cityLabel(cityOf(profile.homePlace)), profile.avatarBird || "magpie");
  // 바꾼 값으로 내 펜팔 줄을 바로 올려요(목록 보이기·사진은 본인이 켰을 때만)
  const change = (patch: Partial<typeof profile>) => {
    update(patch);
    void saveMyPenpal(myPenpalDoc({ ...profile, ...patch })).catch(() => {});
  };
  const toggleRecv = () => change({ penpalRecv: profile.penpalRecv !== true });

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

      <Link href="/penpal" prefetch className="ppcard">
        <BirdIcon id="crane" size={56} />
        <div><b>펜팔 친구 찾기</b><span>어느 누군가에게 새 편지를 날려 보내요</span></div>
      </Link>
      {firebaseEnabled && (
        <Link href="/pen/browse" prefetch className="listrow" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="grow">
            <div className="name">👀 펜팔 친구 둘러보기</div>
            <div className="note">한 줄 소개를 보고 편지 보낼 사람을 직접 골라요(목록에 보이기를 허락한 사람만)</div>
          </div>
          <span aria-hidden>›</span>
        </Link>
      )}

      {firebaseEnabled && profile.penpalAgreed && (
          <div className="listrow">
            <div className="grow">
              <div className="name">나도 랜덤 편지 받기</div>
              <div className="note">켜면 모르는 누군가의 펜팔 편지가 나에게도 날아와요 · 내 펜팔 이름: {penName}</div>
            </div>
            <button role="switch" aria-checked={profile.penpalRecv === true} aria-label="랜덤 편지 받기" className="switch" onClick={toggleRecv} />
          </div>
      )}
      {firebaseEnabled && profile.penpalAgreed && profile.penpalRecv === true && (
          <div className="listrow">
            <div className="grow">
              <div className="name">펜팔 친구 둘러보기에 나 보이기</div>
              <div className="note">켜면 다른 사람이 내 펜팔 카드(펜팔 이름·도시·한 줄 소개)를 보고 나를 골라 편지를 보낼 수 있어요</div>
            </div>
            <button role="switch" aria-checked={profile.penpalListed === true} aria-label="둘러보기에 나 보이기" className="switch" onClick={() => change({ penpalListed: profile.penpalListed !== true })} />
          </div>
      )}
      {firebaseEnabled && profile.penpalAgreed && profile.penpalRecv === true && profile.penpalListed === true && (
          <div className="listrow">
            <div className="grow">
              <div className="name">카드에 내 프로필 사진도 보이기</div>
              <div className="note">{profile.photo ? "모르는 사람에게 내 사진이 보여요. 얼굴이 또렷한 사진은 신중하게 골라 주세요 · 끄면 바로 지워져요" : "내 정보(톱니바퀴)에서 프로필 사진을 먼저 넣어 주세요"}</div>
            </div>
            <button role="switch" aria-checked={profile.penpalPhoto === true} aria-label="카드에 사진 보이기" className="switch" disabled={!profile.photo} onClick={() => change({ penpalPhoto: profile.penpalPhoto !== true })} />
          </div>
      )}
      {firebaseEnabled && profile.penpalAgreed && (
        <button type="button" className="listrow" onClick={editIntro} style={{ width: "100%", textAlign: "left", font: "inherit", color: "inherit", border: 0, background: "none", cursor: "pointer" }}>
          <div className="grow">
            <div className="name">내 한 줄 소개 ✎</div>
            <div className="note">{profile.penpalIntro ? `"${profile.penpalIntro}"` : "펜팔이 내 얼굴을 누르면 보여요. 예: 고양이 두 마리랑 사는 부산 사람이에요"}</div>
          </div>
        </button>
      )}
      {firebaseEnabled && !profile.penpalAgreed && (
          <Link href="/penpal" className="listrow" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="grow">
              <div className="name">나도 랜덤 편지 받기</div>
              <div className="note">처음 한 번 펜팔 약속을 확인하면 켤 수 있어요 ›</div>
            </div>
          </Link>
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

      <p className="sub" style={{ fontSize: 14, margin: "16px 4px" }}>진짜 이름·동네는 보이지 않고 도시까지만 보여요(사진은 내가 허락했을 때만) · 만 14세 이상 · 이상한 편지는 대화방에서 🚩 신고·차단</p>
    </main>
  );
}
