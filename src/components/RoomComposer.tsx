"use client";
import { useEffect, useRef, useState } from "react";
import BirdIcon from "@/components/BirdIcon";
import PlaceField from "@/components/PlaceField";
import { BIRDS_SLOW_TO_FAST, getBird, mishapShort } from "@/lib/birds";
import { getRoute, routeIdOf } from "@/lib/routes";
import { formatMinutes, travelMinutes } from "@/lib/geo";
import { useProfile } from "@/lib/settings";
import { MAX_LETTER_CHARS, MAX_PHOTOS } from "@/lib/limits";
import { compressPhoto } from "@/lib/photo";
import { getPlace } from "../../core/places";
import { locate as findDistrict } from "../../core/districts";
import { MAX_SCHEDULE_DAYS, dateTimeText, fromInputValue, toInputValue, validateDepart } from "../../core/schedule";
import type { Letter } from "@/lib/letters";
import { IS_TOSS } from "@/lib/target";
import { tryMoveHome } from "@/lib/homePlace";

type AddFn = (l: Omit<Letter, "id" | "sentAt" | "arriveAt"> & { fromName?: string; speed?: number; departAt?: number; replyTo?: string }) => Promise<string>;
const LAST_BIRD = "saepyeonji.lastbird.v1";
const placeKey = (k: string) => `saepyeonji.roomplace.v1.${k}`;
const read = (k: string) => { try { return localStorage.getItem(k) ?? ""; } catch { return ""; } };
const write = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch {} };

/** 대화방 맨 아래 입력줄: 글을 쓰고 ➤를 누르면 그 자리에서 새가 출발해요. 새·받는 곳·사진·나중에 보내기는 위의 알약으로 바꿔요 */
export default function RoomComposer({ threadKey, name, toUid, guessPlace, friendPlace, add }: { threadKey: string; name: string; toUid?: string; guessPlace?: string; friendPlace?: string; add: AddFn }) {
  const { profile, ready, update } = useProfile();
  const [message, setMessage] = useState("");
  const [birdId, setBirdId] = useState("pigeon");
  const [toId, setToId] = useState("");
  const [sheet, setSheet] = useState<"" | "bird" | "place" | "later">("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [info, setInfo] = useState("");
  const [later, setLater] = useState("");
  const [busy, setBusy] = useState(false);
  const [geo, setGeo] = useState("");
  const declared = !!friendPlace && !!getPlace(friendPlace); // 친구가 직접 알려 준 동네면 보내는 사람이 바꿀 수 없어요
  /** 내 동네 바꾸기: 너무 빠른 이동은 막아요(거리를 일부러 늘리는 것 방지) */
  const moveHome = (id: string): boolean => {
    const r = tryMoveHome(profile.homePlace, id);
    if (!r.ok) { setGeo(r.message); return false; }
    update({ homePlace: id, homeSet: true }); setGeo(""); return true;
  };
  const speed = useRef(1);

  useEffect(() => {
    const b = read(LAST_BIRD);
    if (b) setBirdId(b);
    setToId(friendPlace && getPlace(friendPlace) ? friendPlace : read(placeKey(threadKey)) || guessPlace || "");
    if (!IS_TOSS && new URLSearchParams(window.location.search).get("test")) speed.current = 600; // 직접 써 보기용 빠른 속도
  }, [threadKey, guessPlace, friendPlace]);

  const fromId = profile.homePlace;
  const ok = !!toId && toId !== fromId && !!getPlace(toId);
  const route = ok ? getRoute(routeIdOf(fromId, toId)) : null;
  const bird = getBird(birdId);
  const mins = route ? Math.max(1, Math.round(travelMinutes(bird, route.km) / speed.current)) : 0;
  const departMs = later ? fromInputValue(later) : null;
  const departError = later ? validateDepart(departMs, Date.now()) : null;
  const canSend = ready && !!message.trim() && ok && !busy && !photoBusy && message.length <= MAX_LETTER_CHARS && !departError;

  const pickBird = (id: string) => { setBirdId(id); write(LAST_BIRD, id); setSheet(""); };
  const pickTo = (id: string) => { setToId(id); write(placeKey(threadKey), id); };
  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    setInfo(""); setPhotoBusy(true);
    const next = [...photos];
    for (const f of Array.from(files)) {
      if (next.length >= MAX_PHOTOS) { setInfo(`사진은 최대 ${MAX_PHOTOS}장까지 담을 수 있어요.`); break; }
      try { next.push(await compressPhoto(f)); } catch (e) { setInfo((e as Error).message === "not-image" ? "사진 파일만 담을 수 있어요." : "이 사진은 줄이지 못했어요. 다른 사진을 골라 주세요."); }
    }
    setPhotos(next); setPhotoBusy(false);
  };
  const locate = () => {
    if (!navigator.geolocation) return setGeo("이 기기에서는 위치를 알 수 없어요. 직접 골라 주세요.");
    setGeo("위치를 찾는 중이에요...");
    navigator.geolocation.getCurrentPosition((pos) => {
      const here = findDistrict(pos.coords.latitude, pos.coords.longitude); // 구까지만, 좌표는 저장하지 않아요
      if (!moveHome(here.place.id)) return;
      update({ homeLabel: here.label, homeSet: true });
      setGeo(here.label === here.place.name ? `${here.label} 근처로 정했어요.` : `${here.label}에 있는 것 같아요. ${here.place.name}에서 출발해요.`);
    }, () => setGeo("위치를 허용하지 않아서 직접 골라야 해요."), { timeout: 10000, maximumAge: 600000 });
  };
  const toggleLater = () => {
    if (later) { setLater(""); return; }
    const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); // 기본값: 내일 오전 9시
    setLater(toInputValue(d.getTime())); setSheet("later");
  };

  const send = async () => {
    if (!canSend || !route) return;
    setBusy(true); setInfo("");
    try {
      await add({ to: name, toUid, routeId: routeIdOf(fromId, toId), birdId, message: message.trim(), fromName: profile.nickname, speed: speed.current, photos: photos.length ? photos : undefined, departAt: later && departMs ? departMs : undefined });
      write(LAST_BIRD, birdId);
      setMessage(""); setPhotos([]); setLater(""); setSheet("");
    } catch {
      setInfo(photos.length || later ? "편지를 보내지 못했어요. 인터넷 연결을 확인해 주세요. 사진·예약은 서버 설정이 끝나야 보낼 수 있어요." : "편지를 보내지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.");
    }
    setBusy(false);
  };

  return (
    <div className="ch-comp">
      {sheet && <button type="button" className="ch-dim" aria-label="닫기" onClick={() => setSheet("")} />}
      {sheet === "bird" && (
        <div className="ch-sheet" role="dialog" aria-label="새 고르기">
          <h2>어떤 새로 보낼까요?</h2>
          {[...BIRDS_SLOW_TO_FAST].reverse().map((b, i) => (
            <button key={b.id} type="button" className={`birdpick wrapfoot bp${i % 6}`} aria-pressed={b.id === birdId} onClick={() => pickBird(b.id)}>
              <span className="row"><BirdIcon id={b.id} size={62} /><span><span className="name">{b.name}</span><br /><span className="kmh">시속 {b.kmh}km</span></span></span>
              <span className="time">{route ? formatMinutes(Math.max(1, Math.round(travelMinutes(b, route.km) / speed.current))) : ""}</span>
              <span className="risk">{mishapShort(b)}</span>
            </button>
          ))}
        </div>
      )}
      {sheet === "place" && (
        <div className="ch-sheet" role="dialog" aria-label="보내는 곳과 받는 곳">
          <h2>어디서 어디로 날아갈까요?</h2>
          <div className="placerow">
            <PlaceField id="from-place" label="내가 있는 곳" value={fromId} onChange={(id) => { moveHome(id); }} />
            {!IS_TOSS && <button type="button" className="chip locate" onClick={locate}>내 위치로</button>}
          </div>
          {geo && <div className="small" role="status">{geo}</div>}
          {declared ? (
            <div className="eta2" role="status"><div className="small" style={{ margin: 0 }}>{name}님이 알려 준 곳이에요</div><div style={{ fontSize: 22, fontWeight: 700 }}>{getPlace(friendPlace!)?.name}</div></div>
          ) : (
            <>
              <PlaceField id="to-place" label={`${name}님이 있는 곳`} value={toId || "busan"} onChange={pickTo} />
              <div className="small" style={{ margin: 0 }}>{name}님이 내 동네를 알려 주면 자동으로 정해져요. 지금은 직접 골라 주세요.</div>
            </>
          )}
          <button type="button" className="chunky" disabled={!ok} onClick={() => setSheet("")}>{ok ? "이 길로 할게요" : "받는 곳을 다르게 골라 주세요"}</button>
        </div>
      )}
      {sheet === "later" && (
        <div className="ch-sheet" role="dialog" aria-label="나중에 보내기">
          <h2>언제 출발할까요?</h2>
          <input id="depart-at" type="datetime-local" className="field" value={later} onChange={(e) => setLater(e.target.value)}
            min={toInputValue(Date.now() + 2 * 60000)} max={toInputValue(Date.now() + (MAX_SCHEDULE_DAYS - 1) * 24 * 3600 * 1000)} aria-label="출발할 날짜와 시각" />
          <div className="small">{departError ?? `${dateTimeText(departMs ?? Date.now())}에 새가 출발해요. 출발하기 전까지는 받는 사람에게 보이지 않아요(깜짝 선물).`}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="chunky" style={{ flex: 1 }} disabled={!!departError} onClick={() => setSheet("")}>이때 보낼게요</button>
            <button type="button" className="ghost" style={{ flex: 1 }} onClick={() => { setLater(""); setSheet(""); }}>지금 바로</button>
          </div>
        </div>
      )}

      {photos.length > 0 && (
        <div className="thumbs ch-thumbs" aria-label="담은 사진">
          {photos.map((src, i) => (
            <div key={i} className="thumb"><img src={src} alt={`담은 사진 ${i + 1}`} /><button type="button" aria-label={`사진 ${i + 1} 빼기`} onClick={() => setPhotos((p) => p.filter((_, k) => k !== i))}>×</button></div>
          ))}
        </div>
      )}
      <div className="ch-pills">
        <button type="button" className="ch-pill" onClick={() => setSheet("bird")}><BirdIcon id={bird.id} size={26} /> {bird.name}{mins ? ` · ${formatMinutes(mins)}` : ""}</button>
        <button type="button" className={`ch-pill ${ok ? "" : "warn"}`} onClick={() => setSheet("place")}>📍 {ok && route ? `${getPlace(fromId)?.name} → ${getPlace(toId)?.name}` : "받는 곳 고르기"}{declared ? " ✓" : ""}</button>
        <label className="ch-pill" style={{ cursor: photos.length >= MAX_PHOTOS || photoBusy ? "default" : "pointer" }}>
          {photoBusy ? "줄이는 중..." : `📷 ${photos.length}/${MAX_PHOTOS}`}
          <input id="photo-input" className="sr-file" type="file" accept="image/*" multiple disabled={photos.length >= MAX_PHOTOS || photoBusy} onChange={(e) => { void addPhotos(e.target.files); e.target.value = ""; }} />
        </label>
        <button type="button" className="ch-pill" aria-pressed={!!later} onClick={toggleLater}>{later && departMs ? `⏰ ${dateTimeText(departMs)}` : "⏰ 나중에"}</button>
      </div>
      {info && <div className="small ch-info" role="alert">{info}</div>}
      <div className="ch-inrow">
        <textarea className="ch-in" rows={1} placeholder={`${name}에게 편지를 써 보세요`} value={message} aria-label="편지 내용"
          onChange={(e) => setMessage(e.target.value)} />
        <button type="button" className="ch-go" aria-label={later ? "예약하고 보내기" : "보내기"} disabled={!canSend} onClick={send}>{busy ? "…" : "➤"}</button>
      </div>
      {message.length > MAX_LETTER_CHARS && <div className="small ch-info">한 통에는 {MAX_LETTER_CHARS.toLocaleString("ko-KR")}자까지 담을 수 있어요.</div>}
    </div>
  );
}
