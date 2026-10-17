"use client";
import BirdIcon from "./BirdIcon";
import LandmarkIcon from "./LandmarkIcon";
import type { Postcard } from "../../core/postcards";

/** 새가 보내는 그림엽서 한 장(시안 v6-1): 하늘색 그림 + 명소 그림 + 새 + 소인, 아래에 새의 한마디 */
export default function PostcardView({ card, birdId, birdName, sub, small }: { card: Postcard; birdId: string; birdName: string; sub?: string; small?: boolean }) {
  return (
    <figure className={`pcard ${small ? "small" : ""}`} aria-label={`${birdName}의 엽서: ${card.place}`}>
      <div className="pc-ill">
        <svg viewBox="-14 -13 28 26" aria-hidden><LandmarkIcon kind={card.kind} x={0} y={0} /></svg>
        <span className="pc-bird"><BirdIcon id={birdId} size={small ? 34 : 44} letter /></span>
        <span className="pc-stamp">{card.place} · 엽서</span>
      </div>
      <figcaption><b>&quot;{card.text}&quot;</b>{sub && <span>{sub}</span>}</figcaption>
    </figure>
  );
}
