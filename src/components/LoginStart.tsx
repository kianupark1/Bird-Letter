"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import PhoneLogin from "@/components/PhoneLogin";
import { PHONE_LOGIN_READY } from "@/lib/firebase/phone";
import BirdIcon from "@/components/BirdIcon";
import { linkAccount, type LoginKind } from "@/lib/firebase/link";
import { KAKAO_LOGIN_READY, startKakaoLogin } from "@/lib/firebase/kakao";
import { birdSlot, useRandomBird } from "@/lib/randomBird";
import { addToHome, markJustJoined, useInstall } from "@/lib/install";
import { STORE } from "@/lib/release";
import { storeFor, type StoreBtn } from "../../core/storeLinks";

/**
 * 처음 열었을 때의 화면(시안 ⑫). 버튼 한 번이 곧 가입이에요(2026-10-26 대표님: "카카오로 가입하기·구글로·애플로·휴대폰 번호로, 원클릭으로 쉽게"):
 * 가입 양식·비밀번호 없음, 이름은 카카오·구글·애플에서 받아 와요. 이미 가입한 사람도 같은 버튼으로 바로 들어와요.
 * 네이버는 서버 연결이 끝나면 여기에 추가해요.
 */
export default function LoginStart({ onDone, inviter, next }: { onDone: () => void; inviter?: string; /** 카카오 로그인이 끝난 뒤 돌아올 주소(기본은 홈) */ next?: string }) {
  const [busy, setBusy] = useState<LoginKind | null>(null);
  const [msg, setMsg] = useState("");
  const bird = useRandomBird();
  // 아래 빈자리의 작은 버튼 두 개: 홈 화면에 추가(안드로이드 크롬은 한 번에, 아이폰은 방법 안내) · 스토어에서 앱 받기(출시 뒤)
  const { env } = useInstall();
  const [store, setStore] = useState<StoreBtn | null>(null);
  const [isIos, setIsIos] = useState(false);
  // 폰이면 스토어 버튼은 항상 보여요. 스토어에 올라가기 전에는 누르면 "곧 나와요" 안내(그동안은 홈 화면에 추가)
  const [phone, setPhone] = useState<"ios" | "android" | null>(null);
  const [soon, setSoon] = useState(false);
  const [phoneOn, setPhoneOn] = useState(false);
  useEffect(() => {
    const ua = navigator.userAgent;
    setStore(storeFor(ua, STORE, "start"));
    setIsIos(/iphone|ipad|ipod|macintosh/i.test(ua));
    const inApp = /SaePyeonjiApp/.test(ua) || !!(window as unknown as { Capacitor?: unknown }).Capacitor;
    setPhone(inApp ? null : /android/i.test(ua) ? "android" : /iphone|ipad|ipod/i.test(ua) ? "ios" : null);
  }, []);
  const canHome = env !== "checking" && env !== "installed" && env !== "desktop" && !(window as unknown as { Capacitor?: unknown }).Capacitor;

  useEffect(() => {
    document.body.dataset.hideNav = "1"; // 이 화면에서는 하단 메뉴를 숨겨요
    return () => { delete document.body.dataset.hideNav; };
  }, []);

  async function go(kind: LoginKind) {
    setMsg("");
    if (kind === "kakao") {
      if (!KAKAO_LOGIN_READY) { setMsg("카카오 로그인이 아직 준비되지 않았어요."); return; }
      markJustJoined(); // 돌아오면 "홈 화면에 추가할까요?"를 한 번 물어요(취소하고 돌아오면 로그인 화면이라 안 보여요)
      startKakaoLogin(next ?? "/"); // 카카오 화면으로 갔다가 돌아오면 홈으로
      return;
    }
    setBusy(kind);
    const r = await linkAccount(kind);
    setBusy(null);
    if (r.ok) { markJustJoined(); onDone(); }
    else setMsg(r.message);
  }

  return (
    <main className="start">
      <div className="start-hero">
        <div className="bubble">짹짹! 반가워요 🌤</div>
        {bird ? <BirdIcon id={bird} size={200} letter className="bob" /> : <div style={birdSlot(200)} />}
        <h1>새 편지</h1>
        <div className="saekdong" aria-hidden />
        {inviter ? (
          <p><b>{inviter}</b>님이 편지 친구로 초대했어요.<br />시작하면 바로 연결돼요</p>
        ) : (
          <p>새가 날아서 전하는<br />천천히 도착하는 편지</p>
        )}
      </div>
      <div className="start-btns">
        <button type="button" className="sbtn kakao" onClick={() => go("kakao")} disabled={busy !== null}>
          <span aria-hidden>💬</span> 카카오로 가입하기
        </button>
        <button type="button" className="sbtn google" onClick={() => go("google")} disabled={busy !== null}>
          {busy === "google" ? "열고 있어요…" : "구글로 가입하기"}
        </button>
        {/* 애플 로그인은 아이폰에서만: 다른 로그인(카카오·구글)을 주는 아이폰 앱은 애플 규칙(4.8)상 애플 로그인도 있어야 해요 */}
        {isIos && (
          <button type="button" className="sbtn apple" onClick={() => go("apple")} disabled={busy !== null}>
            {busy === "apple" ? "열고 있어요…" : "애플로 가입하기"}
          </button>
        )}
        {PHONE_LOGIN_READY && (
          <button type="button" className="sbtn phone" onClick={() => setPhoneOn(true)} disabled={busy !== null}>
            <span aria-hidden>📱</span> 휴대폰 번호로 가입하기
          </button>
        )}
        {phoneOn && <PhoneLogin title="휴대폰 번호로 가입하기" onClose={() => setPhoneOn(false)} onDone={() => { setPhoneOn(false); markJustJoined(); onDone(); }} />}
        <p className="start-one">누르면 바로 가입 끝 · 양식·비밀번호 없어요<br />이미 가입했다면 같은 버튼으로 바로 들어와요</p>
        {msg && <p className="start-msg" role="alert">{msg}</p>}
        {(canHome || phone) && (
          <div className="start-opts">
            {canHome && (
              <button type="button" className="sopt o-home" onClick={addToHome}>
                <span aria-hidden>🏠</span> 홈 화면에 추가
              </button>
            )}
            {phone && (store ? (
              <a className="sopt o-store" href={store.url}><span aria-hidden>📲</span> {store.label.replace("에서 앱 받기", "")}에서 받기</a>
            ) : (
              <button type="button" className="sopt o-store" onClick={() => setSoon(true)}>
                <span aria-hidden>📲</span> {phone === "ios" ? "앱스토어" : "구글 플레이"}에서 받기
              </button>
            ))}
          </div>
        )}
        {soon && (
          <p className="start-msg" role="status" style={{ color: "var(--text)", opacity: 0.85 }}>
            {phone === "ios" ? "앱스토어" : "구글 플레이"} 출시를 준비하고 있어요. 곧 나와요!<br />
            {canHome ? "그동안은 ‘홈 화면에 추가’하면 앱처럼 쓸 수 있어요." : "그동안은 여기서 바로 시작해 쓸 수 있어요."}
          </p>
        )}
        <p className="start-fine">
          네이버는 곧 추가돼요<br />
          가입하면 <Link href="/terms">이용약관</Link>과 <Link href="/privacy">개인정보 처리방침</Link>에 동의한 것으로 봐요 · 만 14세 이상
        </p>
      </div>
    </main>
  );
}
