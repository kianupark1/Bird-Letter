"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import BirdIcon from "@/components/BirdIcon";
import { linkAccount, type LoginKind } from "@/lib/firebase/link";
import { KAKAO_LOGIN_READY, startKakaoLogin } from "@/lib/firebase/kakao";

/**
 * 처음 열었을 때의 화면(시안 ⑫). 로그인이 곧 시작이에요: 카카오·구글·애플 버튼 하나로 끝, 가입 양식 없음.
 * 네이버는 서버 연결이 끝나면 여기에 추가해요.
 */
export default function LoginStart({ onDone, inviter }: { onDone: () => void; inviter?: string }) {
  const [busy, setBusy] = useState<LoginKind | null>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    document.body.dataset.hideNav = "1"; // 이 화면에서는 하단 메뉴를 숨겨요
    return () => { delete document.body.dataset.hideNav; };
  }, []);

  async function go(kind: LoginKind) {
    setMsg("");
    if (kind === "kakao") {
      if (!KAKAO_LOGIN_READY) { setMsg("카카오 로그인이 아직 준비되지 않았어요."); return; }
      startKakaoLogin("/"); // 카카오 화면으로 갔다가 돌아오면 홈으로
      return;
    }
    setBusy(kind);
    const r = await linkAccount(kind);
    setBusy(null);
    if (r.ok) onDone();
    else setMsg(r.message);
  }

  return (
    <main className="start">
      <div className="start-hero">
        <BirdIcon id="magpie" size={200} letter className="bob" />
        <h1>새 편지</h1>
        {inviter ? (
          <p><b>{inviter}</b>님이 편지 친구로 초대했어요.<br />시작하면 바로 연결돼요</p>
        ) : (
          <p>새가 날아서 전하는<br />천천히 도착하는 편지</p>
        )}
      </div>
      <div className="start-btns">
        <button type="button" className="sbtn kakao" onClick={() => go("kakao")} disabled={busy !== null}>
          <span aria-hidden>💬</span> 카카오로 시작하기
        </button>
        <button type="button" className="sbtn google" onClick={() => go("google")} disabled={busy !== null}>
          {busy === "google" ? "열고 있어요…" : "구글로 시작하기"}
        </button>
        <button type="button" className="sbtn apple" onClick={() => go("apple")} disabled={busy !== null}>
          {busy === "apple" ? "열고 있어요…" : "애플로 시작하기"}
        </button>
        {msg && <p className="start-msg" role="alert">{msg}</p>}
        <p className="start-fine">
          네이버는 곧 추가돼요<br />
          시작하면 <Link href="/terms">이용약관</Link>과 <Link href="/privacy">개인정보 처리방침</Link>에 동의한 것으로 봐요 · 만 14세 이상
        </p>
      </div>
    </main>
  );
}
