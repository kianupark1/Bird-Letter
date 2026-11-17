/** 화면 오류를 서버에 한 줄 남겨요(매일 숫자 점검에서 봐요). 내용·이름은 안 보내고 오류 글·주소만 */
export function reportError(err: unknown, where: string) {
  try {
    const e = err as { name?: string; message?: string; stack?: string; digest?: string };
    const body = JSON.stringify({
      where: where.slice(0, 80), path: location.pathname,
      msg: `${e?.name ?? "Error"}: ${e?.message ?? String(err)}`.slice(0, 300),
      stack: (e?.stack ?? "").split("\n").slice(0, 4).join(" | ").slice(0, 500),
      ua: /SaePyeonjiApp/.test(navigator.userAgent) ? "app" : /iPhone|iPad/.test(navigator.userAgent) ? "ios-web" : /Android/.test(navigator.userAgent) ? "android-web" : "other",
    });
    navigator.sendBeacon?.("/api/client-error", new Blob([body], { type: "application/json" })) || fetch("/api/client-error", { method: "POST", body, keepalive: true }).catch(() => {});
  } catch {}
}
