"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import BirdIcon from "@/components/BirdIcon";
import BirdPicker from "@/components/BirdPicker";
import LoginStart from "@/components/LoginStart";
import { useSession } from "@/lib/session";
import { useProfile } from "@/lib/settings";
import { useLetters } from "@/lib/letters";
import { usePeople } from "@/lib/people";
import { getBird } from "@/lib/birds";
import { birdFx } from "@/lib/chirp";
import { MAX_PENPAL_CHARS } from "@/lib/limits";
import { firebaseEnabled, ensureUser } from "@/lib/firebase/client";
import { listBlocked } from "@/lib/firebase/remote";
import { listPool, readPenpal, saveMyPenpal } from "@/lib/firebase/penpal";
import { myPenpalDoc } from "@/lib/penpalSync";
import { PENPAL_CITIES, PENPAL_TAGS, cityLabel, cityOf, maskContacts, penpalName, penpalRoute, pickPenpal, poolIn } from "../../../core/penpal";

/** 펜팔: 모르는 누군가에게 새 날려 보내기 (시안 v5-1·v5-2) */
export default function PenpalPage() {
  const { state, recheck } = useSession();
  if (state === "checking") return <main className="app" aria-busy="true" />;
  if (state === "login") return <LoginStart onDone={recheck} next="/penpal" />;
  return <Suspense fallback={<main className="app" aria-busy="true" />}><Penpal /></Suspense>;
}

function Penpal() {
  const router = useRouter();
  // 랭킹에서 고른 사람에게 보낼 때(?to=uid). 그 사람이 랜덤 편지 받기를 켜 뒀을 때만 보낼 수 있어요
  const toUid = useSearchParams().get("to") ?? "";
  const [chosen, setChosen] = useState<{ uid: string; name: string; region: string } | null | "no">(null);
  useEffect(() => {
    if (!toUid) return;
    readPenpal(toUid).then((p) => setChosen(p?.open ? { uid: p.uid, name: p.name || "어딘가의 새", region: p.region } : "no")).catch(() => setChosen("no"));
  }, [toUid]);
  const { profile, ready, update } = useProfile();
  const { letters, received, add } = useLetters();
  const { book } = usePeople();
  const [age, setAge] = useState(false);
  const [recv, setRecv] = useState(false);
  const [msg, setMsg] = useState("");
  const [bird, setBird] = useState("crane");
  const [pickBird, setPickBird] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  // 어디로 날려 보낼지(도시까지만). 비워 두면 어디든
  const [where, setWhere] = useState<string>("");

  const city = cityOf(profile.homePlace);
  const myName = profile.penpalName?.trim() || penpalName(cityLabel(city), profile.avatarBird || "magpie");
  const tags = profile.penpalTags ?? [];
  const masked = useMemo(() => maskContacts(msg), [msg]);

  // 약속한 사람은 펜팔 받기 명단에 내 줄을 최신으로 올려 둬요(이름·관심사·도시가 바뀌었을 때)
  useEffect(() => {
    if (!ready || !profile.penpalAgreed || !firebaseEnabled) return;
    void saveMyPenpal(myPenpalDoc(profile, { region: city })).catch(() => {});
  }, [ready, profile.penpalAgreed, profile.penpalRecv, profile.penpalListed, profile.penpalPhoto, myName, city, tags.join(","), profile.avatarBird]);

  if (!ready) return <main className="app" aria-busy="true" />;

  if (!profile.penpalAgreed) {
    return (
      <main className="app penpal">
        <header className="sendhead"><Link href="/pen" className="roomback" aria-label="뒤로">‹</Link><h1 style={{ margin: 0 }}>펜팔 친구 찾기</h1></header>
        <div className="ppcard"><BirdIcon id="crane" size={64} letter /><div><b>어느 누군가에게 새 편지 보내기</b><span>모르는 누군가에게 편지가 날아가요. 답장이 오면 펜팔 친구가 돼요</span></div></div>
        <h2 className="friendh">펜팔 약속 (처음 한 번)</h2>
        <ul className="pprules">
          <li><span aria-hidden>🎂</span>만 14세 이상만 쓸 수 있어요</li>
          <li><span aria-hidden>🙊</span><span>전화번호·주소·SNS 아이디는 적지 않아요<small>적으면 자동으로 가려져요</small></span></li>
          <li><span aria-hidden>📷</span>펜팔 편지에는 사진을 담지 않아요</li>
          <li><span aria-hidden>🚩</span>불쾌하면 길게 눌러 신고·차단해요</li>
          <li><span aria-hidden>📍</span><span>상대에게는 &quot;{cityLabel(city)}&quot;까지만 보여요<small>펜팔 이름: {myName}</small></span></li>
        </ul>
        <label className="ppage"><input type="checkbox" checked={age} onChange={(e) => setAge(e.target.checked)} /> 저는 만 14세 이상이에요</label>
        <label className="ppage"><input type="checkbox" checked={recv} onChange={(e) => setRecv(e.target.checked)} /> 나도 모르는 누군가의 편지를 받을래요 <small>(안 해도 보낼 수 있어요 · 설정에서 언제든 바꿔요)</small></label>
        <div className="dock">
          <button type="button" className="cta big" disabled={!age} onClick={() => update({ penpalAgreed: true, penpalRecv: recv })}>약속하고 시작하기</button>
        </div>
      </main>
    );
  }

  const send = async () => {
    if (!msg.trim() || busy) return;
    setBusy(true); setNote("");
    try {
      const me = await ensureUser();
      const [pool, blocked] = await Promise.all([chosen && chosen !== "no" ? Promise.resolve([]) : listPool(), listBlocked(me.uid).catch(() => new Set<string>())]);
      // 이미 편지를 주고받은 사람, 나간 방(넘긴 사람), 차단한 사람은 빼요
      const exclude = new Set<string>([...blocked]);
      for (const l of letters) if (l.toUid) exclude.add(l.toUid);
      for (const r of received) exclude.add(r.fromUid);
      for (const k of Object.keys(book.hidden ?? {})) if (k.startsWith("u:")) exclude.add(k.slice(2));
      const picked = chosen && chosen !== "no" && chosen.uid !== me.uid ? chosen : null;
      const target = picked ?? pickPenpal(poolIn(pool, where || null), me.uid, exclude, tags);
      if (!target) {
        setNote(where ? `지금 ${cityLabel(where)}에는 펜팔 편지를 기다리는 사람이 없어요. "어디든"으로 바꿔 보세요 🕊` : "지금은 펜팔 편지를 기다리는 사람이 없어요. 조금 뒤에 다시 날려 보세요 🕊");
        setBusy(false); return;
      }
      const toName = (picked?.name ?? pool.find((p) => p.uid === target.uid)?.name ?? "어딘가의 새").slice(0, 20);
      await add({ to: toName, toUid: target.uid, routeId: penpalRoute(city, target.region), birdId: bird, message: masked.text.trim(), fromName: myName, penpal: true });
      birdFx("depart", profile.chirp !== false);
      router.push(`/room?u=${encodeURIComponent(target.uid)}`);
    } catch {
      setNote("보내지 못했어요. 인터넷을 확인하고 다시 눌러 주세요.");
      setBusy(false);
    }
  };

  return (
    <main className="app penpal">
      <header className="sendhead"><Link href="/pen" className="roomback" aria-label="뒤로">‹</Link><div><h1 style={{ margin: 0 }}>{chosen && chosen !== "no" ? `${chosen.name}에게 쓰는 편지` : "누군가에게 쓰는 편지"}</h1><div className="greet">{getBird(bird).name}가 어딘가로 데려다줘요 · 나는 &quot;{myName}&quot;</div></div></header>
      {chosen === "no" && <div className="bubble" style={{ fontSize: 16 }}>이 분은 지금 모르는 사람의 편지를 받지 않아요. 대신 랜덤으로 날려 보낼게요 🕊</div>}
      {!(chosen && chosen !== "no") && (
        <label className="ppwhere">
          <span>어디로 날려 보낼까요?</span>
          <select value={where} onChange={(e) => setWhere(e.target.value)} aria-label="어디로 보낼지">
            <option value="">🎲 어디든</option>
            {PENPAL_CITIES.map((c) => <option key={c} value={c}>{cityLabel(c)}</option>)}
          </select>
        </label>
      )}
      {!(chosen && chosen !== "no") && <h2 className="friendh" style={{ marginTop: 6 }}>이런 사람에게 닿았으면 <small>(고르지 않아도 돼요)</small></h2>}
      {!(chosen && chosen !== "no") && <div className="pptags" role="group" aria-label="관심사">
        {PENPAL_TAGS.map((t) => {
          const on = tags.includes(t.id);
          return <button key={t.id} type="button" aria-pressed={on} className={on ? "on" : ""} onClick={() => update({ penpalTags: on ? tags.filter((x) => x !== t.id) : [...tags, t.id].slice(0, 5) })}>{t.label}</button>;
        })}
      </div>}
      <textarea className="pppaper" rows={8} value={msg} maxLength={MAX_PENPAL_CHARS} placeholder="안녕하세요, 처음 보는 누군가에게 편지를 써 보는 건 처음이에요…" aria-label="펜팔 편지 내용" onChange={(e) => setMsg(e.target.value)} />
      <div className="ppwarn">{masked.masked ? `🙊 연락처처럼 보이는 글 ${masked.masked}곳을 가리고 보내요` : "🙊 전화번호·주소·아이디처럼 보이는 글은 보내기 전에 가려져요"} · 📷 펜팔 편지는 사진 없이</div>
      <button type="button" className="linkbtn" onClick={() => setPickBird((v) => !v)}>새 바꾸기 · 지금은 {getBird(bird).name} ›</button>
      {pickBird && <div style={{ display: "flex", justifyContent: "center" }}><BirdPicker value={bird} onChange={(id) => { setBird(id); setPickBird(false); }} /></div>}
      {note && <div className="small" role="status" style={{ textAlign: "center" }}>{note}</div>}
      <div className="dock">
        <button type="button" className="cta big" disabled={!msg.trim() || busy || (!!toUid && chosen === null)} onClick={send}><BirdIcon id={bird} size={34} /> {busy ? "날려 보내는 중…" : chosen && chosen !== "no" ? `${chosen.name}에게 날려 보내기` : where ? `${cityLabel(where)}의 누군가에게 날려 보내기` : "어딘가로 날려 보내기"}</button>
      </div>
    </main>
  );
}
