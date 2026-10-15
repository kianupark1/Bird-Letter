"use client";
import BirdIcon from "@/components/BirdIcon";
import { getBird } from "@/lib/birds";
import { AVATAR_BIRDS } from "../../core/threads";

/** "내 새" 고르기: 새 6종 중 하나를 눌러요(가입할 때, 내 정보에서) */
export default function BirdPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <div className="bpicker" role="radiogroup" aria-label="내 새 고르기">
      {AVATAR_BIRDS.map((id) => (
        <button key={id} type="button" role="radio" aria-checked={value === id} className={value === id ? "on" : ""} onClick={() => onChange(id)}>
          <BirdIcon id={id} size={70} />
          <span>{getBird(id).name}</span>
        </button>
      ))}
    </div>
  );
}
