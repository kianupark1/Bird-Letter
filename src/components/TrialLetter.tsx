"use client";
import { useEffect, useState } from "react";
import BirdIcon from "@/components/BirdIcon";
import { pickableBirds, usableBird } from "@/lib/birds";
import { formatMinutes } from "@/lib/geo";
import { MAX_LETTER_CHARS } from "@/lib/limits";
import { readTrialDraft, saveTrialDraft } from "@/lib/trialDraft";
import { birdFun } from "../../core/fun";

/**
 * 첫 화면의 "가입 없이 편지 먼저 써 보기"(2026-11-24). 서버에 아무것도 보내지 않고 이 폰에만 담아 둬요.
 * [새에게 맡기기]를 누르면 onReady → 가입 버튼이 나오고, 가입하면 편지 쓰기 화면에 그대로 채워져요.
 */
export default function TrialLetter({ onReady, onBack, presetTo, replyId }: { onReady: () => void; onBack: () => void; /** 답장이면 받는 사람이 정해져 있어요 */ presetTo?: string; replyId?: string }) {
  const [to, setTo] = useState(presetTo ?? "");
  const [message, setMessage] = useState("");
  const [birdId, setBirdId] = useState("pigeon");
  const birds = pickableBirds();
  useEffect(() => {
    const d = readTrialDraft();
    if (d && (d.replyId ?? "") === (replyId ?? "")) { if (!presetTo) setTo(d.to); setMessage(d.message); setBirdId(usableBird(d.birdId)); }
  }, [presetTo, replyId]);
  const ok = message.trim().length > 0;
  const bird = birds.find((b) => b.id === birdId) ?? birds[0];

  return (
    <main className="start trial">
      {presetTo
        ? <button type="button" className="trial-back" onClick={onBack} aria-label="뒤로">‹</button>
        : <button type="button" className="trial-login" onClick={onBack}>이미 가입했어요 · 로그인</button>}
      <h1 className="trial-h">{presetTo ? `${presetTo}님에게 답장 ✉️` : "누구에게 쓸까요? ✉️"}</h1>
      <p className="trial-sub">{presetTo ? "가입 없이 먼저 써 보세요. 보낼 때만 1초 가입이에요." : <>새가 실제 거리만큼 날아가 전해 주는 편지예요 🕊<br />가입 없이 먼저 써 보세요. 보낼 때만 1초 가입이에요.</>}</p>

      {!presetTo && <>
        <label className="trial-lbl" htmlFor="trial-to">받는 사람</label>
        <input id="trial-to" className="field trial-to" value={to} onChange={(e) => setTo(e.target.value.slice(0, 20))} placeholder="예: 엄마, 오랜 친구" autoComplete="off" />
      </>}

      <label className="trial-lbl" htmlFor="trial-msg">편지</label>
      <textarea id="trial-msg" className="field trial-msg" value={message} maxLength={MAX_LETTER_CHARS}
        onChange={(e) => setMessage(e.target.value)} placeholder={"요즘 잘 지내?\n문득 생각나서 편지 써."} />

      <div className="trial-lbl">편지를 물고 갈 새 <span className="trial-note">(서울→부산이면)</span></div>
      <div className="trial-birds" role="radiogroup" aria-label="새 고르기">
        {birds.map((b) => (
          <button key={b.id} type="button" role="radio" aria-checked={b.id === birdId} className={`trial-bird${b.id === birdId ? " on" : ""}`} onClick={() => setBirdId(b.id)}>
            <BirdIcon id={b.id} size={44} />
            <b>{b.name}</b>
            <span>{formatMinutes(b.minutesSeoulBusan)}</span>
          </button>
        ))}
      </div>
      <p className="trial-wait"><b>{bird.name}</b> · {birdFun(bird.id)}<br />날아가는 동안 받는 사람도 지도에서 같이 기다려요</p>

      <button type="button" className="sbtn trial-go" disabled={!ok}
        onClick={() => { saveTrialDraft({ to: to.trim(), message, birdId, ...(replyId ? { replyId } : {}) }); onReady(); }}>
        🕊 새에게 맡기기
      </button>
      {!ok && <p className="trial-fine">한 줄만 써도 괜찮아요</p>}
    </main>
  );
}
