"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** 예전 주소: 편지 쓰기는 이제 편지 목록 화면 안에서 바로 해요 */
export default function WritePage() {
  const router = useRouter();
  useEffect(() => { router.replace("/?write=1"); }, [router]);
  return <main className="app" aria-busy="true" />;
}
