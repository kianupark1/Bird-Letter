"use client";
import { MAX_PHOTO_CHARS, PHOTO_MAX_SIDE } from "../../core/limits";

/** 사진 파일을 이미지로 읽어요(회전 정보는 브라우저가 반영해 줘요) */
function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("read")); };
    img.src = url;
  });
}

/**
 * 사진을 줄여서 JPEG 글자(data URL)로 바꿔요.
 * - 긴 변 1080px 이하로, 서버 한도(MAX_PHOTO_CHARS) 안에 들어올 때까지 화질을 낮춰요.
 * - 캔버스로 다시 그리기 때문에 촬영 위치·기기 정보 같은 숨은 정보(EXIF)가 모두 사라져요.
 */
export async function compressPhoto(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("not-image");
  const img = await loadImage(file);
  let side = PHOTO_MAX_SIDE;
  for (let round = 0; round < 4; round++) {
    const scale = Math.min(1, side / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale)), h = Math.max(1, Math.round(img.naturalHeight * scale));
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) throw new Error("canvas");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h); // 투명한 사진(PNG)은 흰 바탕으로
    ctx.drawImage(img, 0, 0, w, h);
    for (const q of [0.82, 0.72, 0.62, 0.52, 0.42]) {
      const url = c.toDataURL("image/jpeg", q);
      if (url.length <= MAX_PHOTO_CHARS) return url;
    }
    side = Math.round(side * 0.75); // 그래도 크면 크기를 더 줄여요
  }
  throw new Error("too-big");
}

const W = 1080, H = 1320, M = 60;

/** 폴라로이드 그림(PNG)을 만들어요: 흰 틀 + 정사각형 사진 + 아래 글씨 */
export async function polaroidBlob(photoUrl: string, caption: string, sub = ""): Promise<Blob> {
  const img = await loadImage(await (await fetch(photoUrl)).blob());
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fdfbf6"; ctx.fillRect(0, 0, W, H);
  // 사진: 정사각형으로 가운데를 잘라 채워요
  const box = W - M * 2;
  const s = Math.min(img.naturalWidth, img.naturalHeight);
  ctx.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, M, M, box, box);
  ctx.strokeStyle = "rgba(0,0,0,.08)"; ctx.lineWidth = 2; ctx.strokeRect(M, M, box, box);
  ctx.fillStyle = "#2b211a"; ctx.textAlign = "center";
  ctx.font = "italic 54px 'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
  ctx.fillText(caption.slice(0, 22), W / 2, M + box + 120);
  if (sub) { ctx.fillStyle = "#6b5b4e"; ctx.font = "36px 'Pretendard', sans-serif"; ctx.fillText(sub.slice(0, 30), W / 2, M + box + 185); }
  ctx.fillStyle = "#c1481f"; ctx.font = "bold 32px 'Pretendard', sans-serif"; ctx.textAlign = "right";
  ctx.fillText("새 편지", W - M - 10, H - 40);
  return await new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("blob"))), "image/png"));
}

/** 폰에 저장: 공유 창(저장 포함)이 되면 그걸 쓰고, 안 되면 파일로 내려받아요 */
export async function savePolaroid(photoUrl: string, caption: string, sub = ""): Promise<"shared" | "downloaded"> {
  const blob = await polaroidBlob(photoUrl, caption, sub);
  const file = new File([blob], "saepyeonji-polaroid.png", { type: "image/png" });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try { await nav.share({ files: [file], title: "새편지 폴라로이드" }); return "shared"; } catch (e) { if ((e as Error).name === "AbortError") return "shared"; }
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = file.name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  return "downloaded";
}

/**
 * 프로필 사진: 가운데를 정사각형으로 잘라 192px JPEG로 줄여요(친구 목록에 함께 저장돼서 아주 작게).
 * 서버 규칙 한도 30,000글자 안에 들어올 때까지 화질을 낮춰요. 숨은 정보(EXIF)도 사라져요.
 */
export async function compressAvatar(file: Blob): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("not-image");
  const img = await loadImage(file);
  const s = Math.min(img.naturalWidth, img.naturalHeight);
  for (const side of [192, 144, 112]) {
    const c = document.createElement("canvas");
    c.width = side; c.height = side;
    const ctx = c.getContext("2d");
    if (!ctx) throw new Error("canvas");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, side, side);
    ctx.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, side, side);
    for (const q of [0.8, 0.68, 0.56, 0.44]) {
      const url = c.toDataURL("image/jpeg", q);
      if (url.length <= 30000) return url;
    }
  }
  throw new Error("too-big");
}
