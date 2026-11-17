"use client";
import { useEffect } from "react";
import { reportError } from "@/lib/reportError";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => { reportError(error, "global"); }, [error]);
  return (
    <html lang="ko"><body style={{ background: "#FBF3E4", fontFamily: "sans-serif", textAlign: "center", padding: "80px 20px" }}>
      <p style={{ fontSize: 40 }}>🐦</p>
      <p>앗, 새가 잠깐 길을 잃었어요</p>
      <button type="button" onClick={() => location.reload()} style={{ marginTop: 16, padding: "14px 24px", borderRadius: 999, border: 0, background: "#C1481F", color: "#fff", fontSize: 17 }}>다시 열기</button>
    </body></html>
  );
}
