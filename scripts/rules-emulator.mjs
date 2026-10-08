// 친구 기능 보안 규칙 에뮬레이터 시험(실서버 불필요, Java 필요).
// 실행: 임시 폴더에서 `npm i firebase-tools @firebase/rules-unit-testing firebase` 후
//   npx firebase emulators:exec --only firestore --project demo-bl "node rules-emulator.mjs"  (firestore.rules·firebase.json 같은 폴더)
import { readFileSync } from "node:fs";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import { doc, setDoc, getDoc, deleteDoc, collection, getDocs, serverTimestamp, Timestamp, writeBatch } from "firebase/firestore";

const env = await initializeTestEnvironment({ projectId: "demo-bl", firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8080 } });
const A = env.authenticatedContext("uidA").firestore(), B = env.authenticatedContext("uidB").firestore(), C = env.authenticatedContext("uidC").firestore();
let pass = 0, fail = 0;
const ok = async (l, p) => { try { await assertSucceeds(p); pass++; console.log("  ✓", l); } catch (e) { fail++; console.log("  ✗", l, "→ 허용돼야 함:", e.code || e.message); } };
const no = async (l, p) => { try { await assertFails(p); pass++; console.log("  ✓", l, "(막힘)"); } catch (e) { fail++; console.log("  ✗", l, "→ 막혀야 함"); } };

const f = (uid, name = "친구") => ({ uid, name, at: serverTimestamp() });
console.log("[코드]");
await ok("A가 자기 코드 만들기", setDoc(doc(A, "codes", "ABCD2345"), { uid: "uidA", name: "에이" }));
await no("남의 uid로 코드 만들기", setDoc(doc(C, "codes", "ZZZZ2345"), { uid: "uidA", name: "x" }));
await no("8글자 아닌 코드", setDoc(doc(A, "codes", "ABC"), { uid: "uidA", name: "x" }));
await ok("B가 코드 한 건 조회", getDoc(doc(B, "codes", "ABCD2345")));
await no("코드 목록 조회", getDocs(collection(B, "codes")));
await no("남이 코드 덮어쓰기", setDoc(doc(B, "codes", "ABCD2345"), { uid: "uidB", name: "x" }));
await no("남이 코드 지우기", deleteDoc(doc(B, "codes", "ABCD2345")));

console.log("[친구 맺기]");
const bat = (db) => { const b = writeBatch(db); b.set(doc(db, "users", "uidB", "friends", "uidA"), f("uidA", "에이")); b.set(doc(db, "users", "uidA", "friends", "uidB"), f("uidB", "비")); return b.commit(); };
await no("B가 B쪽만 쓰고 A쪽 위조(uid 다름)", setDoc(doc(B, "users", "uidA", "friends", "uidC"), f("uidC")));
await no("C가 A와 B를 친구로 위조", setDoc(doc(C, "users", "uidA", "friends", "uidB"), f("uidB")));
await ok("A가 B와 친구 맺기(양쪽 한 번에)", bat(A));
await ok("A가 자기 친구 목록 읽기", getDocs(collection(A, "users", "uidA", "friends")));
await no("C가 A의 친구 목록 읽기", getDocs(collection(C, "users", "uidA", "friends")));
await no("친구 문서에 이상한 필드", setDoc(doc(A, "users", "uidA", "friends", "uidX"), { uid: "uidX", name: "x", at: serverTimestamp(), evil: 1 }));

console.log("[친구에게 바로 보내기]");
const m = (over = {}) => ({ fromUid: "uidA", fromName: "에이", toName: "비", routeId: "seoul-busan", birdId: "swallow", sentAt: serverTimestamp(), arriveAt: Timestamp.fromMillis(Date.now() + 3600e3), recipientUid: "uidB", ...over });
await ok("A→친구 B 편지", setDoc(doc(A, "letters", "L1"), m()));
await no("A→친구 아닌 C 편지", setDoc(doc(A, "letters", "L2"), m({ recipientUid: "uidC" })));
await ok("A→링크용(recipient 비움)", setDoc(doc(A, "letters", "L3"), m({ recipientUid: null })));
await ok("B가 자기에게 온 편지 목록 보기", getDocs((await import("firebase/firestore")).query(collection(B, "letters"), (await import("firebase/firestore")).where("recipientUid", "==", "uidB"))));
await no("C가 L1을 가로채 받는 사람 등록", (await import("firebase/firestore")).updateDoc(doc(C, "letters", "L1"), { recipientUid: "uidC" }));
await ok("L1 내용 쓰기(보낸 사람)", setDoc(doc(A, "letters", "L1", "private", "body"), { message: "안녕" }));
await no("도착 전 B가 내용 읽기", getDoc(doc(B, "letters", "L1", "private", "body")));
await no("도착 전 C가 내용 읽기", getDoc(doc(C, "letters", "L1", "private", "body")));
console.log("[친구 끊기]");
await ok("B가 A 쪽 자기 문서 삭제", deleteDoc(doc(B, "users", "uidA", "friends", "uidB")));
await ok("B가 자기 목록의 A 삭제", deleteDoc(doc(B, "users", "uidB", "friends", "uidA")));
await no("끊긴 뒤 A→B 편지", setDoc(doc(A, "letters", "L4"), m()));
await no("C가 A 쪽 친구 삭제", deleteDoc(doc(C, "users", "uidA", "friends", "uidB")));
console.log(`\n통과 ${pass} / 실패 ${fail}`);
await env.cleanup(); process.exit(fail ? 1 : 0);
