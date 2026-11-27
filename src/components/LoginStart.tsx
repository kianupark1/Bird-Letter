"use client";
import { lastLogin, type LoginKind as LastKind } from "@/lib/lastLogin";
import { openAppOrStore } from "@/lib/openApp";
import Link from "next/link";
import { useEffect, useState } from "react";
import PhoneLogin from "@/components/PhoneLogin";
import { PHONE_LOGIN_READY } from "@/lib/firebase/phone";
import { CuteArt } from "@/components/CuteBird";
import { linkAccount, type LoginKind } from "@/lib/firebase/link";
import { KAKAO_LOGIN_READY, startKakaoLogin } from "@/lib/firebase/kakao";
import { NAVER_LOGIN_READY, startNaverLogin } from "@/lib/firebase/naver";
import { birdSlot, useRandomBird } from "@/lib/randomBird";
import { addToHome, markJustJoined, useInstall } from "@/lib/install";
import { STORE } from "@/lib/release";
import { storeFor, type StoreBtn } from "../../core/storeLinks";
import TrialLetter from "@/components/TrialLetter";
import { readTrialDraft } from "@/lib/trialDraft";
import { track } from "@/lib/funnel";
import { START_LINES, startLine } from "../../core/fun";

/**
 * 처음 열었을 때의 화면(시안 ⑫). 버튼 한 번이 곧 가입이에요(2026-10-26 대표님: "카카오로 가입하기·구글로·애플로·휴대폰 번호로, 원클릭으로 쉽게"):
 * 가입 양식·비밀번호 없음, 이름은 카카오·구글·애플에서 받아 와요. 이미 가입한 사람도 같은 버튼으로 바로 들어와요.
 * 네이버는 서버 연결이 끝나면 여기에 추가해요.
 */
const SEEN_KEY = "saepyeonji.seenStart.v1";
const isFirstVisit = () => { try { return !localStorage.getItem(SEEN_KEY); } catch { return false; } };
const markVisited = () => { try { localStorage.setItem(SEEN_KEY, "1"); } catch {} };

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
  // 가입 없이 먼저 써 보기(홈 첫 화면에서만, 초대받아 온 사람·다른 화면은 그대로): start → write(편지 쓰기) → join(가입하면 바로 날아가요)
  const trialOk = !inviter && !next;
  // 첫 화면 말풍선: 열 때마다 새 한마디(core/fun.ts)
  const [bubble, setBubble] = useState(START_LINES[0]);
  useEffect(() => { setBubble(startLine(Math.random() * 1000)); }, []);
  const [stage, setStage] = useState<"start" | "write" | "join">("start");
  useEffect(() => {
    if (!trialOk) return;
    // 이미 로그인한 사람도 확인이 끝나기 전 잠깐 이 화면이 스쳐 가요 → 2.5초 넘게 머문 사람만 세요(2026-11-25: 첫 화면 49인데 써 보기 0이라 숫자가 부풀려짐)
    const seen = window.setTimeout(() => track("start_view"), 2500);
    // 소개 페이지·광고의 [설치 없이 지금 편지 써 보기](/?try=1)는 편지 쓰기 화면으로 바로
    // 2026-11-27: 첫 화면 18명 중 [써 보기]를 누른 사람 0 → 이 폰에서 처음 온 사람은 버튼 없이 편지 쓰기 화면부터(가입·로그인은 '이미 가입했어요'로)
    if (new URLSearchParams(location.search).get("try") === "1") { track("trial_open"); setStage("write"); }
    else if (isFirstVisit()) { track("trial_auto"); setStage("write"); }
    return () => window.clearTimeout(seen);
  }, [trialOk]);
  const afterJoin = () => (stage === "join" && readTrialDraft() ? "/send?draft=1" : undefined);
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
    markVisited();
    if (kind === "kakao") {
      if (!KAKAO_LOGIN_READY) { setMsg("카카오 로그인이 아직 준비되지 않았어요."); return; }
      markJustJoined(); // 돌아오면 "홈 화면에 추가할까요?"를 한 번 물어요(취소하고 돌아오면 로그인 화면이라 안 보여요)
      startKakaoLogin(afterJoin() ?? next ?? "/"); // 카카오 화면으로 갔다가 돌아오면 홈으로
      return;
    }
    if (kind === "naver") {
      if (!NAVER_LOGIN_READY) { setMsg("네이버 로그인이 아직 준비되지 않았어요."); return; }
      markJustJoined();
      startNaverLogin(afterJoin() ?? next ?? "/");
      return;
    }
    setBusy(kind);
    const r = await linkAccount(kind);
    setBusy(null);
    if (r.ok) { markJustJoined(); const go2 = afterJoin(); if (go2) window.location.assign(go2); else onDone(); }
    else setMsg(r.message);
  }

  // 지난번에 이 폰에서 들어온 방법(같은 사람이 다른 버튼으로 또 가입해 계정이 둘이 되지 않게)
  const [last, setLast] = useState<LastKind | null>(null);
  useEffect(() => { setLast(lastLogin()?.kind ?? null); }, []);
  const badge = (k: LastKind) => (last === k ? <span className="lastbadge">지난번에 이걸로 들어왔어요</span> : null);

  if (trialOk && stage === "write") return <TrialLetter onReady={() => { track("trial_ready"); setStage("join"); }} onBack={() => { markVisited(); setStage("start"); }} />;

  return (
    <main className="start">
      <div className="start-hero">
        <div className="bubble">{bubble}</div>
        {/* 첫 화면 새는 편지를 물고 날갯짓하는 모습(2026-11-02 대표님: "새가 날아가는 그림으로") */}
        {bird ? (
          <svg viewBox="0 0 200 160" width={200} height={160} className="bob" aria-hidden><CuteArt id={bird} variant="C" letter flap /></svg>
        ) : <div style={birdSlot(200)} />}
        <h1>새 편지</h1>
        <div className="saekdong" aria-hidden />
        {inviter ? (
          <p>💌 <b>{inviter}</b>님이 당신과 편지를 주고받고 싶대요.<br />시작하면 바로 연결돼요</p>
        ) : (
          <p>새가 날아서 전하는<br />천천히 도착하는 편지</p>
        )}
      </div>
      <div className="start-btns">
        {trialOk && stage === "start" && (
          <>
            <button type="button" className="sbtn trial-go" onClick={() => { track("trial_open"); setStage("write"); }}>✉️ 가입 없이 편지 먼저 써 보기</button>
            <p className="start-or">이미 가입했거나 바로 시작하려면</p>
          </>
        )}
        {trialOk && stage === "join" && (
          <div className="trial-ready" role="status">
            <b>✉️ 편지가 준비됐어요!</b>
            <span>1초 가입하면 바로 날아가요 · 쓴 편지는 그대로 남아요</span>
            <button type="button" className="linkbtn" onClick={() => setStage("write")}>편지 고치기</button>
          </div>
        )}
        <button type="button" className="sbtn kakao" onClick={() => go("kakao")} disabled={busy !== null}>
          <span aria-hidden>💬</span> 카카오로 가입하기{badge("kakao")}
        </button>
        {/* 네이버(2026-10-28, 대표님: "어른들을 위해"): 네이버 개발자 센터 열쇠를 넣으면 보여요 */}
        {NAVER_LOGIN_READY && (
          <button type="button" className="sbtn naver" onClick={() => go("naver")} disabled={busy !== null}>
            <span aria-hidden className="naver-n">N</span> 네이버로 가입하기{badge("naver")}
          </button>
        )}
        <button type="button" className="sbtn google" onClick={() => go("google")} disabled={busy !== null}>
          {busy === "google" ? "열고 있어요…" : "구글로 가입하기"}{badge("google")}
        </button>
        {/* 애플 로그인은 아이폰에서만: 다른 로그인(카카오·구글)을 주는 아이폰 앱은 애플 규칙(4.8)상 애플 로그인도 있어야 해요 */}
        {isIos && (
          <button type="button" className="sbtn apple" onClick={() => go("apple")} disabled={busy !== null}>
            {busy === "apple" ? "열고 있어요…" : "애플로 가입하기"}{badge("apple")}
          </button>
        )}
        {PHONE_LOGIN_READY && (
          <button type="button" className="sbtn phone" onClick={() => setPhoneOn(true)} disabled={busy !== null}>
            <span aria-hidden>📱</span> 휴대폰 번호로 가입하기{badge("phone")}
          </button>
        )}
        {phoneOn && <PhoneLogin title="휴대폰 번호로 가입하기" onClose={() => setPhoneOn(false)} onDone={() => { setPhoneOn(false); markJustJoined(); onDone(); }} />}
        <p className="start-one">누르면 바로 가입 끝 · 양식·비밀번호 없어요<br />이미 가입했다면 같은 버튼으로 바로 들어와요</p>
        {msg && <p className="start-msg" role="alert">{msg}</p>}
        {(canHome || phone) && (
          <div className="start-opts">
            {phone && (store ? (
              <a className="sopt o-store" href={store.url} onClick={(e) => openAppOrStore(e, store.url)}><span aria-hidden>📲</span> {store.label.replace("에서 앱 받기", "")}에서 받기</a>
            ) : (
              <button type="button" className="sopt o-store" onClick={() => setSoon(true)}>
                <span aria-hidden>📲</span> {phone === "ios" ? "앱스토어" : "구글 플레이"}에서 받기
              </button>
            ))}
            {/* 스토어에 나온 뒤에는 앱 받기가 먼저, 홈 화면 추가는 그 옆(안 나왔으면 홈 화면 추가가 먼저) */}
            {canHome && (
              <button type="button" className="sopt o-home" style={store ? undefined : { order: -1 }} onClick={addToHome}>
                <span aria-hidden>🏠</span> 홈 화면에 추가
              </button>
            )}
          </div>
        )}
        {soon && (
          <p className="start-msg" role="status" style={{ color: "var(--text)", opacity: 0.85 }}>
            {phone === "ios" ? "앱스토어" : "구글 플레이"} 출시를 준비하고 있어요. 곧 나와요!<br />
            {canHome ? "그동안은 ‘홈 화면에 추가’하면 앱처럼 쓸 수 있어요." : "그동안은 여기서 바로 시작해 쓸 수 있어요."}
          </p>
        )}
        <p className="start-fine">
          {!NAVER_LOGIN_READY && <span className="beta-only">네이버는 곧 추가돼요<br /></span>}
          가입하면 <Link href="/terms">이용약관</Link>과 <Link href="/privacy">개인정보 처리방침</Link>에 동의한 것으로 봐요 · 만 14세 이상
        </p>
      </div>
    </main>
  );
}
