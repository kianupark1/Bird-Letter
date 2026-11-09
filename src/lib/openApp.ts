"use client";
/**
 * 아이폰에서 "앱 받기"를 눌렀을 때 앱이 이미 깔려 있으면 앱으로 바로 열어요(2026-11-09 대표님: "앱을 깔고 나면 앱으로 바로 가야 하는데 앱스토어가 나와").
 * 카카오톡·인스타 같은 앱 안 브라우저는 유니버설 링크가 안 먹어서 saepyeonji:// 로 먼저 열어 보고, 1.5초 안에 앱이 안 열리면 앱스토어로.
 * 사파리는 위쪽 "새 편지" 앱 띠(열기)와 앱스토어 페이지의 [열기]가 같은 일을 해서 그냥 앱스토어로 가요(없는 주소 경고가 뜨지 않게).
 */
export function openAppOrStore(e: { preventDefault(): void }, storeUrl: string) {
  const ua = navigator.userAgent;
  if (!/iphone|ipad|ipod/i.test(ua) || !/KAKAOTALK|NAVER|Instagram|FBAN|FBAV|Line\/|DaumApps|everytimeApp/i.test(ua)) return;
  e.preventDefault();
  let left = false;
  const away = () => { if (document.visibilityState === "hidden") left = true; };
  document.addEventListener("visibilitychange", away);
  location.href = `saepyeonji://open?path=${encodeURIComponent(location.pathname + location.search)}`;
  setTimeout(() => {
    document.removeEventListener("visibilitychange", away);
    if (!left) location.href = storeUrl;
  }, 1500);
}
