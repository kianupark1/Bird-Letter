"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getBird } from "@/lib/birds";
import { getRoute } from "@/lib/routes";
import { ONBOARDED_KEY, SAMPLE_INBOX, letterProgress, useLetters, useNow } from "@/lib/letters";
import { formatMinutes } from "@/lib/geo";
import { IS_TOSS, letterHref } from "@/lib/target";
import BirdIcon from "@/components/BirdIcon";
import PushPrompt from "@/components/PushPrompt";
import InstallCard from "@/components/InstallCard";
import { DEFAULT_PROFILE, useProfile } from "@/lib/settings";

export default function Home() {
  const router = useRouter();
  const { letters, received, ready, backend } = useLetters();

  // 처음 방문한 사람은 온보딩으로 보낸다
  useEffect(() => {
    try {
      if (!localStorage.getItem(ONBOARDED_KEY)) router.replace("/onboarding");
    } catch {}
  }, [router]);

  const { profile } = useProfile();
  const greeting = `${profile.nickname !== DEFAULT_PROFILE.nickname ? `${profile.nickname}님, ` : ""}오늘은 어떤 소식을 날려 볼까요?`;
  const now = useNow();
  const flying = letters.filter((l) => !letterProgress(l, now).done);
  const arrived = letters.filter((l) => letterProgress(l, now).done);

  return (
    <main className="app">
      <header className="homehead">
        <div className="logo"><BirdIcon id="magpie" size={48} /></div>
        <div>
          <h1>새 편지</h1>
          <p className="sub">{greeting}</p>
        </div>
      </header>

      {/* 토스 빌드에는 자체 하단 메뉴가 없어서(토스 내비게이션 바 사용) 홈에서 바로 이동하는 버튼을 둔다 */}
      {IS_TOSS && (
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <Link href="/send" className="cta" style={{ flex: 2 }}>편지 쓰기</Link>
          <Link href="/settings" className="ghost" style={{ flex: 1 }}>설정</Link>
        </div>
      )}

      <h2>날아가는 중</h2>
      {ready && flying.length === 0 && (
        <div className="empty hero">
          <BirdIcon id="magpie" size={96} className="bob" />
          <div className="t">아직 날아가는 편지가 없어요</div>
          <div className="d">첫 편지를 써서 새에게 맡겨 보세요.<br />실제 거리만큼 날아가서 도착해요.</div>
          <Link href="/send" className="cta">첫 편지 쓰기</Link>
        </div>
      )}
      {flying.map((l) => {
        const bird = getBird(l.birdId);
        const route = getRoute(l.routeId);
        const pr = letterProgress(l, now);
        return (
          <Link key={l.id} href={letterHref(l.id)} className="card">
            <div className="row grow">
              <BirdIcon id={bird.id} size={52} className="bob" letter />
              <div className="grow">
                <div className="name ellipsis">{l.to}에게</div>
                <div className="note">{route.title} · {bird.name}</div>
                <div className="progress"><i style={{ width: `${pr.p * 100}%` }} /></div>
              </div>
            </div>
            <div className="time">{formatMinutes(Math.max(1, Math.ceil(pr.total - pr.elapsed)))} 남음</div>
          </Link>
        );
      })}

      {flying.length > 0 && <PushPrompt birdId={flying[0].birdId} />}
      {(letters.length > 0 || received.length > 0) && <InstallCard hideWhenPushPrompt={flying.length > 0} />}

      {arrived.length > 0 && (
        <>
          <h2>도착한 편지</h2>
          {arrived.map((l) => (
            <Link key={l.id} href={letterHref(l.id)} className="card">
              <div className="row grow">
                <BirdIcon id={l.birdId} size={48} />
                <div className="grow">
                  <div className="name ellipsis">{l.to}에게</div>
                  <div className="note ellipsis">{l.message}</div>
                </div>
              </div>
              <div className="time">도착 ✓</div>
            </Link>
          ))}
        </>
      )}

      <Link href="/bungbungi" className="card promo">
        <div className="row grow">
          <BirdIcon id="bungbungi" size={48} />
          <div className="grow">
            <div className="name">붕붕이를 만나보세요</div>
            <div className="note">프로펠러 달린 드론 새 마스코트</div>
          </div>
        </div>
        <span aria-hidden>›</span>
      </Link>

      {backend === "firebase" ? (
        <>
          <h2>받은 편지함</h2>
          {received.length === 0 && (
            <div className="empty">아직 받은 편지가 없어요.<br />친구가 보낸 링크를 열면 여기에 모여요.</div>
          )}
          {received.map((m) => {
            const done = letterProgress(m, now).done;
            return (
              <Link key={m.id} href={letterHref(m.id)} className="card">
                <div className="row grow">
                  <BirdIcon id={m.birdId} size={48} />
                  <div className="grow">
                    <div className="name ellipsis">{m.fromName || "누군가"}</div>
                    <div className="note">{getRoute(m.routeId).title} · {getBird(m.birdId).name}</div>
                  </div>
                </div>
                <div className={done ? "time" : "note"}>{done ? "도착 ✓" : "오는 중"}</div>
              </Link>
            );
          })}
        </>
      ) : IS_TOSS ? null : (
        <>
          <h2>받은 편지함 (예시)</h2>
          {SAMPLE_INBOX.map((m) => (
            <div key={m.id} className="card">
              <div className="row grow">
                <BirdIcon id={m.birdId} size={48} />
                <div className="grow">
                  <div className="name">{m.from}</div>
                  <div className="note ellipsis">{m.preview}</div>
                </div>
              </div>
              <div className="note">{m.when}</div>
            </div>
          ))}
        </>
      )}
    </main>
  );
}
