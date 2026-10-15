"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BIRDS, BIRDS_SLOW_TO_FAST, getBird, mishapShort, mishapText } from "@/lib/birds";
import { getRoute, routeIdOf } from "@/lib/routes";
import { getPlace, nearestPlace } from "../../../core/places";
import { formatMinutes, travelMinutes } from "@/lib/geo";
import { useLetters } from "@/lib/letters";
import { useProfile } from "@/lib/settings";
import { listFriends, type Friend } from "@/lib/firebase/friends";
import { ensureUser, firebaseEnabled } from "@/lib/firebase/client";
import { getMeta } from "@/lib/firebase/remote";
import Link from "next/link";
import JourneyMap from "@/components/JourneyMap";
import PlaceField from "@/components/PlaceField";
import BirdIcon from "@/components/BirdIcon";
import { IS_TOSS, letterHref } from "@/lib/target";
import { MAX_LETTER_CHARS, MAX_PHOTOS } from "@/lib/limits";
import { compressPhoto } from "@/lib/photo";
import { MAX_SCHEDULE_DAYS, dateTimeText, fromInputValue, toInputValue, validateDepart } from "../../../core/schedule";

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
  const { profile, ready: profileReady, update } = useProfile();
  // ?bird=bungbungi 처럼 새를 미리 골라서 들어올 수 있음
  const params = useSearchParams();
  const preset = params.get("bird");
  // 주소 끝에 ?test=1을 붙이면 600배 빠르게 날아가요(직접 써 보는 시험용, 실제 새 속도라 60배로는 너무 오래 걸려요)
  const speed = !IS_TOSS && params.get("test") ? 600 : 1;
  const [step, setStep] = useState(1);
  const [to, setTo] = useState("");
  const [fromId, setFromId] = useState("seoul");
  const [toId, setToId] = useState("busan");
  const [touched, setTouched] = useState(false);
  const [birdId, setBirdId] = useState(BIRDS.some((b) => b.id === preset) ? (preset as string) : "pigeon");
  const [message, setMessage] = useState("");
  const [geoMsg, setGeoMsg] = useState("");
  // 사진(폴라로이드)과 예약 발송
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoMsg, setPhotoMsg] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const [mode, setMode] = useState<"now" | "later">("now");
  const [departInput, setDepartInput] = useState("");
  // 친구에게 앱 안에서 바로 보내기(친구 목록에서 고르면 받는 사람이 정해져요)
  const [friends, setFriends] = useState<Friend[]>([]);
  const [toUid, setToUid] = useState<string | undefined>();
  // 대화방에서 "OO에게 편지 쓰기"를 누르고 오면 받는 사람이 정해져 있어요(?to=<친구 uid> 또는 ?name=<이름>)
  const presetFriend = params.get("friend") ?? params.get("to");
  const presetName = params.get("name");
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    if (presetName && !presetFriend) { setTo(presetName); setLocked(true); }
  }, [presetName, presetFriend]);
  useEffect(() => {
    if (IS_TOSS || !firebaseEnabled) return;
    listFriends().then((f) => {
      setFriends(f);
      const hit = presetFriend ? f.find((x) => x.uid === presetFriend) : undefined;
      if (hit) { setTo(hit.name); setToUid(hit.uid); setLocked(true); }
    }).catch(() => {});
  }, [presetFriend]);
  const pickFriend = (f: Friend) => { setTo(f.name); setToUid(f.uid); setReplyTo(undefined); };
  // 답장: 받은 편지(?reply=편지ID)의 보낸 사람에게, 보낸 곳과 받는 곳을 거꾸로 해서 써요
  const replyId = params.get("reply");
  const [replyTo, setReplyTo] = useState<string | undefined>();
  const [replyName, setReplyName] = useState("");
  useEffect(() => {
    if (IS_TOSS || !firebaseEnabled || !replyId) return;
    let off = false;
    (async () => {
      const meta = await getMeta(replyId);
      const user = await ensureUser();
      if (off || !meta || meta.recipientUid !== user.uid) return;
      setTo(meta.fromName || "보낸 사람"); setToUid(meta.fromUid); setReplyTo(meta.id); setReplyName(meta.fromName || "보낸 사람");
      const [a, b] = meta.routeId.split("-");
      if (getPlace(a) && getPlace(b) && a !== b) { setTouched(true); setFromId(b); setToId(a); }
    })();
    return () => { off = true; };
  }, [replyId]);

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

  const departMs = mode === "later" ? fromInputValue(departInput) : null;
  const departError = mode === "later" ? validateDepart(departMs, Date.now()) : null;
  const startMs = mode === "later" && departMs ? departMs : Date.now();
  const pickMode = (m: "now" | "later") => {
    setMode(m);
    if (m === "later" && !departInput) {
      const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); // 기본값: 내일 오전 9시
      setDepartInput(toInputValue(d.getTime()));
    }
  };
  const addPhotos = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setPhotoMsg(""); setPhotoBusy(true);
    const next = [...photos];
    for (const f of Array.from(files)) {
      if (next.length >= MAX_PHOTOS) { setPhotoMsg(`사진은 최대 ${MAX_PHOTOS}장까지 담을 수 있어요.`); break; }
      try { next.push(await compressPhoto(f)); }
      catch (e) { setPhotoMsg((e as Error).message === "not-image" ? "사진 파일만 담을 수 있어요." : "이 사진은 줄이지 못했어요. 다른 사진을 골라 주세요."); }
    }
    setPhotos(next); setPhotoBusy(false);
  };

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
    if (departError) { setError(departError); return; }
    setBusy(true);
    setError("");
    try {
      const id = await add({
        to: to.trim(), toUid, routeId: routeIdOf(fromId, toId), birdId, message: message.trim(), fromName: profile.nickname, speed,
        photos: photos.length ? photos : undefined, departAt: mode === "later" && departMs ? departMs : undefined, replyTo,
      });
      router.push(letterHref(id));
    } catch {
      setError(photos.length || mode === "later" ? "편지를 보내지 못했어요. 인터넷 연결을 확인해 주세요. 사진·예약은 서버 설정이 끝나야 보낼 수 있어요." : "편지를 보내지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.");
      setBusy(false);
    }
  };

  return (
    <main className="app">
      <header className="sendhead">
        {step === 1 ? <Link href={locked && toUid ? `/room?u=${encodeURIComponent(toUid)}` : "/"} className="roomback" aria-label="뒤로">‹</Link> : <button type="button" className="roomback" aria-label="이전" onClick={() => setStep(step - 1)}>‹</button>}
        <h1>{locked && to ? `${to}에게 쓰는 편지` : "편지 쓰기"}</h1>
      </header>
      <div className="steps" aria-label={`3단계 중 ${step}단계`}>
        {[1, 2, 3].map((n) => <i key={n} className={n <= step ? "on" : ""} />)}
      </div>

      {step === 1 && (
        <>
          <p className="sub">누구에게, 어디로 보낼까요?</p>
          {replyTo && <div className="small" role="status" style={{ marginTop: 0, marginBottom: 8 }}>↩ {replyName}님이 보낸 편지에 답장해요. 보낸 곳과 받는 곳을 바꿔 두었어요.</div>}
          {!IS_TOSS && firebaseEnabled && !replyTo && !locked && (
            <div className="friendpick">
              <div className="lab">친구에게 바로 보내기</div>
              <div className="chips">
                {friends.map((f) => (
                  <button key={f.uid} type="button" className="chip" aria-pressed={toUid === f.uid} onClick={() => pickFriend(f)}>{f.name}</button>
                ))}
                <Link href="/friends" className="chip">＋ 친구 추가</Link>
              </div>
              {friends.length === 0 && <div className="small" style={{ marginTop: 6 }}>친구를 연결하면 링크 없이 친구의 새편지함으로 바로 날아가요.</div>}
            </div>
          )}
          {!locked && <input className="field" placeholder="받는 사람 이름" value={to} onChange={(e) => { setTo(e.target.value); setToUid(undefined); setReplyTo(undefined); }} />}

          <div className="placerow">
            <PlaceField id="from-place" label="내가 있는 곳" value={fromId} onChange={pickFrom} />
            {!IS_TOSS && <button type="button" className="chip locate" onClick={locate}>내 위치로</button>}
          </div>
          {geoMsg && <div className="small" role="status" style={{ marginTop: 0, marginBottom: 8 }}>{geoMsg}</div>}
          <button type="button" className="swap" onClick={swap} aria-label="보내는 곳과 받는 곳 바꾸기">⇅ 서로 바꾸기</button>
          <PlaceField id="to-place" label="받는 사람이 있는 곳" value={toId} onChange={pickTo} />

          <div className="sendmap"><JourneyMap route={route} p={0} birdId={birdId} /></div>
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
          <p className="sub big">어떤 새로 보낼까요?<br /><span>{to}에게 · {route.title} · {route.km}km</span></p>
          {[...BIRDS_SLOW_TO_FAST].reverse().map((b) => (
            <button key={b.id} className="card wrapfoot birdpick" aria-pressed={b.id === birdId} onClick={() => setBirdId(b.id)}>
              <div className="row">
                <BirdIcon id={b.id} size={60} />
                <div>
                  <div><span className="name">{b.name}</span></div>
                  <div className="kmh">시속 {b.kmh}km</div>
                </div>
              </div>
              <div className="time">{formatMinutes(Math.max(1, travelMinutes(b, route.km)))}</div>
              <div className="risk">{mishapShort(b)}</div>
            </button>
          ))}
          <div className="dock">
            <button className="cta big" onClick={() => setStep(3)}>이 새로 보낼게요</button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div className="carrier">
            <BirdIcon id={birdId} size={96} letter />
            <div className="carrier-text">
              <div className="to">{to}에게</div>
              <div className="path">{getPlace(fromId)?.name} → {getPlace(toId)?.name}</div>
              <div className="when">
                {mode === "later" && departMs ? (
                  <>{dateTimeText(departMs)}에 출발해서 {whenText} 뒤 <span className="nb">({dateTimeText(departMs + minutes * 60000)} 예정)</span>에 도착해요</>
                ) : (
                  <>
                    {bird.name}가 {whenText} 뒤에 도착해요
                    {" "}<span className="nb">({new Date(Date.now() + minutes * 60000).toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" })} 예정)</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <p className="small" style={{ margin: 0 }}>
            {bird.name}는 시속 약 {bird.kmh}km로 날아요. {mishapText(bird)}. 편지는 사라지지 않고 꼭 도착해요.
          </p>
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

          <div className="photobar">
            {photos.length > 0 && (
              <div className="thumbs" aria-label="담은 사진">
                {photos.map((src, i) => (
                  <div key={i} className="thumb" style={{ ["--tilt" as string]: `${[-3, 2, -1.5][i % 3]}deg` }}>
                    <img src={src} alt={`담은 사진 ${i + 1}`} />
                    <button type="button" aria-label={`사진 ${i + 1} 빼기`} onClick={() => setPhotos((p) => p.filter((_, k) => k !== i))}>×</button>
                  </div>
                ))}
              </div>
            )}
            <label className="addphoto" style={{ display: "grid", placeItems: "center", cursor: photos.length >= MAX_PHOTOS || photoBusy ? "default" : "pointer", opacity: photos.length >= MAX_PHOTOS ? 0.5 : 1 }}>
              {photoBusy ? "사진을 줄이는 중..." : photos.length >= MAX_PHOTOS ? `사진 ${MAX_PHOTOS}장을 모두 담았어요` : `📷 폴라로이드 사진 담기 (${photos.length}/${MAX_PHOTOS})`}
              <input id="photo-input" className="sr-file" type="file" accept="image/*" multiple disabled={photos.length >= MAX_PHOTOS || photoBusy}
                onChange={(e) => { void addPhotos(e.target.files); e.target.value = ""; }} />
            </label>
            <div className="small" style={{ margin: 0 }}>사진은 폴라로이드로 돌돌 말려서 날아가요. 촬영 위치 같은 정보는 지우고 보내요.</div>
            {photoMsg && <div className="small" role="status" style={{ margin: 0, color: "var(--dahong)", opacity: 1 }}>{photoMsg}</div>}
          </div>

          <div className="schedule">
            <b>언제 출발할까요?</b>
            <div className="modes">
              <button type="button" aria-pressed={mode === "now"} onClick={() => pickMode("now")}>지금 바로 출발</button>
              <button type="button" aria-pressed={mode === "later"} onClick={() => pickMode("later")}>정한 때에 출발</button>
            </div>
            {mode === "later" && (
              <>
                <input id="depart-at" type="datetime-local" value={departInput} onChange={(e) => setDepartInput(e.target.value)}
                  min={toInputValue(Date.now() + 2 * 60000)} max={toInputValue(Date.now() + (MAX_SCHEDULE_DAYS - 1) * 24 * 3600 * 1000)} aria-label="출발할 날짜와 시각" />
                <div className="hint">
                  {departError ? departError : `${dateTimeText(startMs)}에 새가 출발해요. 출발하기 전까지는 받는 사람에게 보이지 않아요(깜짝 선물). 출발 전에는 취소할 수 있어요.`}
                </div>
              </>
            )}
          </div>

          {error && <div className="small" role="alert" style={{ color: "var(--dahong)", opacity: 1 }}>{error}</div>}
          <div className="dock">
            <button className="cta" disabled={!message.trim() || busy || photoBusy || message.length > MAX_LETTER_CHARS || !!departError} onClick={send}>{busy ? "보내는 중..." : mode === "later" ? "예약하고 보내기" : `${bird.name}로 보내기`}</button>
          </div>
        </>
      )}
    </main>
  );
}
