"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { firebaseEnabled, ensureUser } from "@/lib/firebase/client";
import { listBrowse, type BrowseRow } from "@/lib/firebase/penpal";
import { listBlocked } from "@/lib/firebase/remote";
import { PENPAL_TAGS, cityLabel } from "../../../../core/penpal";
import { useSession } from "@/lib/session";
import LoginStart from "@/components/LoginStart";
import Face from "@/components/Face";

/**
 * 펜팔 친구 둘러보기(2026-10-25, 대표님: "한 줄 소개랑 사진 보고 펜팔 보낼 사람 고르게, 단 사람이 허락했을 때만").
 * 랜덤 편지 받기 + "둘러보기에 나 보이기"를 켠 사람만 나와요. 사진은 본인이 따로 허락한 사람만.
 * 누르면 그 사람에게 바로 펜팔 편지(/penpal?to=uid, 서버 규칙: 받기를 켜고 나를 차단하지 않은 사람에게만).
 */
export default function PenBrowse() {
  const { state, recheck } = useSession();
  if (state === "checking") return <main className="app" aria-busy="true" />;
  if (state === "login") return <LoginStart onDone={recheck} next="/pen/browse" />;
  return <Browse />;
}

const tagText = (ids: string[]) => ids.map((id) => PENPAL_TAGS.find((t) => t.id === id)?.label).filter(Boolean).join(" · ");

function Browse() {
  const [rows, setRows] = useState<BrowseRow[] | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    if (!firebaseEnabled) { setRows([]); return; }
    (async () => {
      try {
        const me = await ensureUser();
        const [all, blocked] = await Promise.all([listBrowse(), listBlocked(me.uid).catch(() => new Set<string>())]);
        // 나·내가 차단한 사람은 빼고, 순서는 매번 섞어서 같은 사람만 위에 있지 않게
        const list = all.filter((r) => r.uid !== me.uid && !blocked.has(r.uid));
        for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
        setRows(list);
      } catch { setErr(true); setRows([]); }
    })();
  }, []);

  return (
    <main className="app pentab">
      <header className="sendhead"><Link href="/pen" className="roomback" aria-label="뒤로">‹</Link><h1 style={{ margin: 0 }}>펜팔 친구 둘러보기 👀</h1></header>
      <p className="sub" style={{ margin: "0 4px 8px" }}>마음에 드는 펜팔 카드를 누르면 그 사람에게 편지를 써요</p>

      {rows === null && <p className="sub" aria-busy="true">펜팔 카드를 불러오는 중…</p>}
      {err && <p className="sub" role="alert">불러오지 못했어요. 인터넷 연결을 확인해 주세요.</p>}
      {rows && !err && rows.length === 0 && (
        <div className="card" style={{ textAlign: "center" }}>
          <p className="sub" style={{ marginTop: 0 }}>아직 둘러보기에 카드를 올린 사람이 없어요.</p>
          <Link href="/penpal" className="cta">🎲 어디든 랜덤으로 보내기</Link>
        </div>
      )}

      <ul className="ppbrowse">
        {rows?.map((r) => (
          <li key={r.uid}>
            <Link href={`/penpal?to=${encodeURIComponent(r.uid)}`} className="ppcard2">
              <Face name={r.name} bird={r.bird} photo={r.photo} size={64} />
              <span className="pp2mid">
                <b>{r.name}</b>
                <span className="pp2city">📍 {cityLabel(r.region)}</span>
                {r.intro ? <span className="pp2intro">&ldquo;{r.intro}&rdquo;</span> : <span className="pp2intro dim">한 줄 소개가 아직 없어요</span>}
                {r.tags.length > 0 && <span className="pp2tags">{tagText(r.tags)}</span>}
              </span>
              <span className="pp2go" aria-hidden>✉</span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="sub" style={{ fontSize: 14, margin: "16px 4px" }}>둘러보기에 보이기를 직접 허락한 사람만 나와요 · 사진은 본인이 따로 허락한 사람만 · 만 14세 이상 · 이상한 편지는 대화방에서 🚩 신고·차단</p>
    </main>
  );
}
