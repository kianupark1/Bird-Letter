"use client";

/**
 * 연락처에서 한 명을 골라 문자로 초대 링크를 보낸다.
 * 고른 이름·번호는 문자 앱을 여는 데만 쓰고 서버로 보내거나 저장하지 않는다(번호 매칭은 법무 검토 뒤 다음 단계).
 * 연락처 선택기는 스토어 앱(안드로이드·아이폰)과 안드로이드 크롬에만 있고 아이폰 웹에는 없다.
 */
type Picker = { select(props: string[], opts?: { multiple?: boolean }): Promise<{ name?: string[]; tel?: string[] }[]> };

const picker = (): Picker | null => {
  if (typeof navigator === "undefined") return null;
  const c = (navigator as unknown as { contacts?: Picker }).contacts;
  return c && typeof c.select === "function" ? c : null;
};

/** 스토어 앱(Capacitor) 안인지. 앱에서는 폰 기본 연락처 고르기 창(@capacitor-community/contacts)을 써요(아이폰도 됨) */
const inApp = () => typeof window !== "undefined" && !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.();

export const contactPickerSupported = () => inApp() || picker() !== null;

export type PickedContact = { name: string; tel: string };

/** 연락처 한 명 선택. 취소하거나 전화번호가 없으면 null */
export async function pickContact(): Promise<PickedContact | null> {
  if (inApp()) {
    // 고른 한 명의 이름·번호만 읽어요(전체 연락처를 훑거나 서버로 보내지 않음). 안드로이드는 처음 한 번 연락처 권한을 물어요
    try {
      const { Contacts } = await import("@capacitor-community/contacts");
      const { contact } = await Contacts.pickContact({ projection: { name: true, phones: true } });
      const tel = contact?.phones?.find((x) => x.number)?.number?.replace(/[^\d+]/g, "");
      if (!tel) return null;
      return { name: (contact.name?.display || [contact.name?.family, contact.name?.given].filter(Boolean).join("") || "").trim(), tel };
    } catch {
      return null;
    }
  }
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
