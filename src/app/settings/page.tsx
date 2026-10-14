"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { placesByRegion } from "../../../core/places";
import { LETTERS_KEY, ONBOARDED_KEY, SAMPLE_INBOX, useLetters } from "@/lib/letters";
import { useProfile, type Profile } from "@/lib/settings";
import * as remote from "@/lib/firebase/remote";
import { PUSH_CONFIGURED, sendTestPush, showLocalTest, usePushState } from "@/lib/push";
import { openInstallGuide } from "@/lib/install";
import { playChirp } from "@/lib/chirp";
import { IS_TOSS } from "@/lib/target";
import { LOGINS, linkAccount, linkedKinds, unlinkAccount, type LoginKind } from "@/lib/firebase/link";
import { auth, firebaseEnabled } from "@/lib/firebase/client";
import { isKakaoLinked } from "@/lib/firebase/kakao";

type NotifyKey = keyof Profile["notify"];

const NOTIFY_ROWS: { key: NotifyKey; title: string; desc: string }[] = [
  { key: "arrival", title: "도착 알림", desc: "내 편지가 도착하면 알려줘요" },
  { key: "passing", title: "중간 지점 알림", desc: "새가 경유지를 지날 때 알려줘요" },
  { key: "reply", title: "답장 알림", desc: "받은 편지가 도착하면 알려줘요" },
];

export default function Settings() {
  const router = useRouter();
  const { letters, received, backend } = useLetters();
  const { profile, ready, update } = useProfile();
  const [msg, setMsg] = useState("");
  const [testMsg, setTestMsg] = useState("");
  const { state: push, enable: enablePush, disable: disablePush } = usePushState();

  const toggle = (key: NotifyKey) =>
    update((prev) => ({ notify: { ...prev.notify, [key]: !prev.notify[key] } }));

  const replayOnboarding = () => {
    try {
      localStorage.removeItem(ONBOARDED_KEY);
    } catch {}
    router.push("/onboarding");
  };

  const clearLetters = async () => {
    const server = backend === "firebase";
    const ask = server
      ? "서버에 저장된 내 편지와 차단 목록, 내 계정을 모두 삭제할까요? 되돌릴 수 없어요."
      : "보낸 편지를 모두 지울까요? 되돌릴 수 없어요.";
    if (!window.confirm(ask)) return;
    try {
      if (server) await remote.deleteMyData();
      localStorage.removeItem(LETTERS_KEY);
    } catch {
      setMsg("삭제하지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.");
      return;
    }
    setMsg(server ? "내 편지와 데이터를 모두 삭제했어요." : "보낸 편지를 모두 지웠어요.");
    setTimeout(() => window.location.assign("/"), 900);
  };

  if (!ready) return <main className="app" />;

  const initial = (profile.nickname.trim() || "새").slice(0, 1);

  return (
    <main className="app">
      <h1>설정</h1>

      <div className="profilecard">
        <div className="avatar" aria-hidden>{initial}</div>
        <div className="grow">
          <input
            className="nick"
            aria-label="닉네임"
            value={profile.nickname}
            maxLength={12}
            placeholder="닉네임"
            onChange={(e) => update({ nickname: e.target.value })}
          />
          <div className="small">닉네임을 눌러서 바꿀 수 있어요</div>
        </div>
      </div>

      <div className="stats">
        <div><b>{letters.length}</b><span>보낸 편지</span></div>
        <div>
          <b>{backend === "firebase" ? received.length : SAMPLE_INBOX.length}</b>
          <span>{backend === "firebase" ? "받은 편지" : "받은 편지(예시)"}</span>
        </div>
      </div>

      <h2>내가 있는 곳</h2>
      <div className="list">
        <label className="listrow" htmlFor="home-place">
          <div className="grow">
            <div className="name">편지를 보낼 때 출발하는 곳</div>
            <div className="note">새가 여기서 날아가요. 편지 쓸 때 바꿀 수도 있어요.</div>
          </div>
          <select id="home-place" className="field" style={{ width: "auto", margin: 0 }} value={profile.homePlace} onChange={(e) => update({ homePlace: e.target.value })}>
            {placesByRegion().map((g) => (
              <optgroup key={g.region} label={g.region}>
                {g.places.map((pl) => <option key={pl.id} value={pl.id}>{pl.name}</option>)}
              </optgroup>
            ))}
          </select>
        </label>
      </div>

      <h2>알림</h2>
      <div className="list">
        {NOTIFY_ROWS.map((r) => (
          <div key={r.key} className="listrow">
            <div className="grow">
              <div className="name">{r.title}</div>
              <div className="note">{r.desc}</div>
            </div>
            <button
              role="switch"
              aria-checked={profile.notify[r.key]}
              aria-label={r.title}
              className="switch"
              onClick={() => toggle(r.key)}
            />
          </div>
        ))}
        <div className="listrow">
          <div className="grow">
            <div className="name">새 짹짹 소리</div>
            <div className="note">앱이 열려 있을 때 알림과 함께 새가 짹짹여요. <button className="linkbtn" style={{ display: "inline", margin: "0 0 0 4px", padding: 0, minHeight: 0, opacity: 1 }} onClick={() => playChirp()}>들어보기</button></div>
          </div>
          <button
            role="switch"
            aria-checked={profile.chirp}
            aria-label="새 짹짹 소리"
            className="switch"
            onClick={() => update({ chirp: !profile.chirp })}
          />
        </div>
      </div>
      <div className="small">
        앱을 열어 둔 동안에는 귀여운 팝업으로 알려줘요.{!IS_TOSS && " 앱을 닫아도 받으려면 아래 스위치를 켜 주세요."}
      </div>
      {!IS_TOSS && (
        <div className="list">
          <div className="listrow">
            <div className="grow">
              <div className="name">앱을 닫아도 알림 받기</div>
              <div className="note">
                {push === "enabled" ? "켜져 있어요. 편지가 도착하면 폰으로 알려줘요."
                  : !PUSH_CONFIGURED ? "준비 중이에요."
                  : push === "unsupported" ? "이 기기·브라우저에서는 쓸 수 없어요."
                  : push === "needs-install" ? "아이폰은 ‘홈 화면에 추가’한 앱에서 켤 수 있어요."
                  : push === "denied" ? "브라우저(폰 설정)에서 알림이 막혀 있어요."
                  : "꺼 둔 사이에 도착해도 알려줘요."}
              </div>
            </div>
            {PUSH_CONFIGURED && push === "needs-install" && (
              <button className="chip" onClick={openInstallGuide}>설치 방법</button>
            )}
            {PUSH_CONFIGURED && (push === "enabled" || push === "default") && (
              <button role="switch" aria-checked={push === "enabled"} aria-label="앱을 닫아도 알림 받기" className="switch" onClick={push === "enabled" ? disablePush : enablePush} />
            )}
          </div>
          {push === "enabled" && (
            <>
            <div className="listrow">
              <div className="grow">
                <div className="name">알림 시험하기</div>
                <div className="note">누른 뒤 <b>홈 화면으로 나가세요</b>. 12초쯤 뒤에 시험 알림이 와요.</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <button className="chip" onClick={async () => setTestMsg((await showLocalTest()) ? "이 폰에서 알림을 띄웠어요. 위쪽에 보이나요?" : "이 폰에서 알림을 띄우지 못했어요. 폰 설정에서 이 앱의 알림 허용을 확인해 주세요.")}>
                  이 폰에서 바로 시험
                </button>
                <button
                  className="chip"
                  onClick={async () => {
                    setTestMsg("예약하는 중이에요...");
                    const r = await sendTestPush();
                    setTestMsg(r.ok ? "예약했어요. 지금 홈 화면으로 나가세요. 12초쯤 뒤에 알림이 와요."
                      : r.reason === "server-off" ? "서버에 알림 설정이 아직 없어요(503). 개발팀에 알려 주세요."
                      : r.reason === "rejected" ? `서버가 예약을 거절했어요(오류 ${r.status}). 개발팀에 알려 주세요.`
                      : r.reason === "network" ? "인터넷 연결을 확인해 주세요."
                      : "이 폰의 알림 주소를 찾지 못했어요. 스위치를 껐다 켜 주세요.");
                  }}
                >
                  서버로 시험 알림 보내기
                </button>
              </div>
            </div>
            {testMsg && <div className="small" role="status" style={{ padding: "0 16px 12px" }}>{testMsg}</div>}
            </>
          )}
        </div>
      )}

      {firebaseEnabled && !IS_TOSS && <AccountLinks />}

      <h2>계정</h2>
      <div className="list">
        <button className="listrow action" onClick={replayOnboarding}>
          <span>온보딩 다시 보기</span><span aria-hidden>›</span>
        </button>
        <button className="listrow action danger" onClick={clearLetters}>
          <span>{backend === "firebase" ? "내 편지와 데이터 모두 삭제" : "보낸 편지 모두 지우기"}</span><span aria-hidden>›</span>
        </button>
      </div>
      {msg && <div className="small" role="status">{msg}</div>}

      <h2>정보</h2>
      <div className="list">
        <Link href="/privacy" className="listrow action">
          <span>개인정보 처리방침</span><span aria-hidden>›</span>
        </Link>
        <Link href="/terms" className="listrow action">
          <span>이용약관</span><span aria-hidden>›</span>
        </Link>
        <Link href="/policy" className="listrow action">
          <span>운영정책 · 신고 처리</span><span aria-hidden>›</span>
        </Link>
        <div className="listrow"><span>버전</span><span className="note">{IS_TOSS ? "0.1.0" : "0.1.0 (테스트)"}</span></div>
      </div>
    </main>
  );
}

/** 소셜 계정 연결: 연결하면 폰을 바꿔도 편지와 친구가 이어져요. */
function AccountLinks() {
  const [linked, setLinked] = useState<LoginKind[]>([]);
  const [busy, setBusy] = useState<LoginKind | null>(null);
  const [note, setNote] = useState("");
  useEffect(() => {
    const a = auth();
    const refresh = async (u: typeof a.currentUser) => {
      const k = u ? await isKakaoLinked() : false; // 카카오는 로그인 토큰 안의 표시(claim)로 알아요
      setLinked([...linkedKinds(u), ...(k ? (["kakao"] as LoginKind[]) : [])]);
    };
    refresh(a.currentUser);
    if (new URLSearchParams(location.search).get("linked") === "kakao") setNote("카카오 연결이 끝났어요. 폰을 바꿔도 이어서 쓸 수 있어요.");
    return a.onAuthStateChanged((u) => { refresh(u); });
  }, []);
  async function toggle(kind: LoginKind) {
    if (kind === "kakao" && linked.includes("kakao")) { setNote("카카오 연결 해제는 아직 지원하지 않아요."); return; }
    setBusy(kind);
    setNote("");
    const isLinked = linked.includes(kind);
    const r = isLinked ? await unlinkAccount(kind) : await linkAccount(kind);
    setBusy(null);
    if (!r.ok) setNote(r.message);
    else {
      if (kind !== "kakao") setLinked(linkedKinds(auth().currentUser));
      setNote(isLinked ? "연결을 해제했어요." : r.switched ? "이전에 연결한 계정으로 들어왔어요." : "연결했어요. 폰을 바꿔도 이어서 쓸 수 있어요.");
    }
  }
  return (
    <>
      <h2>계정 연결</h2>
      <div className="list">
        {LOGINS.map((l) => (
          <button
            key={l.kind}
            className="listrow action"
            disabled={!l.ready || busy !== null}
            onClick={() => toggle(l.kind)}
            aria-label={`${l.label} ${linked.includes(l.kind) ? "연결 해제" : "연결"}`}
          >
            <span>{l.label}</span>
            <span className="note">{!l.ready ? "준비 중" : linked.includes(l.kind) ? (l.kind === "kakao" ? "연결됨" : "연결됨 · 해제") : "연결하기"}</span>
          </button>
        ))}
      </div>
      <div className="small" role="status">{note || "연결하면 폰을 바꿔도 편지와 친구가 그대로 있어요."}</div>
    </>
  );
}
