"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getPlace, placesByRegion } from "../../../core/places";
import { locate as findDistrict } from "../../../core/districts";
import { tryMoveHome } from "@/lib/homePlace";
import { LETTERS_KEY, ONBOARDED_KEY, SAMPLE_INBOX, useLetters } from "@/lib/letters";
import Face from "@/components/Face";
import BirdPicker from "@/components/BirdPicker";
import { compressAvatar } from "@/lib/photo";
import { FONT_SCALES, useProfile, type FontScale, type Profile } from "@/lib/settings";
import * as remote from "@/lib/firebase/remote";
import { PUSH_CONFIGURED, sendTestPush, showLocalTest, usePushState } from "@/lib/push";
import { openInstallGuide } from "@/lib/install";
import { playChirp } from "@/lib/chirp";
import { getBird } from "@/lib/birds";
import { IS_TOSS } from "@/lib/target";
import { signOut } from "firebase/auth";
import { auth, firebaseEnabled } from "@/lib/firebase/client";

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
  const [homeMsg, setHomeMsg] = useState("");
  /** 내 동네 바꾸기: 너무 빠른 이동은 막아요(거리를 일부러 늘리는 것 방지) */
  const moveHome = (id: string) => {
    const r = tryMoveHome(profile.homePlace, id);
    if (!r.ok) { setHomeMsg(r.message); return false; }
    update({ homePlace: id, homeLabel: undefined, homeSet: true }); setHomeMsg(""); return true;
  };
  const locateMe = () => {
    if (!navigator.geolocation) return setHomeMsg("이 기기에서는 위치를 알 수 없어요. 직접 골라 주세요.");
    setHomeMsg("위치를 찾는 중이에요...");
    navigator.geolocation.getCurrentPosition((pos) => {
      const here = findDistrict(pos.coords.latitude, pos.coords.longitude); // 구까지만, 좌표는 저장하지 않아요
      if (!moveHome(here.place.id)) return;
      update({ homeLabel: here.label, homeSet: true });
      setHomeMsg(here.label === here.place.name ? `${here.label} 근처로 정했어요.` : `${here.label}에 있는 것 같아요. ${here.place.name}에서 출발해요.`);
    }, () => setHomeMsg("위치를 허용하지 않아서 직접 골라야 해요."), { timeout: 10000, maximumAge: 600000 });
  };
  const [msg, setMsg] = useState("");
  const [pickBird, setPickBird] = useState(false);
  const [photoMsg, setPhotoMsg] = useState("");
  const [testMsg, setTestMsg] = useState("");
  const { state: push, enable: enablePush, disable: disablePush } = usePushState();

  const toggle = (key: NotifyKey) =>
    update((prev) => ({ notify: { ...prev.notify, [key]: !prev.notify[key] } }));

  // 로그아웃: 다음에 열면 처음 로그인 화면이 나와요(같은 계정으로 다시 들어오면 편지와 친구가 그대로예요)
  const logout = async () => {
    if (!window.confirm("로그아웃할까요? 같은 계정으로 다시 로그인하면 편지와 친구는 그대로예요.")) return;
    try { await signOut(auth()); } catch {}
    window.location.assign("/");
  };
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
      <header className="sendhead"><Link href="/" className="roomback" aria-label="뒤로">‹</Link><h1 style={{ margin: 0 }}>내 정보·설정</h1></header>

      <div className="mybird">
        <label className="avatarpick" aria-label="프로필 사진 올리기">
          <Face name={profile.nickname || "새"} bird={profile.avatarBird} photo={profile.photo} size={112} />
          <span className="cam" aria-hidden>📷</span>
          <input type="file" accept="image/*" hidden onChange={async (e) => {
            const f = e.target.files?.[0]; e.target.value = "";
            if (!f) return;
            setPhotoMsg("사진을 줄이는 중…");
            try { update({ photo: await compressAvatar(f) }); setPhotoMsg("프로필 사진을 바꿨어요. 친구에게도 보여요."); }
            catch { setPhotoMsg("이 사진은 쓸 수 없어요. 다른 사진을 골라 주세요."); }
          }} />
        </label>
        {profile.photo && <button type="button" className="linkbtn" onClick={() => { update({ photo: undefined }); setPhotoMsg("사진을 지웠어요. 내 새 얼굴이 보여요."); }}>사진 지우고 새 얼굴로</button>}
        {photoMsg && <div className="small" role="status">{photoMsg}</div>}
        <input className="nick" style={{ textAlign: "center", marginTop: 8 }} aria-label="닉네임" value={profile.nickname} maxLength={12} placeholder="이름"
          onChange={(e) => update({ nickname: e.target.value })} />
        <button type="button" className="edit" onClick={() => setPickBird((v) => !v)}>
          내 새 · {getBird(profile.avatarBird || "magpie").name} ✎ {pickBird ? "닫기" : "바꾸기"}
        </button>
        {pickBird && <div style={{ display: "flex", justifyContent: "center" }}><BirdPicker value={profile.avatarBird} onChange={(id) => { update({ avatarBird: id }); setPickBird(false); }} /></div>}
      </div>

      <div className="scalebox">
        <div className="name">글씨 크기</div>
        <div className="seg" role="radiogroup" aria-label="글씨 크기">
          {FONT_SCALES.map((f) => (
            <button key={f.id} type="button" role="radio" aria-checked={profile.fontScale === f.id} className={profile.fontScale === f.id ? "on" : ""}
              onClick={() => { update({ fontScale: f.id as FontScale }); setTimeout(() => window.dispatchEvent(new Event("saepyeonji:scale")), 0); }}>{f.label}</button>
          ))}
        </div>
        <div className="note">모든 화면의 글씨와 버튼이 커져요</div>
      </div>

      <div className="stats">
        <div><b>{letters.length}</b><span>보낸 편지</span></div>
        <div>
          <b>{backend === "firebase" ? received.length : SAMPLE_INBOX.length}</b>
          <span>{backend === "firebase" ? "받은 편지" : "받은 편지(예시)"}</span>
        </div>
      </div>

      <h2>내 동네</h2>
      <div className="list homecard">
        <div className="listrow" style={{ flexWrap: "wrap" }}>
          <div className="grow">
            <div className="name">{profile.homeLabel ?? getPlace(profile.homePlace)?.name ?? "서울 중구"}</div>
            <div className="note">새가 여기서 날아가고, 친구가 보내는 편지는 여기로 와요. 정확한 위치는 저장하지 않고 구 이름만 써요.</div>
          </div>
          <div className="row2b" style={{ width: "100%" }}>
            <button type="button" className="chip locate" onClick={locateMe}>📍 내 위치로 찾기</button>
            <select id="home-place" className="field" aria-label="내 동네 직접 고르기" style={{ width: "auto", margin: 0, flex: 1 }} value={profile.homePlace} onChange={(e) => moveHome(e.target.value)}>
              {placesByRegion().map((g) => (
                <optgroup key={g.region} label={g.region}>
                  {g.places.map((pl) => <option key={pl.id} value={pl.id}>{pl.name}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          {homeMsg && <div className="small" role="status" style={{ width: "100%", margin: "6px 0 0" }}>{homeMsg}</div>}
        </div>
        <div className="listrow">
          <div className="grow">
            <div className="name">친구에게 내 동네 알리기</div>
            <div className="note">켜 두면 친구가 편지를 쓸 때 받는 곳이 자동으로 정해져요. 끄면 친구가 직접 골라요.</div>
          </div>
          <button role="switch" aria-checked={profile.sharePlace !== false} aria-label="친구에게 내 동네 알리기" className="switch" onClick={() => update({ sharePlace: profile.sharePlace === false })} />
        </div>
      </div>
      <Link href="/stamps" className="opt rankcard" style={{ marginTop: 8 }}>
        <span className="oic" aria-hidden style={{ background: "var(--card)" }}>🏮</span>
        <span><b>스탬프 도감</b><span>편지가 지나간 명소를 모아요</span></span>
        <span style={{ marginLeft: "auto", fontSize: 26 }} aria-hidden>›</span>
      </Link>

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
            <div className="name">새 소리·진동</div>
            <div className="note">편지가 출발하면 푸드덕, 도착하면 짹짹! 진동도 함께 와요(아이폰은 진동 없음). <button className="linkbtn" style={{ display: "inline", margin: "0 0 0 4px", padding: 0, minHeight: 0, opacity: 1 }} onClick={() => playChirp()}>들어보기</button></div>
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

      <h2>계정</h2>
      <div className="list">
        <button className="listrow action" onClick={replayOnboarding}>
          <span>온보딩 다시 보기</span><span aria-hidden>›</span>
        </button>
        {firebaseEnabled && !IS_TOSS && (
          <button className="listrow action" onClick={logout}>
            <span>로그아웃</span><span aria-hidden>›</span>
          </button>
        )}
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
