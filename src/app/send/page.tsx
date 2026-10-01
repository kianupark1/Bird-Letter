"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BIRDS, getBird } from "@/lib/birds";
import { ROUTES, getRoute } from "@/lib/routes";
import { formatMinutes, travelMinutes } from "@/lib/geo";
import { useLetters } from "@/lib/letters";
import JourneyMap from "@/components/JourneyMap";

export default function Send() {
  return (
    <Suspense fallback={<main className="app" />}>
      <SendForm />
    </Suspense>
  );
}

function SendForm() {
  const router = useRouter();
  const { add } = useLetters();
  // ?bird=bungbungi 처럼 새를 미리 골라서 들어올 수 있음
  const preset = useSearchParams().get("bird");
  const [step, setStep] = useState(1);
  const [to, setTo] = useState("");
  const [routeId, setRouteId] = useState(ROUTES[0].id);
  const [birdId, setBirdId] = useState(BIRDS.some((b) => b.id === preset) ? (preset as string) : "swallow");
  const [message, setMessage] = useState("");

  const route = getRoute(routeId);
  const bird = getBird(birdId);
  const minutes = travelMinutes(bird, route.km);

  const send = () => {
    const id = add({ to: to.trim(), routeId, birdId, message: message.trim() });
    router.push(`/letter/${id}`);
  };

  return (
    <main className="app">
      <h1>편지 쓰기</h1>
      <div className="steps" aria-label={`3단계 중 ${step}단계`}>
        {[1, 2, 3].map((n) => <i key={n} className={n <= step ? "on" : ""} />)}
      </div>

      {step === 1 && (
        <>
          <p className="sub">누구에게, 어디로 보낼까요?</p>
          <input className="field" placeholder="받는 사람 이름" value={to} onChange={(e) => setTo(e.target.value)} />
          <div className="chips">
            {ROUTES.map((r) => (
              <button key={r.id} className="chip" aria-pressed={r.id === routeId} onClick={() => setRouteId(r.id)}>
                {r.title}
              </button>
            ))}
          </div>
          <JourneyMap route={route} p={0} emoji={bird.emoji} />
          <p className="sub" style={{ marginTop: 12 }}>{route.points.map((p) => p.name).join(" → ")} · {route.km}km</p>
          <button className="cta" disabled={!to.trim()} onClick={() => setStep(2)}>다음: 새 고르기</button>
        </>
      )}

      {step === 2 && (
        <>
          <p className="sub">{route.title} · {route.km}km — 어떤 새가 날아갈까요?</p>
          {BIRDS.map((b) => (
            <button key={b.id} className="card" aria-pressed={b.id === birdId} onClick={() => setBirdId(b.id)}>
              <div className="row">
                <span className="emoji">{b.emoji}</span>
                <div>
                  <div><span className="name">{b.name}</span><span className="badge">{b.badge}</span></div>
                  <div className="note">{b.note}</div>
                </div>
              </div>
              <div className="time">{formatMinutes(travelMinutes(b, route.km))}</div>
            </button>
          ))}
          <button className="cta" onClick={() => setStep(3)}>다음: 편지 쓰기</button>
          <button className="ghost" onClick={() => setStep(1)}>이전</button>
        </>
      )}

      {step === 3 && (
        <>
          <p className="sub">{to}에게 · {bird.emoji} {bird.name} · {formatMinutes(minutes)} 뒤 도착 ({new Date(Date.now() + minutes * 60000).toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" })} 예정)</p>
          <textarea className="field" placeholder="마음을 적어 보세요" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} />
          <div className="small">{message.length}/500</div>
          <button className="cta" disabled={!message.trim()} onClick={send}>{bird.name}로 보내기</button>
          <button className="ghost" onClick={() => setStep(2)}>이전</button>
        </>
      )}
    </main>
  );
}
