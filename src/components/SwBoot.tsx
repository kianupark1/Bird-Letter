"use client";
import { useEffect } from "react";

/** 앱 파일을 폰에 담아 두는 서비스 워커를 켜요(다음에 열 때 빨리 뜨게). 알림을 켜지 않은 사람도 켜져요 */
export default function SwBoot() {
  // 스토어 앱이면 안드로이드 뒤로 가기 버튼을 앱답게(src/lib/appShell.ts)
  useEffect(() => { void import("@/lib/appShell").then((m) => m.initAppShell()).catch(() => {}); }, []);
  // 아이폰 앱이면 화면 가장자리를 밀어 뒤로·앞으로(src/lib/swipeNav.ts)
  useEffect(() => { void import("@/lib/swipeNav").then((m) => m.initSwipeNav()).catch(() => {}); }, []);
  // 첫 화면 그림(layout #boot)은 화면 내용이 실제로 그려지면 스르륵 걷어요(빈 화면이 보이지 않게)
  useEffect(() => {
    const boot = document.getElementById("boot");
    if (!boot) return;
    const t0 = performance.now();
    const ready = () => !!document.querySelector('main.start > *, main.app:not([aria-busy="true"]) > *');
    const tick = () => {
      if (ready() || performance.now() - t0 > 3500) {
        boot.classList.add("out");
      } else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, []);
  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;
    const go = () => navigator.serviceWorker.register("/sw.js").catch(() => {});
    if (document.readyState === "complete") go();
    else window.addEventListener("load", go, { once: true });
  }, []);
  return null;
}
