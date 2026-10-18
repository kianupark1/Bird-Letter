"use client";
import { useEffect } from "react";

/** 앱 파일을 폰에 담아 두는 서비스 워커를 켜요(다음에 열 때 빨리 뜨게). 알림을 켜지 않은 사람도 켜져요 */
export default function SwBoot() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;
    const go = () => navigator.serviceWorker.register("/sw.js").catch(() => {});
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go, { once: true });
  }, []);
  return null;
}
