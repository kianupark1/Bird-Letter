"use client";
import { PhoneAuthProvider, RecaptchaVerifier, linkWithPhoneNumber, signInWithCredential, type ConfirmationResult } from "firebase/auth";
import { auth, ensureUser, firebaseEnabled } from "./client";

/**
 * 휴대폰 번호(문자 인증)로 시작·받기(2026-10-26 대표님: "문자로 받기도"). Firebase 전화 인증을 써요.
 * 켜려면: Firebase 요금제 Blaze + 로그인 방법에서 "전화" 사용 설정 + Vercel NEXT_PUBLIC_PHONE_LOGIN=1(그 전에는 버튼이 안 보여요).
 * 번호는 로그인 확인에만 쓰고(Firebase 로그인 정보에만 남음) 친구·다른 사람에게 보이지 않아요.
 */
export const PHONE_LOGIN_READY = firebaseEnabled && process.env.NEXT_PUBLIC_PHONE_LOGIN === "1";

let verifier: RecaptchaVerifier | null = null;
let pending: ConfirmationResult | null = null;

/** 인증번호 문자 보내기. boxId = 보이지 않는 로봇 확인을 붙일 빈 칸(div) id */
export async function sendCode(e164: string, boxId: string): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const a = auth();
    a.languageCode = "ko";
    if (!verifier) verifier = new RecaptchaVerifier(a, boxId, { size: "invisible" });
    const user = await ensureUser();
    pending = await linkWithPhoneNumber(user, e164, verifier);
    return { ok: true };
  } catch (e) {
    try { verifier?.clear(); } catch {}
    verifier = null;
    return { ok: false, message: friendly((e as { code?: string }).code) };
  }
}

/** 받은 6자리 확인. 이미 그 번호로 만든 계정이 있으면 그 계정으로 들어가요(switched) */
export async function confirmCode(code: string): Promise<{ ok: true; switched: boolean } | { ok: false; message: string }> {
  if (!pending) return { ok: false, message: "인증번호를 먼저 받아 주세요." };
  try {
    await pending.confirm(code.trim());
    pending = null;
    return { ok: true, switched: false };
  } catch (e) {
    const c = (e as { code?: string }).code;
    if (c === "auth/credential-already-in-use" || c === "auth/account-exists-with-different-credential") {
      const cred = PhoneAuthProvider.credentialFromError(e as never);
      if (cred) { await signInWithCredential(auth(), cred); pending = null; return { ok: true, switched: true }; }
    }
    return { ok: false, message: friendly(c) };
  }
}

function friendly(code?: string) {
  switch (code) {
    case "auth/invalid-phone-number": return "휴대폰 번호를 다시 확인해 주세요.";
    case "auth/invalid-verification-code": return "인증번호가 맞지 않아요. 문자의 6자리를 다시 넣어 주세요.";
    case "auth/code-expired": return "인증번호 시간이 지났어요. 다시 받아 주세요.";
    case "auth/too-many-requests": return "너무 여러 번 시도했어요. 잠시 뒤에 다시 해 주세요.";
    case "auth/provider-already-linked": return "이미 번호가 연결된 계정이에요.";
    case "auth/network-request-failed": return "인터넷 연결을 확인해 주세요.";
    case "auth/operation-not-allowed":
    case "auth/billing-not-enabled": return "문자 로그인은 아직 준비 중이에요. 카카오로 받아 주세요.";
    default: return "문자를 보내지 못했어요. 잠시 뒤에 다시 해 주세요.";
  }
}
