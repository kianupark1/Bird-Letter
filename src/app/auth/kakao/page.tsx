"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BirdIcon from "@/components/BirdIcon";
import { finishKakaoLogin } from "@/lib/firebase/kakao";

/** 카카오 로그인이 끝나고 돌아오는 곳. 처리가 끝나면 설정 화면으로 보낸다. */
export default function KakaoReturn() {
  const router = useRouter();
  const [msg, setMsg] = useState("카카오 계정을 연결하고 있어요...");
  useEffect(() => {
    let off = false;
    (async () => {
      const r = await finishKakaoLogin(location.search);
      if (off) return;
      if (r.ok) {
        setMsg(r.switched ? "이전에 연결한 계정으로 들어왔어요." : "카카오 연결이 끝났어요.");
        setTimeout(() => router.replace("/settings?linked=kakao"), 900);
      } else {
        setMsg(r.message);
        setTimeout(() => router.replace("/settings"), 2500);
      }
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
