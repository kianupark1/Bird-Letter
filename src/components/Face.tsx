import BirdIcon from "@/components/BirdIcon";
import { avatarBirdFor, avatarTone } from "../../core/threads";

/** 사람 얼굴 자리에 들어가는 새 얼굴 그림. 친구가 고른 "내 새"가 있으면 그것, 없으면 이름으로 정한 새 */
export default function Face({ name, bird, size = 64 }: { name: string; bird?: string | null; size?: number }) {
  return (
    <span className={`face tone${avatarTone(name)}`} style={{ width: size, height: size }} aria-hidden>
      <BirdIcon id={avatarBirdFor(name, bird)} size={Math.round(size * 0.86)} />
    </span>
  );
}
