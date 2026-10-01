"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getBird } from "@/lib/birds";
import { getRoute } from "@/lib/routes";
import { ONBOARDED_KEY, SAMPLE_INBOX, letterProgress, useLetters, useNow } from "@/lib/letters";
import { formatMinutes } from "@/lib/geo";

export default function Home() {
  const router = useRouter();
  const { letters, received, ready, backend } = useLetters();

  // 처음 방문한 사람은 온보딩으로 보낸다
  useEffect(() => {
    try {
      if (!localStorage.getItem(ONBOARDED_KEY)) router.replace("/onboarding");
    } catch {}
  }, [router]);

  const now = useNow();
  const flying = letters.filter((l) => !letterProgress(l, now).done);
  const arrived = letters.filter((l) => letterProgress(l, now).done);

  return (
    <main className="app">
      <h1>새 편지</h1>
      <p className="sub">새를 골라 편지를 보내요. 실제 거리만큼 날아가요.</p>

      <h2>날아가는 중</h2>
      {ready && flying.length === 0 && (
        <div className="empty">아직 날아가는 편지가 없어요.<br />아래 ‘편지 쓰기’로 첫 편지를 보내 보세요.</div>
      )}
      {flying.map((l) => {
        const bird = getBird(l.birdId);
        const route = getRoute(l.routeId);
        const pr = letterProgress(l, now);
        return (
          <Link key={l.id} href={`/letter/${l.id}`} className="card">
            <div className="row grow">
              <span className="emoji bob">{bird.emoji}</span>
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

      {arrived.length > 0 && (
        <>
          <h2>도착한 편지</h2>
          {arrived.map((l) => (
            <Link key={l.id} href={`/letter/${l.id}`} className="card">
              <div className="row grow">
                <span className="emoji">{getBird(l.birdId).emoji}</span>
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
          <span className="emoji">🚁</span>
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
              <Link key={m.id} href={`/letter/${m.id}`} className="card">
                <div className="row grow">
                  <span className="emoji">{getBird(m.birdId).emoji}</span>
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
      ) : (
        <>
          <h2>받은 편지함 (예시)</h2>
          {SAMPLE_INBOX.map((m) => (
            <div key={m.id} className="card">
              <div className="row grow">
                <span className="emoji">{getBird(m.birdId).emoji}</span>
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
