"use client";
import { useEffect } from "react";
import { FONT_FACES, FONT_SCALES, PROFILE_KEY } from "@/lib/settings";

/** 저장된 글씨 크기를 모든 화면에 적용해요(<html data-scale>). 설정에서 바꾸면 "saepyeonji:scale" 신호로 바로 반영돼요 */
export default function FontScale() {
  useEffect(() => {
    const apply = () => {
      let id = "normal";
      let face = "basic";
      let theme = "light";
      try { const p = JSON.parse(localStorage.getItem(PROFILE_KEY) ?? "{}"); id = p.fontScale ?? "normal"; face = p.fontFace ?? "basic"; theme = p.theme ?? "light"; } catch {}
      document.documentElement.dataset.theme = theme === "dark" || theme === "auto" ? theme : "light";
      // 글씨체(<html data-font>): 기본이면 칸을 지워요
      if (face !== "basic" && FONT_FACES.some((f) => f.id === face)) document.documentElement.dataset.font = face;
      else delete document.documentElement.dataset.font;
      if (id === "xlarge") id = "large"; // 옛 "아주 크게"는 "크게"로
      document.documentElement.dataset.scale = FONT_SCALES.some((s) => s.id === id) ? id : "normal";
    };
    apply();
    window.addEventListener("saepyeonji:scale", apply);
    return () => window.removeEventListener("saepyeonji:scale", apply);
  }, []);
  return null;
}
