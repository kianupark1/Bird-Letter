"use client";
/**
 * 지도 공유 사진(8차 시안): 날아가는 지도를 세로 사진(1080×1920)으로 그려서 인스타·카카오톡으로 보내요.
 * 글은 core/shareCard.ts, 땅 모양은 앱 지도와 같은 실제 해안선(core/koreaGeo). 편지 내용·진짜 이름·사진은 넣지 않아요.
 * 보내기: 스토어 앱은 폰 공유 창(@capacitor/share), 웹은 공유 창(Web Share)이 되면 그것, 안 되면 사진 내려받기.
 */
import { LAND, decodeRing } from "../../core/koreaGeo";
import { SHARE_H, SHARE_W, shareCurve, shareProjector, shareText, type ShareInput } from "../../core/shareCard";

// 공유 사진은 화면 모드와 상관없이 늘 밝은 한지 색으로(새 그림의 색 변수도 밝은 값으로 채워요)
const LIGHT_VARS = "--dahong:#C1481F;--namsaek:#1E3A5C;--hwangto:#E0A83C;--cheongrok:#1B6E5C;--b-cream:#FBF3E4;--b-ink:#2A2118;--b-brown:#8A5A3C;--b-brown2:#5B3A29;--b-grey:#9AA8B8;--b-grey2:#6F8094;--b-edge:rgba(42,33,24,.35)";
const INK = "#2A2118", RED = "#C1481F";

function loadSvg(svg: string): Promise<HTMLImageElement> {
  return new Promise((ok, no) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => no(new Error("bird-image"));
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  });
}

/** 화면에 그려 둔 새 그림(BirdIcon svg)을 밝은 색으로 고정해 사진용 그림으로 바꿔요 */
function birdSvgText(el: SVGSVGElement, w: number) {
  const c = el.cloneNode(true) as SVGSVGElement;
  c.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  c.setAttribute("width", String(w));
  c.setAttribute("height", String(w * 0.8));
  c.setAttribute("style", `${LIGHT_VARS};overflow:visible`);
  return new XMLSerializer().serializeToString(c);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** 하얀 카드(아래로 살짝 그림자) */
function card(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.fillStyle = "rgba(42,33,24,.08)";
  roundRect(ctx, x, y + 12, w, h, r); ctx.fill();
  ctx.fillStyle = "#fff";
  roundRect(ctx, x, y, w, h, r); ctx.fill();
}

/** 글씨가 칸보다 넓으면 줄여서 맞춰요 */
function fit(ctx: CanvasRenderingContext2D, text: string, weight: number, size: number, max: number, family: string) {
  let s = size;
  ctx.font = `${weight} ${s}px ${family}`;
  while (ctx.measureText(text).width > max && s > 24) { s -= 2; ctx.font = `${weight} ${s}px ${family}`; }
  return s;
}

/** 공유 사진 만들기. bird = 화면에 숨겨 둔 새 그림(svg) */
export async function makeShareImage(input: ShareInput, bird: SVGSVGElement | null): Promise<Blob> {
  const W = SHARE_W, H = SHARE_H;
  const cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const ctx = cv.getContext("2d");
  if (!ctx) throw new Error("canvas");
  try { await document.fonts.ready; } catch {}
  const family = getComputedStyle(document.body).fontFamily || "sans-serif";
  const t = shareText(input);
  const a = input.route.from, b = input.route.to;

  // 바다·땅
  const P = shareProjector(a, b);
  ctx.fillStyle = "#D5E5EB"; ctx.fillRect(0, 0, W, H);
  const land = new Path2D();
  for (const ring of Object.values(LAND).flat()) {
    decodeRing(ring).forEach(([lng, lat], i) => { const [x, y] = P(lng, lat); if (i) land.lineTo(x, y); else land.moveTo(x, y); });
    land.closePath();
  }
  ctx.fillStyle = "#EFE3CC"; ctx.fill(land);
  ctx.strokeStyle = "#B3A27C"; ctx.lineWidth = 2.2; ctx.lineJoin = "round"; ctx.stroke(land);

  // 길: 앞으로 갈 길은 점선, 날아온 길은 굵은 선
  const c = shareCurve(P, a, b);
  ctx.lineCap = "round";
  ctx.strokeStyle = RED; ctx.lineWidth = 7; ctx.setLineDash([2, 16]);
  ctx.beginPath(); ctx.moveTo(c.x0, c.y0); ctx.quadraticCurveTo(c.cx, c.cy, c.x1, c.y1); ctx.stroke();
  ctx.setLineDash([]);
  const p = input.done ? 1 : Math.min(1, Math.max(0, input.p));
  if (p > 0) {
    ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(c.x0, c.y0);
    for (let i = 1; i <= 60; i++) { const q = c.at((i / 60) * p); ctx.lineTo(q.x, q.y); }
    ctx.stroke();
  }
  for (const [x, y, col] of [[c.x0, c.y0, RED], [c.x1, c.y1, "#1B6E5C"]] as const) {
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(x, y, 20, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 14, 0, Math.PI * 2); ctx.fill();
  }
  // 출발·도착 이름표(새와 겹치지 않게 점 아래쪽)
  for (const [x, y, name] of [[c.x0, c.y0, a.name], [c.x1, c.y1, b.name]] as const) {
    ctx.font = `800 32px ${family}`;
    const tw = ctx.measureText(name).width;
    const bx = Math.min(W - tw - 60, Math.max(20, x - tw / 2 - 20));
    ctx.fillStyle = "rgba(255,255,255,.92)"; roundRect(ctx, bx, y + 30, tw + 40, 54, 27); ctx.fill();
    ctx.fillStyle = INK; ctx.textBaseline = "middle"; ctx.fillText(name, bx + 20, y + 58);
  }

  // 새(편지를 문 모습)
  if (bird) {
    try {
      const img = await loadSvg(birdSvgText(bird, 260));
      const q = c.at(p);
      ctx.drawImage(img, q.x - 130, q.y - 150, 260, 208);
    } catch {}
  }

  // 맨 위 알약
  ctx.textBaseline = "middle"; ctx.textAlign = "center";
  const ps = fit(ctx, t.pill, 850, 60, W - 240, family);
  const pw = Math.min(W - 120, ctx.measureText(t.pill).width + 100);
  card(ctx, (W - pw) / 2, 110, pw, ps + 46, (ps + 46) / 2);
  ctx.fillStyle = INK; ctx.fillText(t.pill, W / 2, 110 + (ps + 46) / 2 + 2);

  // 아래 카드
  const cx0 = 70, cw = W - 140, top = 1330, pad = 42;
  const h = t.center ? 210 : 290;
  card(ctx, cx0, top, cw, h, 44);
  ctx.textAlign = "left";
  const [pre, hl, post] = t.title;
  const ts = fit(ctx, pre + hl + post, 850, 54, cw - pad * 2, family);
  ctx.font = `850 ${ts}px ${family}`;
  const wPre = ctx.measureText(pre).width, wHl = ctx.measureText(hl).width, wAll = ctx.measureText(pre + hl + post).width;
  let x = t.center ? (W - wAll) / 2 : cx0 + pad;
  const ty = top + 36 + ts / 2;
  ctx.fillStyle = INK; ctx.fillText(pre, x, ty); x += wPre;
  ctx.fillStyle = RED; ctx.fillText(hl, x, ty); x += wHl;
  ctx.fillStyle = INK; ctx.fillText(post, x, ty);
  ctx.globalAlpha = 0.75;
  fit(ctx, t.sub, 500, 38, cw - pad * 2, family);
  ctx.textAlign = t.center ? "center" : "left";
  ctx.fillText(t.sub, t.center ? W / 2 : cx0 + pad, ty + ts / 2 + 40);
  ctx.globalAlpha = 1;
  if (t.bar !== null) {
    const by = ty + ts / 2 + 80, bw = cw - pad * 2;
    ctx.fillStyle = "rgba(42,33,24,.12)"; roundRect(ctx, cx0 + pad, by, bw, 20, 10); ctx.fill();
    if (t.bar > 0) { ctx.fillStyle = "#E0A83C"; roundRect(ctx, cx0 + pad, by, Math.max(20, bw * t.bar), 20, 10); ctx.fill(); }
    ctx.fillStyle = INK; ctx.font = `800 40px ${family}`;
    ctx.fillText(t.foot, cx0 + pad, by + 64);
  }

  // 맨 아래 앱 이름
  ctx.textAlign = "center";
  ctx.fillStyle = INK; ctx.font = `800 34px ${family}`; ctx.fillText("새 편지", W / 2, H - 120);
  ctx.globalAlpha = 0.7; ctx.font = `600 26px ${family}`; ctx.fillText("기다림이 즐거운 편지", W / 2, H - 80);
  ctx.globalAlpha = 1;

  return new Promise((ok, no) => cv.toBlob((bl) => (bl ? ok(bl) : no(new Error("blob"))), "image/png"));
}

const isNative = () => typeof window !== "undefined" && !!(window as any).Capacitor?.isNativePlatform?.();
const FILE = "saepyeonji-map.png";

function toBase64(blob: Blob): Promise<string> {
  return new Promise((ok, no) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result).split(",")[1] ?? "");
    r.onerror = () => no(new Error("read"));
    r.readAsDataURL(blob);
  });
}

/** 공유 창 열기 → "shared"(보냄·닫음) / "downloaded"(공유 창이 없어 사진으로 내려받음) */
export async function shareImage(blob: Blob): Promise<"shared" | "downloaded"> {
  if (isNative()) {
    try {
      const [{ Filesystem, Directory }, { Share }] = await Promise.all([import("@capacitor/filesystem"), import("@capacitor/share")]);
      const w = await Filesystem.writeFile({ path: FILE, data: await toBase64(blob), directory: Directory.Cache });
      await Share.share({ files: [w.uri], dialogTitle: "새 편지 지도 보내기" });
      return "shared";
    } catch (e) {
      if (/cancel/i.test(String((e as Error)?.message ?? e))) return "shared";
      // 예전에 설치한 앱(공유 기능이 없는 버전)은 아래 웹 방식으로
    }
  }
  const file = new File([blob], FILE, { type: "image/png" });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try { await nav.share({ files: [file] }); return "shared"; } catch (e) { if ((e as Error).name === "AbortError") return "shared"; }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = FILE;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return "downloaded";
}
