"use client";
import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { firebaseEnabled } from "@/lib/firebase/client";
import { addFriend, ensureMyCode, isCode, listFriends, lookupCode, normalizeCode, removeFriend, type Friend } from "@/lib/firebase/friends";
import { useProfile } from "@/lib/settings";

export default function FriendsPage() {
  return (
    <Suspense fallback={<main className="app" />}>
      <Friends />
    </Suspense>
  );
}

function Friends() {
  const { profile, ready } = useProfile();
  const params = useSearchParams();
  const invite = params.get("add") ?? "";
  const [code, setCode] = useState("");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<Friend | null>(null);
  const [pendingCode, setPendingCode] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => setFriends(await listFriends()), []);

  useEffect(() => {
    if (!ready || !firebaseEnabled) { setLoading(false); return; }
    (async () => {
      try {
        setCode(await ensureMyCode(profile.nickname));
        await reload();
      } catch { setMsg("서버에 연결하지 못했어요. 잠시 후 다시 열어 주세요."); }
      setLoading(false);
    })();
  }, [ready, profile.nickname, reload]);

  // 초대 링크(/friends?add=코드)로 들어오면 누구인지 먼저 보여줘요
  useEffect(() => { if (invite && isCode(invite)) void find(invite); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [invite, ready]);

  async function find(c: string) {
    setMsg("");
    try {
      const f = await lookupCode(c);
      if (!f) return setMsg("이 코드를 가진 친구를 찾지 못했어요. 코드를 다시 확인해 주세요.");
      setPending(f);
      setPendingCode(normalizeCode(c));
    } catch { setMsg("찾지 못했어요. 인터넷 연결을 확인해 주세요."); }
  }

  const confirmAdd = async () => {
    try {
      const f = await addFriend(pendingCode, profile.nickname);
      setMsg(`${f.name}님과 친구가 됐어요!`);
      setPending(null); setInput("");
      await reload();
    } catch (e) {
      setMsg((e as Error).message === "self" ? "내 코드예요. 친구의 코드를 넣어 주세요." : "친구를 추가하지 못했어요. 잠시 후 다시 시도해 주세요.");
      setPending(null);
    }
  };

  const link = () => `${location.origin}/friends?add=${code}`;
  const share = async () => {
    const text = `새편지에서 친구해요! 내 친구 코드: ${code}`;
    try {
      if (navigator.share) await navigator.share({ title: "새편지 친구 초대", text, url: link() });
      else { await navigator.clipboard.writeText(`${text}\n${link()}`); setMsg("초대 링크를 복사했어요. 친구에게 붙여넣어 보내 주세요."); }
    } catch {}
  };
  const copy = async () => { try { await navigator.clipboard.writeText(code); setMsg("코드를 복사했어요."); } catch {} };
  const remove = async (f: Friend) => {
    if (!window.confirm(`${f.name}님과 친구를 끊을까요? 서로에게 바로 보내기가 멈춰요.`)) return;
    try { await removeFriend(f.uid); await reload(); } catch { setMsg("끊지 못했어요. 다시 시도해 주세요."); }
  };

  if (!firebaseEnabled)
    return <main className="app"><h1>친구</h1><div className="empty">서버에 연결된 뒤에 쓸 수 있어요.</div></main>;

  return (
    <main className="app">
      <h1>친구</h1>
      <p className="sub">한 번만 연결해 두면, 다음부터는 친구를 골라 바로 보낼 수 있어요.</p>

      {pending && (
        <div className="card" role="alert" style={{ display: "block" }}>
          <div className="name">{pending.name}님을 친구로 추가할까요?</div>
          <div className="note">서로의 새편지함으로 바로 보낼 수 있게 돼요.</div>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button className="cta" style={{ flex: 2 }} onClick={confirmAdd}>친구 추가</button>
            <button className="ghost" style={{ flex: 1 }} onClick={() => setPending(null)}>취소</button>
          </div>
        </div>
      )}

      <h2>내 친구 코드</h2>
      <div className="card" style={{ display: "block", textAlign: "center" }}>
        <div className="friendcode" aria-label="내 친구 코드">{loading ? "..." : code || "-"}</div>
        <div className="note">이 코드나 초대 링크를 친구에게 보내 주세요.</div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button className="cta" style={{ flex: 2 }} disabled={!code} onClick={share}>초대 링크 보내기</button>
          <button className="ghost" style={{ flex: 1 }} disabled={!code} onClick={copy}>코드 복사</button>
        </div>
      </div>

      <h2>친구 코드 입력</h2>
      <div style={{ display: "flex", gap: 8 }}>
        <input className="field" style={{ flex: 1, marginBottom: 0, textTransform: "uppercase" }} placeholder="친구 코드 8글자" value={input} maxLength={12}
          onChange={(e) => setInput(e.target.value)} aria-label="친구 코드" />
        <button className="chip locate" style={{ marginBottom: 0 }} disabled={!isCode(input)} onClick={() => find(input)}>찾기</button>
      </div>

      {msg && <div className="small" role="status" style={{ marginTop: 10 }}>{msg}</div>}

      <h2>내 친구 {friends.length > 0 && `(${friends.length})`}</h2>
      {!loading && friends.length === 0 && <div className="empty">아직 친구가 없어요.<br />코드를 보내거나 받아서 연결해 보세요.</div>}
      {friends.map((f) => (
        <div key={f.uid} className="card">
          <div className="row grow">
            <div className="avatar" aria-hidden>{f.name.slice(0, 1)}</div>
            <div className="grow"><div className="name ellipsis">{f.name}</div></div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <Link href={`/send?friend=${f.uid}`} className="chip">편지 쓰기</Link>
            <button className="chip" onClick={() => remove(f)} aria-label={`${f.name} 친구 끊기`}>끊기</button>
          </div>
        </div>
      ))}
    </main>
  );
}
