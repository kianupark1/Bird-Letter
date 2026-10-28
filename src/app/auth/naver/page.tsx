"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BirdIcon from "@/components/BirdIcon";
import { finishNaverLogin, naverNext } from "@/lib/firebase/naver";

/** 네이버 로그인이 끝나고 돌아오는 곳. 처리가 끝나면 원래 가려던 화면(보통 홈)으로 */
export default function NaverReturn() {
  const router = useRouter();
  const [msg, setMsg] = useState("네이버 계정으로 들어가고 있어요...");
  useEffect(() => {
    let off = false;
    (async () => {
      const r = await finishNaverLogin(location.search);
      if (off) return;
      const next = naverNext();
      if (r.ok) { setMsg(r.switched ? "이전에 가입한 계정으로 들어왔어요." : "가입이 끝났어요!"); setTimeout(() => router.replace(next), 900); }
      else { setMsg(r.message); setTimeout(() => router.replace(next), 2500); }
    })();
    return () => { off = true; };
  }, [router]);
  return (
    <main className="app">
      <div className="empty" role="status">
        <BirdIcon id="magpie" size={96} letter className="bob" />
        <p>{msg}</p>
      </div>
    </main>
  );
}
