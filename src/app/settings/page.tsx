"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { placesByRegion } from "../../../core/places";
import { LETTERS_KEY, ONBOARDED_KEY, SAMPLE_INBOX, useLetters } from "@/lib/letters";
import { useProfile, type Profile } from "@/lib/settings";
import * as remote from "@/lib/firebase/remote";
import { PUSH_CONFIGURED, usePushState } from "@/lib/push";
import { IS_TOSS } from "@/lib/target";

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
      </div>
      <div className="small">
        앱을 열어 둔 동안에는 귀여운 팝업으로 알려줘요.{!IS_TOSS && " 앱을 닫아도 오는 알림(푸시)은 준비 중이에요."}
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
            {PUSH_CONFIGURED && (push === "enabled" || push === "default") && (
              <button role="switch" aria-checked={push === "enabled"} aria-label="앱을 닫아도 알림 받기" className="switch" onClick={push === "enabled" ? disablePush : enablePush} />
            )}
          </div>
        </div>
      )}

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
