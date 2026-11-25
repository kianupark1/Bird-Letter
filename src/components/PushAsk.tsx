"use client";
import { useEffect, useState } from "react";
import { detectState, enablePush } from "@/lib/push";
import { track } from "@/lib/funnel";
import { requestHello } from "@/lib/helloLetter";

/**
 * 편지를 보낸 직후 한 번만 "도착하면 알려 드릴까요?"(2026-11-24 대표님 "셋 다 해": 다시 오게 만들기).
 * 보낸 화면·대화방에서 "saepyeonji:sent" 신호가 오면, 알림이 아직 꺼져 있고(켤 수 있는 상태) 사흘 안에 묻지 않았을 때만 아래에서 올라와요.
 */
export const SENT_EVENT = "saepyeonji:sent";
const KEY = "saepyeonji.pushAsk.v1";
const GAP_MS = 3 * 86400000;

export function announceSent() {
  try { window.dispatchEvent(new Event(SENT_EVENT)); } catch {}
}

export default function PushAsk() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    const on = async () => {
      try { if (Date.now() - Number(localStorage.getItem(KEY) || 0) < GAP_MS) return; } catch {}
      if ((await detectState()) !== "default") return;
      try { localStorage.setItem(KEY, String(Date.now())); } catch {}
      track("push_ask");
      setTimeout(() => setOpen(true), 1200); // 날아가는 연출을 먼저 보고
    };
    window.addEventListener(SENT_EVENT, on);
    return () => window.removeEventListener(SENT_EVENT, on);
  }, []);
  if (!open) return null;
  const turnOn = async () => {
    setBusy(true);
    const s = await enablePush();
    setBusy(false);
    if (s === "enabled") { track("push_on"); void requestHello(true); setMsg("좋아요! 도착하면 짹짹 알려 드릴게요 🕊"); setTimeout(() => setOpen(false), 1800); }
    else if (s === "denied") setMsg("알림이 막혀 있어요. 폰 설정에서 새편지 알림을 켜 주세요.");
    else setOpen(false);
  };
  return (
    <div className="pushask" role="dialog" aria-label="도착 알림">
      <div className="pushask-card">
        <b>🔔 편지가 도착하면 알려 드릴까요?</b>
        <span>답장이 날아올 때도, 새가 절반쯤 왔을 때도 알려 드려요.</span>
        {msg ? <p className="pushask-msg" role="status">{msg}</p> : (
          <>
            <button type="button" className="sbtn trial-go" onClick={() => void turnOn()} disabled={busy}>{busy ? "켜는 중…" : "🔔 알림 받기"}</button>
            <button type="button" className="linkbtn" onClick={() => setOpen(false)}>다음에</button>
          </>
        )}
      </div>
    </div>
  );
}
