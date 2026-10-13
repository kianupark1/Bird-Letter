"use client";
import { useEffect, useRef, useState } from "react";

/**
 * 돌돌 말려 있다가 펼쳐지는 틀: 위아래 막대(두루마리 축) 사이로 종이가 내려오면서 서서히 나타나요.
 * open이 true가 되면 delay(ms) 뒤부터 펼쳐져요. 움직임 줄이기 설정이면 바로 펼쳐져요(CSS).
 */
export function Unroll({ open, delay = 0, className = "", children }: { open: boolean; delay?: number; className?: string; children: React.ReactNode }) {
  return (
    <div className={`unroll ${open ? "open" : ""} ${className}`} style={{ ["--delay" as string]: `${delay}ms` }}>
      <div className="u-rod" aria-hidden />
      <div className="u-body"><div className="u-inner">{children}</div></div>
      <div className="u-rod" aria-hidden />
    </div>
  );
}

/** 돌돌 말린 사진 한 장: 펼쳐진 뒤 폴라로이드가 서서히 선명해져요(현상되는 효과) */
export function PolaroidPhoto({ src, caption, sub, open, delay = 0, tilt = 0, onSave }: {
  src: string; caption: string; sub?: string; open: boolean; delay?: number; tilt?: number; onSave?: () => void;
}) {
  return (
    <Unroll open={open} delay={delay} className="photoroll">
      <div className="pr-pad">
        <figure className="polaroid dev" style={{ ["--tilt" as string]: `${tilt}deg`, ["--dev-delay" as string]: `${delay + 900}ms` }}>
          <div className="pol-photo"><img src={src} alt="편지에 담긴 사진" /></div>
          <figcaption><b>{caption}</b>{sub && <span>{sub}</span>}</figcaption>
        </figure>
        {onSave && <button type="button" className="pol-save" onClick={onSave}>이 폴라로이드를 폰에 저장</button>}
      </div>
    </Unroll>
  );
}

/**
 * 도착한 편지 보여 주기: 돌돌 말린 두루마리를 눌러서 펼치면 → 편지가 펼쳐지고 → 사진이 하나씩 펼쳐져요.
 * (기다림의 미학: 열기 전 한 번 더 설레게)
 */
export default function LetterReveal({ message, photos, caption, sub, loading, onSave }: {
  message: string; photos: string[]; caption: string; sub?: string; loading?: boolean; onSave?: (src: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => { btn.current?.focus({ preventScroll: true }); }, []);
  const PHOTO_START = 1300, STEP = 1100;
  return (
    <div className="reveal">
      <div className={`scrollwrap ${open ? "opened" : ""}`} onClick={() => !open && setOpen(true)}>
        <Unroll open={open} className="scrollpaper">
          <div className="msg">{message || (loading ? "편지를 펼치는 중..." : "")}</div>
          <div className="seal" aria-hidden>새<br />편지</div>
        </Unroll>
      </div>
      {!open && (
        <button ref={btn} type="button" className="scroll-open" onClick={() => setOpen(true)}>
          <b>편지 펼치기</b>
          <small>돌돌 말린 편지를 눌러서 천천히 펼쳐 보세요</small>
        </button>
      )}
      {photos.length > 0 && (
        <div className="photos" aria-label="편지에 담긴 사진">
          {photos.map((src, i) => (
            <PolaroidPhoto key={i} src={src} caption={caption} sub={sub} open={open} delay={PHOTO_START + i * STEP}
              tilt={[-2.2, 1.8, -1.2][i % 3]} onSave={onSave ? () => onSave(src) : undefined} />
          ))}
        </div>
      )}
    </div>
  );
}
