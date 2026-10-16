import BirdIcon from "@/components/BirdIcon";
import { avatarBirdFor, avatarTone } from "../../core/threads";

/** 사람 얼굴 자리에 들어가는 새 얼굴 그림. 친구가 고른 "내 새"가 있으면 그것, 없으면 이름으로 정한 새 */
export default function Face({ name, bird, photo, size = 64 }: { name: string; bird?: string | null; photo?: string; size?: number }) {
  // 프로필 사진이 있으면 카카오톡처럼 사진이 얼굴이 돼요
  if (photo) return (
    <span className="face photo" style={{ width: size, height: size }} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo} alt="" width={size} height={size} />
    </span>
  );
  return (
    <span className={`face tone${avatarTone(name)}`} style={{ width: size, height: size }} aria-hidden>
      <BirdIcon id={avatarBirdFor(name, bird)} size={Math.round(size * 0.86)} />
    </span>
  );
}
