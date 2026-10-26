"use client";
import { useState } from "react";
import { maskPhone, toE164 } from "../../core/phone";
import { confirmCode, sendCode } from "@/lib/firebase/phone";

/** 휴대폰 번호로 시작·받기 시트: 번호 → 문자로 온 6자리 → 끝. 번호는 로그인 확인에만 써요 */
export default function PhoneLogin({ title, onDone, onClose }: { title: string; onDone: (switched: boolean) => void; onClose: () => void }) {
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const e164 = toE164(phone);

  const send = async () => {
    if (!e164) { setMsg("010으로 시작하는 휴대폰 번호를 넣어 주세요."); return; }
    setBusy(true); setMsg("");
    const r = await sendCode(e164, "phone-recaptcha");
    setBusy(false);
    if (r.ok) setSent(e164); else setMsg(r.message);
  };
  const confirm = async () => {
    if (!/^\d{6}$/.test(code.trim())) { setMsg("문자로 온 6자리 숫자를 넣어 주세요."); return; }
    setBusy(true); setMsg("");
    const r = await confirmCode(code);
    setBusy(false);
    if (r.ok) onDone(r.switched); else setMsg(r.message);
  };

  return (
    <>
      <button type="button" className="ch-dim" aria-label="닫기" onClick={onClose} />
      <div className="ch-sheet phonesheet" role="dialog" aria-label={title}>
        <h2>{title}</h2>
        {!sent ? (
          <>
            <label className="small" htmlFor="phone-in">휴대폰 번호</label>
            <input id="phone-in" className="phone-in" type="tel" inputMode="tel" autoComplete="tel" placeholder="010-1234-5678" value={phone}
              onChange={(e) => setPhone(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") void send(); }} />
            <button type="button" className="cta big" disabled={busy || !phone.trim()} onClick={() => void send()}>{busy ? "보내는 중…" : "인증번호 받기"}</button>
          </>
        ) : (
          <>
            <p className="small" style={{ margin: 0 }}>{maskPhone(sent)}(으)로 보낸 6자리 숫자를 넣어 주세요</p>
            <input className="phone-in" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="123456" value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} onKeyDown={(e) => { if (e.key === "Enter") void confirm(); }} />
            <button type="button" className="cta big" disabled={busy || code.length < 6} onClick={() => void confirm()}>{busy ? "확인 중…" : "확인"}</button>
            <button type="button" className="linkbtn" disabled={busy} onClick={() => { setSent(null); setCode(""); }}>번호 다시 넣기</button>
          </>
        )}
        {msg && <p className="small" role="alert" style={{ margin: 0, color: "var(--dahong)" }}>{msg}</p>}
        <p className="small" style={{ margin: 0, opacity: .75 }}>번호는 로그인 확인에만 써요. 친구나 다른 사람에게 보이지 않아요.</p>
        <div id="phone-recaptcha" />
      </div>
    </>
  );
}
