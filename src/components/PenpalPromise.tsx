"use client";
import Link from "next/link";
import { useState } from "react";

/** 지금 펜팔 약속 판. 바꾸면 모두 다시 동의해요 */
export const PENPAL_RULES_V = 2;
export const penpalOk = (p: { penpalAgreed?: boolean; penpalRulesV?: number }) => !!p.penpalAgreed && (p.penpalRulesV ?? 0) >= PENPAL_RULES_V;

/**
 * 펜팔 약속(2026-11-27, 애플 1.2 "이용약관(EULA)에 동의하고, 불쾌한 글·괴롭힘에 무관용임을 분명히").
 * 펜팔 편지를 처음 보내거나 받기 전에 한 번 보여요.
 */
export default function PenpalPromise({ city, myName, onAgree, compact }: { city?: string; myName?: string; onAgree: () => void; compact?: boolean }) {
  const [age, setAge] = useState(false);
  const [terms, setTerms] = useState(false);
  return (
    <div className="pppromise">
      {!compact && <h2 className="friendh">펜팔 약속 (처음 한 번)</h2>}
      <ul className="pprules">
        <li><span aria-hidden>🎂</span>만 14세 이상만 쓸 수 있어요</li>
        <li><span aria-hidden>⛔</span><span><b>욕설·괴롭힘·성적인 글과 사진은 절대 안 돼요</b><small>한 번이라도 어기면 바로 편지를 지우고 이용을 멈춰요(무관용)</small></span></li>
        <li><span aria-hidden>🙊</span><span>전화번호·주소·SNS 아이디는 적지 않아요<small>연락처와 나쁜 말은 자동으로 가려져요</small></span></li>
        <li><span aria-hidden>🚩</span><span>불쾌하면 바로 신고·차단해요<small>신고는 24시간 안에 확인해서 처리해요</small></span></li>
        {city && <li><span aria-hidden>📍</span><span>상대에게는 &quot;{city}&quot;까지만 보여요{myName && <small>펜팔 이름: {myName}</small>}</span></li>}
      </ul>
      <label className="ppage"><input type="checkbox" checked={age} onChange={(e) => setAge(e.target.checked)} /> 저는 만 14세 이상이에요</label>
      <label className="ppage"><input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} /> <span><Link href="/terms" target="_blank" style={{ textDecoration: "underline" }}>이용약관</Link>과 위 약속에 동의해요</span></label>
      <button type="button" className="cta big" disabled={!age || !terms} onClick={onAgree} style={{ width: "100%", marginTop: 8 }}>약속하고 시작하기</button>
    </div>
  );
}
