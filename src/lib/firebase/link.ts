"use client";
import {
  GoogleAuthProvider, OAuthProvider, browserPopupRedirectResolver, linkWithCredential, linkWithPopup, reauthenticateWithPopup, revokeAccessToken, signInWithCredential, signInWithPopup, unlink,
  type AuthCredential, type AuthProvider, type User,
} from "firebase/auth";
import { auth, ensureUser, firebaseApiKey, firebaseEnabled } from "./client";

/** 설정의 "계정 연결"에서 쓰는 로그인 종류. 구글·애플은 Firebase가 직접 처리하고, 나머지는 서버 연결이 끝나야 열립니다. */
import { KAKAO_LOGIN_READY, startKakaoLogin } from "./kakao";

export type LoginKind = "google" | "apple" | "kakao" | "naver" | "line";

export const LOGINS: { kind: LoginKind; label: string; ready: boolean }[] = [
  { kind: "google", label: "구글", ready: true },
  { kind: "apple", label: "애플", ready: true },
  { kind: "kakao", label: "카카오", ready: KAKAO_LOGIN_READY },
  { kind: "naver", label: "네이버", ready: false },
  { kind: "line", label: "라인", ready: false },
];

const PROVIDER_ID: Partial<Record<LoginKind, string>> = { google: "google.com", apple: "apple.com" };

function provider(kind: LoginKind): AuthProvider {
  if (kind === "google") return new GoogleAuthProvider();
  const p = new OAuthProvider("apple.com");
  p.addScope("name");
  return p;
}

/** 지금 연결된 로그인 종류들(익명이면 빈 목록) */
export function linkedKinds(u: User | null): LoginKind[] {
  if (!u) return [];
  return (Object.keys(PROVIDER_ID) as LoginKind[]).filter((k) => u.providerData.some((d) => d.providerId === PROVIDER_ID[k]));
}

export type LinkResult = { ok: true; switched: boolean } | { ok: false; message: string };

/**
 * 스토어 앱 안에서는 웹 팝업 로그인이 막혀요(구글은 앱 속 웹 화면 로그인을 거절, 팝업 창도 안 열림).
 * 그래서 폰 기본 로그인 창(애플·구글)으로 확인만 받고, 받은 증표로 웹(Firebase)에서 로그인해요.
 * 설정 파일이 들어간 앱 빌드에서만 켜져요(capacitor.config.ts NATIVE_AUTH).
 */
function nativeLoginReady(): boolean {
  const cap = typeof window !== "undefined" ? (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean; isPluginAvailable?: (n: string) => boolean } }).Capacitor : undefined;
  return !!cap?.isNativePlatform?.() && !!cap.isPluginAvailable?.("FirebaseAuthentication");
}
async function nativeCredential(kind: LoginKind): Promise<AuthCredential> {
  const { FirebaseAuthentication } = await import("@capacitor-firebase/authentication");
  if (kind === "google") {
    const r = await FirebaseAuthentication.signInWithGoogle();
    if (!r.credential?.idToken) throw Object.assign(new Error("no idToken"), { code: "auth/native-no-token" });
    return GoogleAuthProvider.credential(r.credential.idToken, r.credential.accessToken);
  }
  const r = await FirebaseAuthentication.signInWithApple({ scopes: ["name"] });
  if (!r.credential?.idToken) throw Object.assign(new Error("no idToken"), { code: "auth/native-no-token" });
  return new OAuthProvider("apple.com").credential({ idToken: r.credential.idToken, rawNonce: r.credential.nonce });
}
/** 폰 기본 창이 "취소"로 끝났는지(플러그인마다 말이 달라서 글자로 봐요) */
const nativeCancelled = (e: unknown) => /cancel|1001|12501/i.test(String((e as { message?: string; code?: string }).message ?? (e as { code?: string }).code ?? ""));

/**
 * 익명 계정에 구글·애플을 연결합니다. 사용자 번호가 그대로라서 편지·친구가 유지됩니다.
 * 이미 그 구글/애플로 만든 계정이 있으면(예: 새 폰) 그 계정으로 들어가고 switched=true 를 돌려줍니다.
 */
export async function linkAccount(kind: LoginKind): Promise<LinkResult> {
  if (kind === "kakao") { startKakaoLogin(); return { ok: true, switched: false }; } // 카카오 화면으로 이동(돌아오면 /auth/kakao 가 마무리)
  if (!firebaseEnabled) return { ok: false, message: "서버에 연결된 뒤에 쓸 수 있어요." };
  if (nativeLoginReady()) return linkNative(kind);
  try {
    const user = await ensureUser();
    try {
      await linkWithPopup(user, provider(kind), browserPopupRedirectResolver);
      return { ok: true, switched: false };
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === "auth/credential-already-in-use" || code === "auth/email-already-in-use") {
        await signInWithPopup(auth(), provider(kind), browserPopupRedirectResolver);
        return { ok: true, switched: true };
      }
      throw e;
    }
  } catch (e) {
    return { ok: false, message: friendlyError((e as { code?: string }).code) };
  }
}

/** 앱 안: 폰 기본 창 → 익명 계정에 연결(편지·친구 유지), 이미 그 계정이 있으면 그 계정으로 들어가요 */
async function linkNative(kind: LoginKind): Promise<LinkResult> {
  let cred: AuthCredential;
  try { cred = await nativeCredential(kind); }
  catch (e) { return { ok: false, message: nativeCancelled(e) ? "연결을 취소했어요." : friendlyError((e as { code?: string }).code) }; }
  try {
    const user = await ensureUser();
    try {
      await linkWithCredential(user, cred);
      return { ok: true, switched: false };
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === "auth/credential-already-in-use" || code === "auth/email-already-in-use") {
        const again = (kind === "google" ? GoogleAuthProvider.credentialFromError(e as never) : OAuthProvider.credentialFromError(e as never)) ?? cred;
        await signInWithCredential(auth(), again);
        return { ok: true, switched: true };
      }
      throw e;
    }
  } catch (e) {
    return { ok: false, message: friendlyError((e as { code?: string }).code) };
  }
}

/**
 * 계정 삭제 전: 애플로 로그인한 계정이면 애플 로그인 허락을 거둬요(애플 심사 5.1.1(v) "계정 삭제 때 애플 토큰 철회").
 * 앱 안은 폰 기본 창으로 한 번 더 확인 → 받은 코드로 Firebase에 철회 요청, 웹은 애플 팝업으로 한 번 더 확인.
 * Firebase 콘솔 Apple 로그인에 팀 ID·키 ID·비공개 키가 들어가 있어야 철회가 돼요(docs/앱스토어-심사.md).
 * 취소하면 "cancelled"(삭제를 멈춤), 철회 요청만 실패하면 "failed"(삭제는 계속).
 */
export async function revokeAppleIfLinked(): Promise<"none" | "revoked" | "failed" | "cancelled"> {
  const u = auth().currentUser;
  if (!u || !u.providerData.some((p) => p.providerId === "apple.com")) return "none";
  try {
    if (nativeLoginReady()) {
      const { FirebaseAuthentication } = await import("@capacitor-firebase/authentication");
      let code: string | undefined;
      try { code = (await FirebaseAuthentication.signInWithApple({ scopes: [] })).credential?.authorizationCode; }
      catch (e) { return nativeCancelled(e) ? "cancelled" : "failed"; }
      if (!code) return "failed";
      const r = await fetch(`https://identitytoolkit.googleapis.com/v2/accounts:revokeToken?key=${firebaseApiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId: "apple.com", tokenType: "CODE", token: code, idToken: await u.getIdToken() }),
      });
      return r.ok ? "revoked" : "failed";
    }
    let token: string | undefined;
    try { token = OAuthProvider.credentialFromResult(await reauthenticateWithPopup(u, provider("apple"), browserPopupRedirectResolver))?.accessToken; }
    catch (e) { return /popup-closed|cancelled/.test(String((e as { code?: string }).code)) ? "cancelled" : "failed"; }
    if (!token) return "failed";
    await revokeAccessToken(auth(), token);
    return "revoked";
  } catch {
    return "failed";
  }
}

export async function unlinkAccount(kind: LoginKind): Promise<LinkResult> {
  const id = PROVIDER_ID[kind];
  const u = auth().currentUser;
  if (!id || !u) return { ok: false, message: "연결된 계정이 없어요." };
  try {
    await unlink(u, id);
    return { ok: true, switched: false };
  } catch (e) {
    return { ok: false, message: friendlyError((e as { code?: string }).code) };
  }
}

function friendlyError(code?: string) {
  switch (code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "연결을 취소했어요.";
    case "auth/popup-blocked":
      return "팝업이 막혀 있어요. 팝업을 허용하고 다시 눌러 주세요.";
    case "auth/operation-not-allowed":
    case "auth/unauthorized-domain":
      return "아직 이 로그인이 준비되지 않았어요. 곧 열릴게요.";
    case "auth/network-request-failed":
      return "인터넷 연결을 확인해 주세요.";
    default:
      return "연결하지 못했어요. 잠시 뒤에 다시 해 주세요.";
  }
}
