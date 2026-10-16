"use client";
import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import BirdIcon from "@/components/BirdIcon";
import LoginStart from "@/components/LoginStart";
import NameStep, { shouldAskName } from "@/components/NameStep";
import { ensureUser } from "@/lib/firebase/client";
import { addFriend, isCode, lookupCode, normalizeCode, type Friend } from "@/lib/firebase/friends";
import { useProfile } from "@/lib/settings";
import { useSession } from "@/lib/session";
import Face from "@/components/Face";

/**
 * 친구가 보낸 초대 링크(/invite?c=코드)를 눌렀을 때(시안 ⑬⑭).
 * 누가 초대했는지 보여 주고, 로그인(카카오·구글·애플)하면 코드를 입력하지 않아도 자동으로 친구가 돼요.
 */
export default function InvitePage() {
  return (
    <Suspense fallback={<main className="app" aria-busy="true" />}>
      <Invite />
    </Suspense>
  );
}

function Invite() {
  const code = normalizeCode(useSearchParams().get("c") ?? "");
  const { state, recheck } = useSession();
  const { profile, ready: profileReady } = useProfile();
  const [inviter, setInviter] = useState<Friend | null | undefined>(undefined); // undefined: 확인 중, null: 없는 코드
  const [naming, setNaming] = useState(false);
  const [result, setResult] = useState<"adding" | "done" | "self" | "error">("adding");
  const started = useRef(false);

  // 초대한 사람 이름 확인(코드를 읽으려면 서버 로그인이 필요해서 임시 계정으로 확인해요. 로그인하면 이어져요)
  useEffect(() => {
    if (!isCode(code)) { setInviter(null); return; }
    ensureUser().then(() => lookupCode(code)).then(setInviter).catch(() => setInviter(null));
  }, [code]);

  // 로그인이 끝난 상태면 이름을 확인하고 친구로 연결
  useEffect(() => {
    if (state !== "ready" || !inviter || !profileReady || started.current) return;
    if (shouldAskName(profile)) { setNaming(true); return; }
    started.current = true;
    setNaming(false);
    addFriend(code, profile.nickname, profile.avatarBird).then(() => setResult("done")).catch((e) => setResult((e as Error).message === "self" ? "self" : "error"));
  }, [state, inviter, profileReady, profile, code]);

  if (state === "checking" || inviter === undefined) return <main className="app" aria-busy="true" />;
  if (inviter === null)
    return (
      <main className="app">
        <div className="empty">이 초대 링크를 찾을 수 없어요.<br />친구에게 새 링크를 받아 주세요.</div>
        <Link href="/" className="ghost">처음으로</Link>
      </main>
    );
  if (state === "login") return <LoginStart onDone={recheck} inviter={inviter.name} next={`/invite?c=${code}`} />;
  if (naming) return <NameStep onDone={() => setNaming(false)} />;

  return (
    <main className="start">
      <div className="start-hero">
        {result === "adding" && <p>친구로 연결하고 있어요…</p>}
        {result === "done" && (
          <>
            <div className="pairs">
              <Face name={profile.nickname} bird={profile.avatarBird} size={84} />
              <span aria-hidden style={{ fontSize: 30 }}>💌</span>
              <Face name={inviter.name} bird={inviter.bird} size={84} />
            </div>
            <h1 style={{ fontSize: 28 }}>{inviter.name}님과<br />편지 친구가 되었어요!</h1>
            <p>첫 편지를 써서<br />새에게 맡겨 보세요</p>
          </>
        )}
        {result === "self" && <><BirdIcon id="magpie" size={120} /><p>내가 보낸 초대 링크예요.<br />친구에게 보내 주세요.</p></>}
        {result === "error" && <><BirdIcon id="magpie" size={120} /><p>친구로 연결하지 못했어요.<br />잠시 뒤에 링크를 다시 눌러 주세요.</p></>}
      </div>
      <div className="start-btns">
        {result === "done" && <Link href={`/room?u=${encodeURIComponent(inviter.uid)}`} className="cta big">{inviter.name}에게 첫 편지 쓰기</Link>}
        <Link href="/" className="ghost" style={{ minHeight: 56 }}>{result === "done" ? "나중에 쓸게요" : "처음으로"}</Link>
      </div>
    </main>
  );
}
