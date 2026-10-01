"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LETTERS_KEY, ONBOARDED_KEY, SAMPLE_INBOX, useLetters } from "@/lib/letters";
import { useProfile, type Profile } from "@/lib/settings";

type NotifyKey = keyof Profile["notify"];

const NOTIFY_ROWS: { key: NotifyKey; title: string; desc: string }[] = [
  { key: "arrival", title: "도착 알림", desc: "내 편지가 도착하면 알려줘요" },
  { key: "passing", title: "중간 지점 알림", desc: "새가 경유지를 지날 때 알려줘요" },
  { key: "reply", title: "답장 알림", desc: "받은 편지가 도착하면 알려줘요" },
];

export default function Settings() {
  const router = useRouter();
  const { letters } = useLetters();
  const { profile, ready, update } = useProfile();
  const [msg, setMsg] = useState("");

  const toggle = (key: NotifyKey) =>
    update((prev) => ({ notify: { ...prev.notify, [key]: !prev.notify[key] } }));

  const replayOnboarding = () => {
    try {
      localStorage.removeItem(ONBOARDED_KEY);
    } catch {}
    router.push("/onboarding");
  };

  const clearLetters = () => {
    if (!window.confirm("보낸 편지를 모두 지울까요? 되돌릴 수 없어요.")) return;
    try {
      localStorage.removeItem(LETTERS_KEY);
    } catch {}
    setMsg("보낸 편지를 모두 지웠어요.");
    setTimeout(() => window.location.assign("/"), 700);
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
        <div><b>{SAMPLE_INBOX.length}</b><span>받은 편지(예시)</span></div>
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
      <div className="small">실제 푸시 알림은 서버(Firebase)를 연결한 뒤부터 와요. 지금은 설정만 저장돼요.</div>

      <h2>계정</h2>
      <div className="list">
        <button className="listrow action" onClick={replayOnboarding}>
          <span>온보딩 다시 보기</span><span aria-hidden>›</span>
        </button>
        <button className="listrow action danger" onClick={clearLetters}>
          <span>보낸 편지 모두 지우기</span><span aria-hidden>›</span>
        </button>
      </div>
      {msg && <div className="small" role="status">{msg}</div>}

      <h2>정보</h2>
      <div className="list">
        <Link href="/privacy" className="listrow action">
          <span>개인정보 처리방침</span><span aria-hidden>›</span>
        </Link>
        <div className="listrow"><span>버전</span><span className="note">0.1.0 (테스트)</span></div>
      </div>
    </main>
  );
}
