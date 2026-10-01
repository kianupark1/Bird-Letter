// 개발용: 편지가 서버에 남아 있는지 확인합니다. 사용법: node scripts/dev-letter-exists.mjs <편지ID> [편지ID...]
import { readFileSync } from "node:fs";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { doc, getDoc, getFirestore } from "firebase/firestore";

const env = Object.fromEntries(readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
const app = initializeApp({ apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY, authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, appId: env.NEXT_PUBLIC_FIREBASE_APP_ID });
await signInAnonymously(getAuth(app));
const db = getFirestore(app);
for (const id of process.argv.slice(2)) {
  const s = await getDoc(doc(db, "letters", id));
  console.log(`${id}: ${s.exists() ? "서버에 있음" : "없음(삭제됨)"}`);
}
process.exit(0);