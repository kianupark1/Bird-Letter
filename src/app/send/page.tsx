"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BIRDS, getBird } from "@/lib/birds";
import { getRoute, routeIdOf } from "@/lib/routes";
import { getPlace, nearestPlace, placesByRegion } from "../../../core/places";
import { formatMinutes, travelMinutes } from "@/lib/geo";
import { useLetters } from "@/lib/letters";
import { useProfile } from "@/lib/settings";
import JourneyMap from "@/components/JourneyMap";
import BirdIcon from "@/components/BirdIcon";
import { IS_TOSS, letterHref } from "@/lib/target";
import { MAX_LETTER_CHARS } from "@/lib/limits";

export default function Send() {
  return (
    <Suspense fallback={<main className="app" />}>
      <SendForm />
    </Suspense>
  );
}

function PlaceSelect({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="placefield" htmlFor={id}>
      <span className="lab">{label}</span>
      <select id={id} className="field" value={value} onChange={(e) => onChange(e.target.value)}>
        {placesByRegion().map((g) => (
          <optgroup key={g.region} label={g.region}>
            {g.places.map((p) => (
              <option key={p.id} value={p.id}>{p.name === p.landmark.name ? p.name : `${p.name} · ${p.landmark.name}`}</option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}

function SendForm() {
  const router = useRouter();
  const { add } = useLetters();
  const { profile, ready: profileReady, update } = useProfile();
  // ?bird=bungbungi 처럼 새를 미리 골라서 들어올 수 있음
  const params = useSearchParams();
  const preset = params.get("bird");
  // 주소 끝에 ?test=1을 붙이면 60배 빠르게 날아가요(직접 써 보는 시험용)
  const speed = !IS_TOSS && params.get("test") ? 60 : 1;
  const [step, setStep] = useState(1);
  const [to, setTo] = useState("");
  const [fromId, setFromId] = useState("seoul");
  const [toId, setToId] = useState("busan");
  const [touched, setTouched] = useState(false);
  const [birdId, setBirdId] = useState(BIRDS.some((b) => b.id === preset) ? (preset as string) : "swallow");
  const [message, setMessage] = useState("");
  const [geoMsg, setGeoMsg] = useState("");

  // 이전에 정해 둔 "내가 있는 곳"을 보내는 곳 기본값으로
  useEffect(() => {
    if (!profileReady || touched) return;
    setFromId(profile.homePlace);
    setToId((cur) => (cur === profile.homePlace ? (profile.homePlace === "busan" ? "seoul" : "busan") : cur));
  }, [profileReady, profile.homePlace, touched]);

  const same = fromId === toId;
  const route = getRoute(same ? "seoul-busan" : routeIdOf(fromId, toId));
  const bird = getBird(birdId);
  const minutes = Math.max(1, travelMinutes(bird, route.km) / speed);
  const whenText = speed > 1 ? `테스트 속도로 약 ${Math.max(1, Math.round(minutes * 60))}초` : `${formatMinutes(Math.max(1, Math.round(minutes)))}`;

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pickFrom = (id: string) => { setTouched(true); setFromId(id); update({ homePlace: id }); setGeoMsg(""); };
  const pickTo = (id: string) => { setTouched(true); setToId(id); };
  const swap = () => { setTouched(true); setFromId(toId); setToId(fromId); };

  // "내 위치로": 가까운 지역만 골라요. 좌표는 저장하거나 서버로 보내지 않아요.
  const locate = () => {
    if (!navigator.geolocation) return setGeoMsg("이 기기에서는 위치를 알 수 없어요. 직접 골라 주세요.");
    setGeoMsg("위치를 찾는 중이에요...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const near = nearestPlace(pos.coords.latitude, pos.coords.longitude);
        pickFrom(near.id);
        setGeoMsg(`${near.name}에 있는 것으로 정했어요.`);
      },
      () => setGeoMsg("위치를 허용하지 않아서 직접 골라야 해요."),
      { timeout: 10000, maximumAge: 600000 },
    );
  };

  const send = async () => {
    setBusy(true);
    setError("");
    try {
      const id = await add({ to: to.trim(), routeId: routeIdOf(fromId, toId), birdId, message: message.trim(), fromName: profile.nickname, speed });
      router.push(letterHref(id));
    } catch {
      setError("편지를 보내지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.");
      setBusy(false);
    }
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

          <div className="placerow">
            <PlaceSelect id="from-place" label="내가 있는 곳" value={fromId} onChange={pickFrom} />
            {!IS_TOSS && <button type="button" className="chip locate" onClick={locate}>내 위치로</button>}
          </div>
          {geoMsg && <div className="small" role="status" style={{ marginTop: 0, marginBottom: 8 }}>{geoMsg}</div>}
          <button type="button" className="swap" onClick={swap} aria-label="보내는 곳과 받는 곳 바꾸기">⇅ 서로 바꾸기</button>
          <PlaceSelect id="to-place" label="받는 사람이 있는 곳" value={toId} onChange={pickTo} />

          <JourneyMap route={route} p={0} birdId={birdId} />
          <p className="sub" style={{ marginTop: 12 }}>
            {same
              ? "보내는 곳과 받는 곳이 같아요. 받는 곳을 바꿔 주세요."
              : `${getPlace(fromId)?.name} ${route.points[0].name} → ${getPlace(toId)?.name} ${route.points[route.points.length - 1].name} · ${route.km}km`}
          </p>
          {!IS_TOSS && <p className="small" style={{ marginTop: -8 }}>‘내 위치로’는 가까운 지역을 고르는 데만 써요. 정확한 위치는 저장하지 않아요.</p>}
          <div className="dock">
            <button className="cta" disabled={!to.trim() || same} onClick={() => setStep(2)}>다음: 새 고르기</button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <p className="sub">{route.title} · {route.km}km — 어떤 새가 날아갈까요?</p>
          {BIRDS.map((b) => (
            <button key={b.id} className="card" aria-pressed={b.id === birdId} onClick={() => setBirdId(b.id)}>
              <div className="row">
                <BirdIcon id={b.id} size={60} />
                <div>
                  <div><span className="name">{b.name}</span><span className="badge">{b.badge}</span></div>
                  <div className="note">{b.note}</div>
                </div>
              </div>
              <div className="time">{formatMinutes(Math.max(1, travelMinutes(b, route.km)))}</div>
            </button>
          ))}
          <div className="dock">
            <button className="cta" onClick={() => setStep(3)}>다음: 편지 쓰기</button>
            <button className="ghost" onClick={() => setStep(1)}>이전</button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div className="carrier">
            <BirdIcon id={birdId} size={72} letter />
            <p className="sub" style={{ margin: 0 }}>
              {to}에게 · {route.title} · {bird.name}가 {whenText} 뒤에 도착해요 ({new Date(Date.now() + minutes * 60000).toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" })} 예정)
            </p>
          </div>
          <textarea
            className="field letterbox"
            placeholder="마음을 적어 보세요. 짧아도, 길어도 괜찮아요."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            aria-label="편지 내용"
          />
          <div className="small">
            {message.length.toLocaleString("ko-KR")}자
            {message.length > MAX_LETTER_CHARS && ` · 한 통에는 ${MAX_LETTER_CHARS.toLocaleString("ko-KR")}자까지 담을 수 있어요. 나눠서 보내 주세요.`}
          </div>
          {error && <div className="small" role="alert" style={{ color: "var(--dahong)", opacity: 1 }}>{error}</div>}
          <div className="dock">
            <button className="cta" disabled={!message.trim() || busy || message.length > MAX_LETTER_CHARS} onClick={send}>{busy ? "보내는 중..." : `${bird.name}로 보내기`}</button>
            <button className="ghost" onClick={() => setStep(2)}>이전</button>
          </div>
        </>
      )}
    </main>
  );
}
