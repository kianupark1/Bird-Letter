// 개발용: 다른 사람이 보낸 것처럼 시험 편지를 서버에 보냅니다. 사용법: node scripts/dev-send-letter.mjs [도착까지 초] [보낸 사람 이름]
// 출력된 편지 ID를 앱의 /letter/<ID> 주소로 열어 받는 사람 화면을 확인하세요. (실제 서버에 시험 데이터가 생깁니다)
import { readFileSync } from "node:fs";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { Timestamp, collection, doc, getFirestore, serverTimestamp, writeBatch } from "firebase/firestore";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
const app = initializeApp({
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY, authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
});
const seconds = Number(process.argv[2] ?? 25);
const fromName = process.argv[3] ?? "민수";
const { user } = await signInAnonymously(getAuth(app));
const db = getFirestore(app);
const ref = doc(collection(db, "letters"));
const b = writeBatch(db);
b.set(ref, {
  fromUid: user.uid, fromName, toName: "나", routeId: "seoul-jeju", birdId: "magpie",
  sentAt: serverTimestamp(), arriveAt: Timestamp.fromMillis(Date.now() + seconds * 1000), recipientUid: null,
});
b.set(doc(db, "letters", ref.id, "private", "body"), { message: "제주 바람이 정말 좋아. 까치가 울길래 네 생각이 났어." });
await b.commit();
console.log(JSON.stringify({ id: ref.id, fromUid: user.uid, arriveInSeconds: seconds }));
process.exit(0);
