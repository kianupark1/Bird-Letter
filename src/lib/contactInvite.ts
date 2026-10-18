"use client";

/**
 * 연락처에서 한 명을 골라 문자로 초대 링크를 보낸다.
 * 고른 이름·번호는 문자 앱을 여는 데만 쓰고 서버로 보내거나 저장하지 않는다(번호 매칭은 법무 검토 뒤 다음 단계).
 * 연락처 선택기는 안드로이드 크롬 등에서만 있고 아이폰 웹에는 없다 → 없으면 버튼을 숨긴다.
 */
type Picker = { select(props: string[], opts?: { multiple?: boolean }): Promise<{ name?: string[]; tel?: string[] }[]> };

const picker = (): Picker | null => {
  if (typeof navigator === "undefined") return null;
  const c = (navigator as unknown as { contacts?: Picker }).contacts;
  return c && typeof c.select === "function" ? c : null;
};

export const contactPickerSupported = () => picker() !== null;

export type PickedContact = { name: string; tel: string };

/** 연락처 한 명 선택. 취소하거나 전화번호가 없으면 null */
export async function pickContact(): Promise<PickedContact | null> {
  const p = picker();
  if (!p) return null;
  try {
    const [c] = await p.select(["name", "tel"], { multiple: false });
    const tel = c?.tel?.[0]?.replace(/[^\d+]/g, "");
    if (!tel) return null;
    return { name: c?.name?.[0]?.trim() || "", tel };
  } catch {
    return null;
  }
}

/** 문자 앱을 여는 주소(sms:). 아이폰은 &body=, 그 밖(안드로이드)은 ?body= 를 써요. 번호가 없으면 문자 앱에서 받는 사람을 고르게 해요 */
export const smsHref = (tel: string, body: string) => {
  const ios = typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);
  return `sms:${tel.replace(/[^\d+]/g, "")}${ios ? "&" : "?"}body=${encodeURIComponent(body)}`;
};
