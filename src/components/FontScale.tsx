"use client";
import { useEffect } from "react";
import { FONT_SCALES, PROFILE_KEY } from "@/lib/settings";

/** 저장된 글씨 크기를 모든 화면에 적용해요(<html data-scale>). 설정에서 바꾸면 "saepyeonji:scale" 신호로 바로 반영돼요 */
export default function FontScale() {
  useEffect(() => {
    const apply = () => {
      let id = "normal";
      try { id = JSON.parse(localStorage.getItem(PROFILE_KEY) ?? "{}").fontScale ?? "normal"; } catch {}
      if (id === "xlarge") id = "large"; // 옛 "아주 크게"는 "크게"로
      document.documentElement.dataset.scale = FONT_SCALES.some((s) => s.id === id) ? id : "normal";
    };
    apply();
    window.addEventListener("saepyeonji:scale", apply);
    return () => window.removeEventListener("saepyeonji:scale", apply);
  }, []);
  return null;
}
