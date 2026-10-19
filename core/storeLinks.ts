/**
 * 스토어(구글 플레이·앱스토어) 링크. 초대 링크를 누른 사람에게 "앱 받기" 버튼을 보여 줄 때 써요.
 * 스토어 주소는 src/lib/release.ts STORE에서 켜요(스토어에 앱이 올라가기 전에는 버튼을 숨겨요).
 */
export const APP_ID = "com.saepyeonji.app";

/** 구글 플레이 주소. 어디서 왔는지(utm)를 붙여 두면 플레이 콘솔의 "설치 경로"에서 초대로 깐 사람 수가 보여요 */
export const playUrl = (source = "invite") =>
  `https://play.google.com/store/apps/details?id=${APP_ID}&referrer=${encodeURIComponent(`utm_source=${source}&utm_medium=friend`)}`;

export type StoreCfg = { android: boolean; iosUrl: string };
export type StoreBtn = { url: string; label: string };

/** 이 폰에 맞는 스토어 버튼(없으면 null): 안드로이드 → 구글 플레이, 아이폰 → 앱스토어, 컴퓨터 → 없음 */
export function storeFor(ua: string, cfg: StoreCfg, source = "invite"): StoreBtn | null {
  if (/SaePyeonjiApp/.test(ua)) return null; // 이미 앱 안
  if (/android/i.test(ua)) return cfg.android ? { url: playUrl(source), label: "구글 플레이에서 앱 받기" } : null;
  if (/iphone|ipad|ipod/i.test(ua)) return cfg.iosUrl ? { url: cfg.iosUrl, label: "앱스토어에서 앱 받기" } : null;
  return null;
}
