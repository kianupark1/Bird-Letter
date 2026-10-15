/**
 * 예약 발송: 편지를 쓰고 "나중에 출발"을 고르면 그 시각에 새가 출발해요.
 * 출발 전에는 받는 사람에게 보이지 않아요(기다림의 미학: 깜짝 선물).
 * 편지의 "비행 시작 시각(sentAt)"은 예약이면 출발 시각이라서 비행·알림 계산은 그대로 써요.
 * ⚠️ MAX_SCHEDULE_DAYS는 firebase/firestore.rules의 366일과 같아야 해요.
 */
export const MAX_SCHEDULE_DAYS = 366;
/** 지금부터 최소 이만큼 뒤여야 "예약"이에요(너무 가까우면 그냥 지금 출발) */
export const MIN_SCHEDULE_LEAD_MS = 60_000;

/** 아직 출발 전인(예약 중인) 편지인지. flightStart는 비행 시작 시각(ms) */
export const isScheduled = (flightStart: number, now: number) => flightStart > now;

/** 출발 시각이 올바른지 확인해서, 문제가 있으면 안내 문구를 돌려줘요 */
export function validateDepart(departMs: number | null, now: number): string | null {
  if (departMs === null || !Number.isFinite(departMs)) return "출발할 날짜와 시각을 골라 주세요.";
  if (departMs < now + MIN_SCHEDULE_LEAD_MS) return "출발 시각은 지금보다 1분 이상 뒤여야 해요.";
  if (departMs > now + MAX_SCHEDULE_DAYS * 24 * 3600 * 1000 - 3600 * 1000) return `출발은 최대 ${MAX_SCHEDULE_DAYS - 1}일 뒤까지 예약할 수 있어요.`;
  return null;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** 날짜·시각 입력칸(datetime-local) 값 ↔ 밀리초. 입력칸은 사용자 기기의 시간대로 해석해요 */
export function toInputValue(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
export function fromInputValue(v: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(v);
  if (!m) return null;
  const ms = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]).getTime();
  return Number.isFinite(ms) ? ms : null;
}

/** "10월 25일 오전 9:00" 같은 표시 */
export function dateTimeText(ms: number): string {
  const d = new Date(ms);
  const h = d.getHours();
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${h < 12 ? "오전" : "오후"} ${h % 12 === 0 ? 12 : h % 12}:${pad(d.getMinutes())}`;
}

/** "오후 5시 20분" 같은 시각만 표시(분이 0이면 "오후 5시") */
export function clockText(ms: number): string {
  const d = new Date(ms);
  const h = d.getHours(), m = d.getMinutes();
  return `${h < 12 ? "오전" : "오후"} ${h % 12 === 0 ? 12 : h % 12}시${m ? ` ${m}분` : ""}`;
}
