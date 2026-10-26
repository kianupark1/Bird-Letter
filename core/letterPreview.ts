import { getBird } from "./birds";
import { getRoute } from "./routes";
import { withIGa } from "./korean";

/** 링크 미리보기 카드 기본 문구(편지를 못 읽었거나 예약 편지일 때) */
export const PREVIEW_DEFAULT = { title: "새가 편지를 물고 날아오고 있어요", description: "소식은 날아서 와요. 같이 기다려 보세요." };

export type PreviewMeta = { fromName?: string; birdId?: string; routeId?: string; departAt?: number; penpal?: boolean };

/**
 * 카카오톡·문자에 링크를 붙였을 때 보이는 카드 문구(2026-10-26 대표님: "초대가 믿음직해야 해").
 * 아는 사람 이름이 보여야 눌러 봐요. 편지 내용·받는 사람 이름은 넣지 않아요.
 * 예약 편지(출발 전)와 펜팔 편지(진짜 이름이 아님)는 기본 문구를 그대로 써요.
 */
export function previewText(m: PreviewMeta | null, now: number) {
  if (!m || m.penpal || (m.departAt && m.departAt > now)) return PREVIEW_DEFAULT;
  const name = (m.fromName ?? "").trim().slice(0, 12);
  if (!name) return PREVIEW_DEFAULT;
  const bird = getBird(m.birdId ?? "");
  let where = "";
  try { const r = m.routeId ? getRoute(m.routeId) : null; if (r) where = ` ${r.title} ${r.km}km를`; } catch {}
  return {
    title: `${name}님이 보낸 편지가 날아오고 있어요 🕊`,
    description: `${withIGa(bird.name)}${where} 날아가는 중이에요. 눌러서 지금 어디쯤인지 같이 봐요.`,
  };
}
