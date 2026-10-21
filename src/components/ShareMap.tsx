"use client";
/**
 * 지도 공유(8차 시안): [📸 공유]를 누르면 아래에서 시트가 올라와 사진을 미리 보여 주고, [보내기]로 인스타·카카오톡 공유 창을 열어요.
 * 사진에는 편지 내용·진짜 이름·사진이 들어가지 않아요. 상대 이름(내가 부르는 이름)은 끌 수 있어요.
 */
import { useEffect, useRef, useState } from "react";
import BirdIcon from "@/components/BirdIcon";
import { makeShareImage, shareImage } from "@/lib/shareMap";
import type { ShareInput } from "../../core/shareCard";

type Props = { input: Omit<ShareInput, "name">; name?: string; birdId: string; onClose: () => void };

export default function ShareMap({ input, name, birdId, onClose }: Props) {
  const birdRef = useRef<HTMLDivElement>(null);
  const [withName, setWithName] = useState(!!name);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  // 시트를 여는 순간의 모습으로 한 번 그려요(1초마다 다시 그리지 않게, 이름 켜고 끌 때만 다시)
  const snap = useRef(input);
  useEffect(() => {
    let off = false, made = "";
    setBlob(null);
    makeShareImage({ ...snap.current, name: withName ? name : undefined }, birdRef.current?.querySelector("svg") ?? null)
      .then((b) => { if (off) return; made = URL.createObjectURL(b); setBlob(b); setUrl(made); })
      .catch(() => { if (!off) setMsg("사진을 만들지 못했어요. 잠시 후 다시 해 주세요."); });
    return () => { off = true; if (made) URL.revokeObjectURL(made); };
  }, [withName, name]);

  const send = async () => {
    if (!blob || busy) return;
    setBusy(true);
    try {
      const r = await shareImage(blob);
      setMsg(r === "downloaded" ? "사진을 저장했어요. 인스타 스토리나 카카오톡에 올려 보세요." : "");
    } catch { setMsg("보내지 못했어요. 잠시 후 다시 해 주세요."); }
    setBusy(false);
  };

  return (
    <>
      <button type="button" className="ch-dim" aria-label="닫기" onClick={onClose} />
      <div className="ch-sheet sharemap" role="dialog" aria-label="지도 사진 보내기">
        <h2>지도를 사진으로 보내요 📸</h2>
        <div ref={birdRef} hidden aria-hidden><BirdIcon id={birdId} size={260} letter={!input.done} /></div>
        <div className="sm-preview">{url ? <img src={url} alt="보낼 지도 사진 미리 보기" /> : <span className="small">사진을 그리는 중…</span>}</div>
        {name && (
          <label className="sm-name">
            <input type="checkbox" checked={withName} onChange={(e) => setWithName(e.target.checked)} /> 사진에 ‘{name}’ 이름 넣기
          </label>
        )}
        <div className="small" style={{ textAlign: "center", margin: 0 }}>편지 내용과 사진은 들어가지 않아요</div>
        <button type="button" className="chunky" disabled={!blob || busy} onClick={send}>📤 보내기</button>
        {msg && <div className="small" role="status" style={{ textAlign: "center" }}>{msg}</div>}
      </div>
    </>
  );
}
