"use client";
import { useEffect, useState } from "react";
import { BIRDS } from "./birds";

/**
 * 앱을 열 때마다 새 6종 중 하나가 무작위로 나와요(로그인·빈 목록·이름 묻기 화면).
 * 서버에서 미리 그리는 화면과 어긋나지 않게, 화면이 열린 뒤에 한 번만 골라요(그 전에는 null).
 */
export function useRandomBird(): string | null {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => { setId(BIRDS[Math.floor(Math.random() * BIRDS.length)].id); }, []);
  return id;
}

/** 새가 정해지기 전에도 자리가 흔들리지 않도록 같은 높이의 빈 칸을 둬요 */
export const birdSlot = (size: number) => ({ height: size * 0.8, width: size });
