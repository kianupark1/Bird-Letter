// Firestore 보안 규칙 실서버 시험: node scripts/rules-test.mjs
// 사용자 3명(A 보낸 사람, B 받는 사람, C 제3자)을 익명 로그인으로 따로 만들어 규칙이 의도대로 열고 막는지 확인합니다.
// 시험용 문서는 끝나면 지웁니다. 실제 프로젝트(bird-letter)에 접속하므로 .env.local 의 설정값이 필요합니다.
import { readFileSync } from "node:fs";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import {
  getFirestore, doc, collection, writeBatch, getDoc, getDocs, updateDoc, deleteDoc, setDoc,
  query, where, serverTimestamp, Timestamp,
} from "firebase/firestore";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8").split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);
const cfg = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY, authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID, appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

async function user(name) {
  const app = initializeApp(cfg, name);
  const auth = getAuth(app);
  const cred = await signInAnonymously(auth);
  return { name, uid: cred.user.uid, db: getFirestore(app) };
}

let pass = 0, fail = 0;
async function expectOk(label, fn) {
  try { await fn(); pass++; console.log("  ✓ " + label); } catch (e) { fail++; console.log("  ✗ " + label + "  → 허용돼야 하는데 막힘: " + (e.code || e.message)); }
}
async function expectDenied(label, fn) {
  try { await fn(); fail++; console.log("  ✗ " + label + "  → 막혀야 하는데 허용됨!"); }
  catch (e) { if (String(e.code).includes("permission-denied")) { pass++; console.log("  ✓ " + label + " (막힘)"); } else { fail++; console.log("  ✗ " + label + "  → 다른 오류: " + (e.code || e.message)); } }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

console.log("사용자 3명 로그인 중...");
const A = await user("A"), B = await user("B"), C = await user("C");
console.log(`  A=${A.uid.slice(0, 6)}… B=${B.uid.slice(0, 6)}… C=${C.uid.slice(0, 6)}…`);

const letterRef = doc(collection(A.db, "letters")); // 무작위 20자 ID
const id = letterRef.id;
const ARRIVE_MS = 12000;
const meta = (over = {}) => ({
  fromUid: A.uid, fromName: "시험", toName: "받는이", routeId: "seoul-busan", birdId: "swallow",
  sentAt: serverTimestamp(), arriveAt: Timestamp.fromMillis(Date.now() + ARRIVE_MS), recipientUid: null, ...over,
});

console.log("\n[1] 편지 보내기");
await expectOk("A가 편지(겉정보+내용)를 한 번에 저장", async () => {
  const b = writeBatch(A.db);
  b.set(letterRef, meta());
  b.set(doc(A.db, "letters", id, "private", "body"), { message: "도착 전에는 보이면 안 되는 내용" });
  await b.commit();
});
await expectDenied("A가 도착 시각이 과거인 편지를 저장", async () => {
  const r = doc(collection(A.db, "letters")); const b = writeBatch(A.db);
  b.set(r, meta({ arriveAt: Timestamp.fromMillis(Date.now() - 60000) }));
  b.set(doc(A.db, "letters", r.id, "private", "body"), { message: "x" });
  await b.commit();
});
await expectDenied("B가 A인 척(fromUid=A) 편지를 저장", async () => {
  const r = doc(collection(B.db, "letters")); const b = writeBatch(B.db);
  b.set(r, meta());
  b.set(doc(B.db, "letters", r.id, "private", "body"), { message: "x" });
  await b.commit();
});
await expectDenied("A가 허용되지 않은 필드를 끼워 저장", async () => {
  const r = doc(collection(A.db, "letters")); const b = writeBatch(A.db);
  b.set(r, meta({ 해킹: true }));
  b.set(doc(A.db, "letters", r.id, "private", "body"), { message: "x" });
  await b.commit();
});

console.log("\n[2] 도착 전 읽기");
await expectOk("B가 링크(ID)로 겉정보를 열기", () => getDoc(doc(B.db, "letters", id)).then((s) => { if (!s.exists()) throw new Error("없음"); }));
await expectDenied("B가 도착 전에 편지 내용을 읽기", () => getDoc(doc(B.db, "letters", id, "private", "body")));
await expectDenied("C(제3자)가 도착 전에 편지 내용을 읽기", () => getDoc(doc(C.db, "letters", id, "private", "body")));
await expectOk("A(보낸 사람)는 도착 전에도 내용을 읽기", () => getDoc(doc(A.db, "letters", id, "private", "body")).then((s) => { if (!s.exists()) throw new Error("없음"); }));

console.log("\n[3] 받는 사람 등록");
await expectDenied("A가 자기 편지의 받는 사람으로 등록", () => updateDoc(doc(A.db, "letters", id), { recipientUid: A.uid }));
await expectDenied("B가 받는 사람 말고 다른 필드를 수정", () => updateDoc(doc(B.db, "letters", id), { birdId: "hawk" }));
await expectOk("B가 받는 사람으로 등록", () => updateDoc(doc(B.db, "letters", id), { recipientUid: B.uid }));
await expectDenied("C가 이미 등록된 편지에 받는 사람으로 가로채기", () => updateDoc(doc(C.db, "letters", id), { recipientUid: C.uid }));

console.log("\n[4] 목록 조회");
await expectOk("B가 자기가 받은 편지 목록 조회", () => getDocs(query(collection(B.db, "letters"), where("recipientUid", "==", B.uid))));
await expectOk("A가 자기가 보낸 편지 목록 조회", () => getDocs(query(collection(A.db, "letters"), where("fromUid", "==", A.uid))));
await expectDenied("C가 전체 편지 목록 조회", () => getDocs(collection(C.db, "letters")));
await expectDenied("C가 남의 편지(A의 보낸 목록) 조회", () => getDocs(query(collection(C.db, "letters"), where("fromUid", "==", A.uid))));

console.log(`\n[5] 도착 후 읽기 (${ARRIVE_MS / 1000}초 기다리는 중...)`);
await sleep(ARRIVE_MS + 2500);
await expectOk("B가 도착 후 편지 내용을 읽기", () => getDoc(doc(B.db, "letters", id, "private", "body")).then((s) => { if (!s.exists()) throw new Error("없음"); }));

console.log("\n[6] 삭제·신고·내 정보");
await expectDenied("B가 남의 편지를 삭제", () => deleteDoc(doc(B.db, "letters", id)));
await expectDenied("B가 남의 편지 내용을 삭제", () => deleteDoc(doc(B.db, "letters", id, "private", "body")));
await expectOk("B가 신고 남기기", () => setDoc(doc(collection(B.db, "reports")), { reporterUid: B.uid, letterId: id, reason: "시험", createdAt: serverTimestamp() }));
await expectDenied("B가 신고 목록 읽기", () => getDocs(collection(B.db, "reports")));
await expectOk("A가 자기 정보(닉네임) 저장", () => setDoc(doc(A.db, "users", A.uid), { nickname: "시험" }));
await expectDenied("B가 A의 정보를 읽기", () => getDoc(doc(B.db, "users", A.uid)));
await expectOk("A가 차단 목록에 추가", () => setDoc(doc(A.db, "users", A.uid, "blocks", B.uid), { at: serverTimestamp() }));
await expectDenied("B가 A의 차단 목록을 읽기", () => getDocs(collection(B.db, "users", A.uid, "blocks")));

console.log("\n[7] 정리(탈퇴 삭제 흉내)");
await expectOk("A가 편지 내용 → 편지 순서로 삭제", async () => {
  await deleteDoc(doc(A.db, "letters", id, "private", "body"));
  await deleteDoc(doc(A.db, "letters", id));
});
await expectOk("A가 자기 정보와 차단 목록 삭제", async () => {
  await deleteDoc(doc(A.db, "users", A.uid, "blocks", B.uid));
  await deleteDoc(doc(A.db, "users", A.uid));
});

console.log(`\n결과: 통과 ${pass} / 실패 ${fail}`);
process.exit(fail ? 1 : 0);
