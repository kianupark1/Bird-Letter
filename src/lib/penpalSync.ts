"use client";
import { cityLabel, cityOf, penpalName } from "../../core/penpal";
import type { Profile } from "./settings";
import type { MyPenpal } from "./firebase/penpal";

/**
 * 펜팔 명단의 내 줄을 프로필에서 한 번에 만들어요(펜팔 탭·설정·홈·펜팔 편지 화면이 같은 값을 올리게).
 * 목록에 보이기·사진은 받기를 켰을 때만, 사진은 본인이 허락하고 프로필 사진이 있을 때만 올라가요(아니면 지움).
 */
export function myPenpalDoc(p: Profile, o: { open?: boolean; region?: string; intro?: string } = {}): MyPenpal {
  const region = o.region ?? cityOf(p.homePlace);
  const open = o.open ?? p.penpalRecv === true;
  const listed = open && p.penpalListed === true;
  return {
    name: p.penpalName?.trim() || penpalName(cityLabel(region), p.avatarBird || "magpie"),
    bird: p.avatarBird || "magpie", region, tags: p.penpalTags ?? [], open,
    ...(o.intro !== undefined ? { intro: o.intro } : {}),
    listed,
    photo: listed && p.penpalPhoto === true && p.photo ? p.photo : null,
  };
}
