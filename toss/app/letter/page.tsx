"use client";
// 토스 빌드의 편지 화면: /letter?id=<편지ID>. 정적 빌드는 ID마다 화면을 미리 만들 수 없어서 한 장으로 처리한다.
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import LetterView from "../../../src/components/LetterView";

function Inner() {
  const id = useSearchParams().get("id");
  if (!id) {
    return (
      <main className="app">
        <div className="empty">편지를 찾을 수 없어요.</div>
      </main>
    );
  }
  return <LetterView id={id} />;
}

export default function LetterPage() {
  return (
    <Suspense fallback={<main className="app" />}>
      <Inner />
    </Suspense>
  );
}
