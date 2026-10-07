// 푸시 알림에 쓰는 열쇠 한 쌍을 만들어요: node scripts/gen-vapid.mjs
// 공개 키(NEXT_PUBLIC_VAPID_PUBLIC_KEY)와 비밀 키(VAPID_PRIVATE_KEY)가 나와요. 비밀 키는 채팅·깃에 올리지 말고 Vercel에만 넣으세요.
import { createRequire } from "node:module";
const webpush = createRequire(import.meta.url)("web-push");
const k = webpush.generateVAPIDKeys();
console.log("공개 키  (NEXT_PUBLIC_VAPID_PUBLIC_KEY):\n" + k.publicKey + "\n");
console.log("비밀 키  (VAPID_PRIVATE_KEY, 남에게 보여주지 마세요):\n" + k.privateKey + "\n");
console.log("Vercel에 넣는 명령(컴퓨터에서 한 줄씩, PowerShell에서는 파이프 말고 --value를 쓰세요):");
console.log(`  vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY production --value "${k.publicKey}" --type config --yes`);
console.log(`  vercel env add VAPID_PRIVATE_KEY production --value "${k.privateKey}" --yes`);
console.log('  vercel env add VAPID_SUBJECT production --value "mailto:내이메일@example.com" --type config --yes');
