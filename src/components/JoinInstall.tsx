"use client";
import { useEffect, useState } from "react";
import BirdIcon from "@/components/BirdIcon";
import { addToHome, clearJustJoined, justJoined, useInstall } from "@/lib/install";
import { useSession } from "@/lib/session";

/**
 * 가입하자마자 한 번: "홈 화면에 새 편지를 놓아 둘까요?" 버튼 하나로 끝(안드로이드 크롬은 폰 설치 창, 아이폰·카톡 안은 방법 안내).
 * 스토어 앱 안·이미 설치한 폰·컴퓨터에서는 안 보여요.
 */
// 오방색 꽃가루(왼쪽, 위, 색, 기울기)
const CONFETTI: [string, string, string, string][] = [
  ["4px", "18px", "var(--dahong)", "20deg"], ["26px", "70px", "var(--hwangto)", "-15deg"], ["150px", "10px", "var(--cheongrok)", "35deg"],
  ["168px", "64px", "var(--namsaek)", "-30deg"], ["40px", "0px", "var(--namsaek)", "10deg"], ["132px", "86px", "var(--dahong)", "50deg"],
  ["10px", "92px", "var(--cheongrok)", "-40deg"], ["160px", "38px", "var(--hwangto)", "25deg"],
];

export default function JoinInstall() {
  const { state } = useSession();
  const { env } = useInstall();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (state !== "ready" || env === "checking") return;
    if (!justJoined()) return;
    if (env === "installed" || env === "desktop") { clearJustJoined(); return; }
    setOpen(true);
  }, [state, env]);
  if (!open) return null;
  const close = () => { clearJustJoined(); setOpen(false); };
  const add = async () => {
    close();
    addToHome();
  };
  return (
    <>
      <button type="button" className="ch-dim" aria-label="닫기" onClick={close} />
      <div className="ch-sheet joinsheet" role="dialog" aria-label="홈 화면에 추가">
        <div className="saekdong" aria-hidden />
        <div className="confetti" aria-hidden>
          {CONFETTI.map(([x, y, c, r], i) => <i key={i} style={{ left: x, top: y, background: c, ["--r" as string]: r }} />)}
          <BirdIcon id="magpie" size={96} letter className="bob" />
        </div>
        <h2>가입 끝! 반가워요 🎉</h2>
        <p className="small">홈 화면에 새 편지를 놓아 두면 앱처럼 한 번에 열리고, 편지가 도착하면 알려 줘요</p>
        <button type="button" className="sbtn home" onClick={() => void add()}><span aria-hidden>🏠</span> 홈 화면에 추가하기</button>
        <button type="button" className="sheetbtn plain" onClick={close}>나중에</button>
      </div>
    </>
  );
}
