"use client";
/**
 * 스토어 앱(Capacitor) 안에서만 하는 일. 웹·아이폰 홈 화면 앱에서는 아무것도 하지 않아요.
 * ① 안드로이드 뒤로 가기 버튼: 열린 창(크게 보기·아래 시트)이 있으면 그것부터 닫고, 탭 첫 화면이면 앱을 내려 두고(종료 대신),
 *    그 밖에는 앞 화면으로.
 * ② 별점 요청: 받은 편지를 두 통째 열어 본 뒤 편지 목록으로 돌아왔을 때 한 번만, 폰의 기본 별점 창(구글·애플이 횟수를 알아서 조절)으로.
 */
const isNative = () => typeof window !== "undefined" && !!(window as any).Capacitor?.isNativePlatform?.();
const TAB_ROOTS = ["/", "/friends", "/pen", "/rank"];
let started = false;

/** 앱을 연 주소에서 앱 안 화면 주소만 꺼내요(우리 사이트·saepyeonji:// 만, 그 밖은 무시) */
export function appPathOf(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.protocol === "saepyeonji:") { const p = u.searchParams.get("path") || "/"; return p.startsWith("/") && !p.startsWith("//") ? p : null; }
    if (u.protocol === "https:" && u.hostname === "bird-letter.vercel.app") return u.pathname + u.search;
  } catch {}
  return null;
}

export function initAppShell() {
  if (started || !isNative()) return;
  started = true;
  import("@capacitor/app").then(({ App }) => {
    void App.addListener("backButton", ({ canGoBack }) => {
      // 열린 창 먼저 닫기(얼굴 크게 보기 ✕, 아래에서 올라온 시트의 어두운 바깥)
      const close = document.querySelector<HTMLElement>(".pz-x, .ch-dim, .mf-close, .whobtn");
      if (close) { close.click(); return; }
      if (TAB_ROOTS.includes(location.pathname)) { void App.minimizeApp(); return; }
      if (canGoBack) history.back();
      else location.href = "/";
    });
    // 앱이 있는 폰에서 편지·초대 링크를 누르면(유니버설 링크·saepyeonji:// ·사파리 앱 배너) 그 화면으로 바로 가요
    void App.addListener("appUrlOpen", ({ url }) => {
      const path = appPathOf(url);
      if (path && path !== location.pathname + location.search) location.href = path;
    });
  }).catch(() => {});
}

const REVIEW_KEY = "saepyeonji.review.v1";
/** 받은 편지를 열어 볼 때마다 불러요(openedCount = 지금까지 열어 본 통수). 두 통째부터 "물어볼 차례"로 표시만 해 둬요 */
export function afterLetterOpened(openedCount: number) {
  if (!isNative() || openedCount < 2) return;
  try { if (!localStorage.getItem(REVIEW_KEY)) localStorage.setItem(REVIEW_KEY, "pending"); } catch {}
}

/** 편지 목록(홈)으로 돌아왔을 때 물어볼 차례면 한 번만 물어요(편지를 읽는 순간은 방해하지 않게) */
export function maybeAskReview() {
  if (!isNative()) return;
  try { if (localStorage.getItem(REVIEW_KEY) !== "pending") return; localStorage.setItem(REVIEW_KEY, String(Date.now())); } catch { return; }
  setTimeout(() => {
    import("@capacitor-community/in-app-review").then(({ InAppReview }) => InAppReview.requestReview()).catch(() => {});
  }, 1500);
}
