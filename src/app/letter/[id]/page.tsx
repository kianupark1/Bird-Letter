"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import JourneyMap from "@/components/JourneyMap";
import { getBird } from "@/lib/birds";
import { getRoute } from "@/lib/routes";
import { formatMinutes } from "@/lib/geo";
import { letterProgress, useLetters, useNow, type Letter } from "@/lib/letters";
import { ensureUser } from "@/lib/firebase/client";
import * as remote from "@/lib/firebase/remote";

const clock = (ms: number) => new Date(ms).toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit" });

/** 링크로 들어온 받는 사람의 화면에 필요한 정보 */
type Incoming = { state: "loading" } | { state: "missing" } | { state: "ok"; meta: remote.Meta };

export default function LetterPage() {
  const { id } = useParams<{ id: string }>();
  const { letters, ready, backend, fastForward } = useLetters();
  const now = useNow(5000);
  const [demo, setDemo] = useState(false);
  const [incoming, setIncoming] = useState<Incoming>({ state: "loading" });
  const [body, setBody] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const mine = letters.find((l) => l.id === id);

  // 주소 끝에 ?demo=1을 붙였을 때만 "빨리 감기"를 보여준다(일반 사용자에게는 숨김, 내 폰 저장 상태에서만 동작)
  useEffect(() => {
    setDemo(new URLSearchParams(window.location.search).has("demo"));
  }, []);

  // 내가 보낸 편지가 아니면, 링크로 받은 편지로 보고 서버에서 불러온다(처음 연 사람은 받는 사람으로 등록)
  useEffect(() => {
    if (!ready || backend !== "firebase" || mine) return;
    let off = false;
    (async () => {
      const meta = await remote.getMeta(id);
      if (off) return;
      if (!meta) return setIncoming({ state: "missing" });
      const user = await ensureUser();
      if (meta.fromUid !== user.uid && !meta.recipientUid) {
        try {
          await remote.claim(id);
          meta.recipientUid = user.uid;
        } catch {}
      }
      if (!off) setIncoming({ state: "ok", meta });
    })();
    return () => {
      off = true;
    };
  }, [ready, backend, mine, id]);

  const meta = incoming.state === "ok" ? incoming.meta : null;
  const view: (Letter & { fromName?: string; fromUid?: string }) | null = mine
    ? mine
    : meta
      ? { id: meta.id, to: meta.toName, routeId: meta.routeId, birdId: meta.birdId, message: body ?? "", sentAt: meta.sentAt, arriveAt: meta.arriveAt, fromName: meta.fromName, fromUid: meta.fromUid }
      : null;
  const isRecipient = !mine && !!meta;
  const arrivedNow = view ? letterProgress(view, now).done : false;

  // 받는 사람은 도착 시각이 지난 뒤에만 서버가 내용을 줌
  useEffect(() => {
    if (!isRecipient || !arrivedNow || body !== null) return;
    remote.getBody(id).then((m) => m !== null && setBody(m));
  }, [isRecipient, arrivedNow, body, id]);

  if (!ready || (!mine && backend === "firebase" && incoming.state === "loading"))
    return (
      <main className="app">
        <div className="empty" role="status">편지를 불러오는 중이에요...</div>
      </main>
    );
  if (!view)
    return (
      <main className="app">
        <div className="empty">편지를 찾을 수 없어요.</div>
        <Link href="/" className="ghost">홈으로</Link>
      </main>
    );

  const bird = getBird(view.birdId);
  const route = getRoute(view.routeId);
  const pr = letterProgress(view, now);
  const remainMin = Math.max(1, Math.ceil(pr.total - pr.elapsed));
  const last = route.points.length - 1;
  const nextIdx = route.points.findIndex((_, i) => pr.p < i / last);
  const arriveAt = view.arriveAt ?? view.sentAt + pr.total * 60000;
  const dest = route.title.split("→")[1].trim();

  const share = async () => {
    const url = `${location.origin}/letter/${view.id}`;
    try {
      if (navigator.share) await navigator.share({ title: "새 편지가 날아가고 있어요", text: `${bird.name}가 편지를 물고 날아가고 있어요.`, url });
      else {
        await navigator.clipboard.writeText(url);
        setNotice("링크를 복사했어요. 받는 사람에게 붙여넣어 보내 주세요.");
      }
    } catch {}
  };
  const report = async () => {
    if (!window.confirm("이 편지를 신고할까요? 운영자가 확인해요.")) return;
    try {
      await remote.reportLetter(view.id, "사용자 신고");
      setNotice("신고가 접수됐어요.");
    } catch {
      setNotice("신고하지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
  };
  const block = async () => {
    if (!view.fromUid || !window.confirm("이 사람을 차단할까요? 앞으로 이 사람의 편지는 받은 편지함에 보이지 않아요.")) return;
    try {
      await remote.blockSender(view.fromUid);
      setNotice("차단했어요.");
    } catch {
      setNotice("차단하지 못했어요. 잠시 후 다시 시도해 주세요.");
    }
  };

  return (
    <main className="app">
      <h1>{isRecipient ? `${view.fromName || "누군가"}가 보낸 편지` : `${view.to}에게 가는 편지`}</h1>
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
          <div className="paper">{view.message || (isRecipient ? "편지를 펼치는 중..." : "")}</div>
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
              const at = view.sentAt + pr.total * (i / last) * 60000;
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
          {isRecipient && <div className="small" style={{ textAlign: "center" }}>편지는 도착 시각이 지나야 열려요.</div>}
          {demo && backend === "local" && (
            <button className="linkbtn" onClick={() => fastForward(view.id, Math.max(5, Math.ceil(pr.total / 4)))}>
              데모: 시간 빨리 감기
            </button>
          )}
        </>
      )}

      {backend === "firebase" && !isRecipient && (
        <button className="ghost" onClick={share}>받는 사람에게 링크 보내기</button>
      )}
      {isRecipient && (
        <div style={{ display: "flex", gap: 8 }}>
          <button className="ghost" onClick={report}>신고하기</button>
          <button className="ghost" onClick={block}>이 사람 차단</button>
        </div>
      )}
      {notice && <div className="small" role="status" style={{ textAlign: "center" }}>{notice}</div>}
      <Link href="/" className="ghost">홈으로</Link>
    </main>
  );
}
