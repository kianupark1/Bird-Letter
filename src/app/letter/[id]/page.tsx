"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import JourneyMap from "@/components/JourneyMap";
import { getBird } from "@/lib/birds";
import { getRoute } from "@/lib/routes";
import { formatMinutes } from "@/lib/geo";
import { letterProgress, useLetters, useNow } from "@/lib/letters";

export default function LetterPage() {
  const { id } = useParams<{ id: string }>();
  const { letters, ready, fastForward } = useLetters();
  const now = useNow(5000);
  const letter = letters.find((l) => l.id === id);

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
  const passed = route.points.filter((_, i) => pr.p >= i / (route.points.length - 1));
  const here = passed[passed.length - 1];

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
                ? `까치가 ${route.title.split("→")[1].trim()}에서 반갑게 울었어요. 아침 까치가 울면 반가운 손님이 온다더니!`
                : `${bird.name}가 ${route.title.split("→")[1].trim()}에 내려앉았어요.`}
            </div>
          </div>
          <div className="paper">{letter.message}</div>
        </>
      ) : (
        <>
          <div className="progress"><i style={{ width: `${pr.p * 100}%` }} /></div>
          <div className="small">
            {Math.round(pr.p * 100)}% · 도착까지 {formatMinutes(remainMin)} · 지금 {here?.name ?? route.points[0].name} 근처
          </div>
          <button className="ghost" onClick={() => fastForward(letter.id, Math.max(5, Math.ceil(pr.total / 4)))}>
            데모: 시간 빨리 감기
          </button>
        </>
      )}
      <Link href="/" className="ghost">홈으로</Link>
    </main>
  );
}
