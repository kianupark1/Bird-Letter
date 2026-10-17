"use client";
import { useState } from "react";
import { CHEER_LABEL, myUid, nextCheerIn, sendCheer, type Cheer, type CheerKind } from "@/lib/cheers";
import { playChirp } from "@/lib/chirp";
import { withIGa } from "@/lib/korean";
import { clockText } from "../../core/schedule";

/** 응원한 사람 이름: 나면 "내가", 상대면 "지민이" */
export function cheerWho(c: Cheer, me: string, name: string) {
  return c.uid === me ? "내가" : withIGa(name);
}

/**
 * 대화방 아래 응원 줄(시안 v6-2): [🌾 모이 주기] [🎵 노래 불러 주기], 한 시간에 한 번.
 * 응원해도 도착 시간은 그대로예요(기다림의 미학).
 */
export default function CheerBar({ letterId, birdName, name, cheers, now, sound }: { letterId: string; birdName: string; name: string; cheers: Cheer[]; now: number; sound: boolean }) {
  const [busy, setBusy] = useState(false);
  const [burst, setBurst] = useState<{ k: number; icon: string } | null>(null);
  const [note, setNote] = useState("");
  const me = myUid();
  const wait = nextCheerIn(cheers, me, now);
  const last = [...cheers].sort((a, b) => b.at - a.at)[0];
  const go = async (kind: CheerKind) => {
    if (busy || wait) return;
    setBusy(true); setNote("");
    try {
      await sendCheer(letterId, kind);
      setBurst({ k: Date.now(), icon: CHEER_LABEL[kind].icon });
      if (sound) void playChirp();
      try { navigator.vibrate?.(20); } catch {}
      setNote(`${withIGa(birdName)} 힘을 냈어요! 도착 시간은 그대로예요`);
    } catch (e) {
      setNote((e as Error).message === "hour" ? "이번 시간에는 벌써 응원했어요. 다음 시간에 또 해 주세요" : "응원을 보내지 못했어요. 인터넷을 확인해 주세요");
    }
    setBusy(false);
  };
  return (
    <div className="cheerbar">
      {last && (
        <div className="cb-log">{CHEER_LABEL[last.kind].icon} {cheerWho(last, me, name)} {birdName}에게 {CHEER_LABEL[last.kind].verb} <small>{clockText(last.at)}</small></div>
      )}
      {cheers.length > 0 && <div className="cb-sum">💪 응원 {cheers.length}번 · {withIGa(birdName)} 기분 좋게 날고 있어요</div>}
      <div className="cb-btns">
        {(["seed", "song"] as const).map((k) => (
          <button key={k} type="button" className={`cb-btn ${k === "seed" ? "hot" : ""}`} disabled={busy || wait > 0} onClick={() => void go(k)}>
            {CHEER_LABEL[k].icon} {k === "seed" ? "모이 주기" : "노래 불러 주기"}
          </button>
        ))}
        {burst && <span key={burst.k} className="cb-burst" aria-hidden>{[0, 1, 2, 3, 4].map((i) => <i key={i} style={{ left: `${30 + i * 10}%`, animationDelay: `${i * 70}ms` }}>{burst.icon}</i>)}</span>}
      </div>
      <small className="cb-note" role="status">{note || (wait ? `다음 응원은 ${wait}분 뒤에 할 수 있어요` : "한 시간에 한 번 · 응원해도 도착 시간은 그대로예요")}</small>
    </div>
  );
}
