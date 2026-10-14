/**
 * 카카오 로그인 서버 흐름(밖과 통신하는 부분은 deps로 받아서 시험할 수 있게 분리).
 * 1) 카카오가 준 code → 카카오 토큰 → 카카오 사용자 번호
 * 2) 폰의 Firebase 토큰으로 "지금 쓰던 익명 계정"을 확인
 * 3) kakaoAccounts/{카카오번호} 에 uid를 한 번만 기록(이미 있으면 그 uid로 → 새 폰에서도 같은 계정)
 *    처음 연결이면 지금 쓰던 익명 uid를 그대로 써서 편지·친구가 유지된다.
 * 4) 그 uid로 Firebase 커스텀 토큰을 발급한다.
 */
export type KakaoDeps = {
  /** code를 카카오 사용자 번호로 바꾼다(실패하면 던짐) */
  kakaoUserId(code: string): Promise<string>;
  /** 폰이 보낸 Firebase ID 토큰 확인 결과 */
  verifyIdToken(idToken: string): Promise<{ uid: string; claims: Record<string, unknown> } | null>;
  /** 카카오번호에 uid를 처음 기록하면 true, 이미 있으면 false */
  claimAccount(kakaoId: string, uid: string): Promise<boolean>;
  /** 이미 기록된 uid(없으면 null) */
  accountUid(kakaoId: string): Promise<string | null>;
  mintToken(uid: string, claims: Record<string, unknown>): string;
};

export type KakaoResult =
  | { ok: true; customToken: string; uid: string; switched: boolean }
  | { ok: false; status: number; error: "bad-request" | "kakao-failed" | "bad-token" | "other-kakao" | "busy" };

export async function loginWithKakao(input: { code?: unknown; idToken?: unknown }, deps: KakaoDeps): Promise<KakaoResult> {
  if (typeof input.code !== "string" || input.code.length < 5 || input.code.length > 600 || typeof input.idToken !== "string" || input.idToken.length > 4000) {
    return { ok: false, status: 400, error: "bad-request" };
  }
  const me = await deps.verifyIdToken(input.idToken);
  if (!me) return { ok: false, status: 401, error: "bad-token" };

  let kakaoId: string;
  try {
    kakaoId = await deps.kakaoUserId(input.code);
  } catch {
    return { ok: false, status: 401, error: "kakao-failed" };
  }
  if (!/^\d{1,20}$/.test(kakaoId)) return { ok: false, status: 401, error: "kakao-failed" };

  const claims = { kakao: true, kakaoId };
  const existing = await deps.accountUid(kakaoId);
  if (existing) {
    // 이미 연결된 카카오 계정: 그 계정으로 들어간다(새 폰 등). 지금 쓰던 익명 계정은 비어 있다고 보고 버린다.
    return { ok: true, customToken: deps.mintToken(existing, claims), uid: existing, switched: existing !== me.uid };
  }
  // 이 익명 계정에 이미 다른 카카오가 연결돼 있으면 거절(한 계정에 카카오 하나)
  const had = me.claims.kakaoId;
  if (typeof had === "string" && had !== kakaoId) return { ok: false, status: 409, error: "other-kakao" };

  const first = await deps.claimAccount(kakaoId, me.uid);
  if (!first) {
    // 동시에 다른 요청이 먼저 기록함 → 기록된 것을 다시 읽어서 따른다
    const again = await deps.accountUid(kakaoId);
    if (!again) return { ok: false, status: 503, error: "busy" };
    return { ok: true, customToken: deps.mintToken(again, claims), uid: again, switched: again !== me.uid };
  }
  return { ok: true, customToken: deps.mintToken(me.uid, claims), uid: me.uid, switched: false };
}
