"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ensureUser, firebaseEnabled } from "@/lib/firebase/client";
import { ADMIN_CACHE_KEY, readJson, useBeforePaint, writeJson } from "@/lib/fastStart";
import type { UserCounts } from "../../../core/adminStats";

type Stats = { at: number; users: UserCounts; letters: { all: number; today: number; week: number } };
type View = { kind: "loading" } | { kind: "ok"; s: Stats; fresh: boolean } | { kind: "notAdmin"; uid: string } | { kind: "error"; msg: string };

/** 운영자 숫자판: 대표님 계정에만 가입자·편지 숫자를 보여 줘요(이름·편지 내용은 없음) */
export default function AdminPage() {
  const [v, setV] = useState<View>({ kind: "loading" });
  const [copied, setCopied] = useState(false);

  // 지난번 숫자를 그리기 전에 먼저 보여 주고, 새 숫자는 뒤에서 받아 조용히 바꿔요
  useBeforePaint(() => { const c = readJson<Stats>(ADMIN_CACHE_KEY); if (c?.users) setV({ kind: "ok", s: c, fresh: false }); }, []);

  const load = useCallback(async () => {
    setV((old) => (old.kind === "ok" ? { ...old, fresh: false } : { kind: "loading" }));
    if (!firebaseEnabled) return setV({ kind: "error", msg: "서버 연결이 꺼져 있어요" });
    try {
      const user = await ensureUser();
      const r = await fetch("/api/admin/stats", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: await user.getIdToken() }) });
      const j = await r.json().catch(() => ({}));
      if (r.status === 403 && j.uid) return setV({ kind: "notAdmin", uid: j.uid });
      if (!r.ok) return setV({ kind: "error", msg: `숫자를 못 가져왔어요 (${j.error ?? r.status}${j.detail ? ` · ${j.detail}` : ""})` });
      writeJson(ADMIN_CACHE_KEY, j);
      setV({ kind: "ok", s: j, fresh: true });
    } catch (e) {
      setV({ kind: "error", msg: `인터넷 연결을 확인해 주세요 (${e instanceof Error ? e.message : ""})` });
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  return (
    <main className="app">
      <header className="sendhead"><Link href="/settings" className="roomback" aria-label="뒤로">‹</Link><h1 style={{ margin: 0 }}>오늘의 숫자</h1></header>

      {v.kind === "loading" && <p className="sub">숫자를 세는 중이에요…</p>}
      {v.kind === "error" && <><p>{v.msg}</p><button className="cta" onClick={load}>다시 시도</button></>}
      {v.kind === "notAdmin" && (
        <div className="card">
          <p style={{ marginTop: 0 }}>이 화면은 운영자 계정만 볼 수 있어요.</p>
          <p>대표님이라면 아래 <b>계정 번호</b>를 개발팀에 알려 주세요. 등록하면 숫자가 보여요.</p>
          <p style={{ fontFamily: "monospace", fontSize: 18, wordBreak: "break-all", userSelect: "all" }}>{v.uid}</p>
          {!v.uid.startsWith("kakao:") && <p className="sub">카카오로 로그인한 앱(홈 화면 새 편지 아이콘)에서 열면 번호가 달라질 수 있어요. 평소 쓰는 앱에서 열어 주세요.</p>}
          <button className="cta" onClick={() => { void navigator.clipboard?.writeText(v.uid).then(() => setCopied(true)).catch(() => {}); }}>{copied ? "복사했어요 ✓" : "계정 번호 복사"}</button>
        </div>
      )}
      {v.kind === "ok" && <Board s={v.s} fresh={v.fresh} onRefresh={load} />}
    </main>
  );
}

function Num({ label, n, sub }: { label: string; n: number; sub?: string }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontSize: 14, opacity: 0.75 }}>{label}</div>
      <div style={{ fontSize: 34, fontWeight: 800, lineHeight: 1.2 }}>{n.toLocaleString("ko-KR")}</div>
      {sub && <div style={{ fontSize: 13, opacity: 0.7 }}>{sub}</div>}
    </div>
  );
}

function Board({ s, fresh, onRefresh }: { s: Stats; fresh: boolean; onRefresh: () => void }) {
  const u = s.users, p = u.byProvider;
  const grid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 } as const;
  return (
    <>
      <h2>사람</h2>
      <div style={grid}>
        <Num label="가입한 사람" n={u.members} sub={`카카오 ${p.kakao} · 구글 ${p.google} · 애플 ${p.apple}${p.other ? ` · 기타 ${p.other}` : ""}`} />
        <Num label="오늘 새로 가입" n={u.newToday} sub={`최근 7일 ${u.new7d}명`} />
        <Num label="최근 24시간 들어온 사람" n={u.active1d} />
        <Num label="최근 7일 들어온 사람" n={u.active7d} />
      </div>
      <h2>편지</h2>
      <div style={grid}>
        <Num label="오늘 보낸 편지" n={s.letters.today} />
        <Num label="최근 7일" n={s.letters.week} />
        <Num label="지금까지 전체" n={s.letters.all} />
        <Num label="로그인 전 임시 계정" n={u.anonymous} sub="시험 계정 포함, 가입자 수에서 뺐어요" />
      </div>
      <p className="sub" style={{ fontSize: 13 }}>
        {new Date(s.at).toLocaleString("ko-KR")} 기준{fresh ? "" : " · 새 숫자 받는 중…"} · "들어온 사람"은 로그인 상태를 새로 고친 때 기준이라 대략값이에요.
      </p>
      <button className="cta" onClick={onRefresh}>새로 고침</button>
    </>
  );
}
