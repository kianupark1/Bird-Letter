"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import JourneyMap from "@/components/JourneyMap";
import { getBird } from "@/lib/birds";
import { getRoute } from "@/lib/routes";
import { formatMinutes } from "@/lib/geo";
import { letterProgress, useLetters, useNow } from "@/lib/letters";

const clock = (ms: number) => new Date(ms).toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" });

export default function LetterPage() {
  const { id } = useParams<{ id: string }>();
  const { letters, ready, fastForward } = useLetters();
  const now = useNow(5000);
  const [demo, setDemo] = useState(false);
  const letter = letters.find((l) => l.id === id);

  // 주소 끝에 ?demo=1을 붙였을 때만 "빨리 감기"를 보여준다(일반 사용자에게는 숨김)
  useEffect(() => {
    setDemo(new URLSearchParams(window.location.search).has("demo"));
  }, []);

  if (!ready) return <main className="app" />;
  if (!letter)
    return (
      <main className="app">
        <div className="empty">편지를 찾을 수 없어요.</div>
        <Link href="/" className="ghost">홈으로</Link>
      </main>
    );

  const bird = getBird(letter.birdId);
  const route = getRoute(letter.routeId);
  const pr = letterProgress(letter, now);
  const remainMin = Math.max(1, Math.ceil(pr.total - pr.elapsed));
  const last = route.points.length - 1;
  const nextIdx = route.points.findIndex((_, i) => pr.p < i / last);
  const arriveAt = letter.sentAt + pr.total * 60000;
  const dest = route.title.split("→")[1].trim();

  return (
    <main className="app">
      <h1>{letter.to}에게 가는 편지</h1>
      <p className="sub">{bird.emoji} {bird.name} · {route.title} · {route.km}km</p>

      <JourneyMap route={route} p={pr.p} emoji={bird.emoji} />

      {pr.done ? (
        <>
          <div className={`arrived ${bird.id === "magpie" ? "special" : ""}`}>
            {bird.id === "magpie" && (
              <div className="sparkles" aria-hidden>
                {["✨", "💛", "✨", "🌸", "✨", "💛", "🌸", "✨"].map((s, n) => (
                  <span key={n} style={{ left: `${8 + n * 12}%`, animationDelay: `${n * 0.25}s` }}>{s}</span>
                ))}
              </div>
            )}
            <div className="big">{bird.emoji}</div>
            <h2 style={{ margin: "8px 0 0", opacity: 1 }}>
              {bird.id === "magpie" ? "반가운 소식이 도착했어요!" : "편지가 도착했어요!"}
            </h2>
            <div className="small">
              {bird.id === "magpie"
                ? `까치가 ${dest}에서 반갑게 울었어요. 아침 까치가 울면 반가운 손님이 온다더니!`
                : `${bird.name}가 ${dest}에 내려앉았어요.`}
            </div>
          </div>
          <div className="paper">{letter.message}</div>
        </>
      ) : (
        <>
          <div className="eta">
            <div className="top">
              <span>도착까지</span>
              <b>{formatMinutes(remainMin)}</b>
            </div>
            <div className="progress"><i style={{ width: `${pr.p * 100}%` }} /></div>
            <div className="meta">{clock(arriveAt)} 도착 예정 · {Math.round(pr.p * 100)}% 날아왔어요</div>
          </div>
          <ol className="timeline" aria-label="경유지">
            {route.points.map((pt, i) => {
              const passed = pr.p >= i / last;
              const at = letter.sentAt + pr.total * (i / last) * 60000;
              const label = i === 0 ? `출발 ${clock(at)}` : i === last ? `도착 예정 ${clock(at)}` : `${passed ? "지남" : "예상"} ${clock(at)}`;
              return (
                <li key={pt.name} className={passed ? "passed" : i === nextIdx ? "next" : ""}>
                  <span className="tdot" aria-hidden />
                  <span>{pt.name}</span>
                  <span className="t">{label}</span>
                </li>
              );
            })}
          </ol>
          {demo && (
            <button className="linkbtn" onClick={() => fastForward(letter.id, Math.max(5, Math.ceil(pr.total / 4)))}>
              데모: 시간 빨리 감기
            </button>
          )}
        </>
      )}
      <Link href="/" className="ghost">홈으로</Link>
    </main>
  );
}
