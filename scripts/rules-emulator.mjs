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
await ok("친구 문서에 내 새(bird) 담기", setDoc(doc(A, "users", "uidA", "friends", "uidY"), { uid: "uidY", name: "y", at: serverTimestamp(), bird: "pigeon" }));
await no("bird가 글자가 아님", setDoc(doc(A, "users", "uidA", "friends", "uidY2"), { uid: "uidY2", name: "y", at: serverTimestamp(), bird: 7 }));
await no("bird가 너무 김", setDoc(doc(A, "users", "uidA", "friends", "uidY3"), { uid: "uidY3", name: "y", at: serverTimestamp(), bird: "x".repeat(13) }));
await ok("코드 문서에 내 새(bird) 담기", setDoc(doc(A, "codes", "ABCD2345"), { uid: "uidA", name: "에이", bird: "magpie" }));
await no("코드 문서의 bird가 글자가 아님", setDoc(doc(A, "codes", "ABCD2345"), { uid: "uidA", name: "에이", bird: 5 }));

console.log("[거리 랭킹 기록]");
const st = (over = {}) => ({ km: 1200, maxKm: 452, count: 3, name: "에이", bird: "magpie", ...over });
await ok("A가 자기 기록 쓰기", setDoc(doc(A, "stats", "uidA"), st()));
await no("A가 B의 기록 쓰기", setDoc(doc(A, "stats", "uidB"), st()));
await no("이상한 필드", setDoc(doc(A, "stats", "uidA"), st({ evil: 1 })));
await ok("내 동네(place) 칸 쓰기", setDoc(doc(A, "stats", "uidA"), st({ place: "gangnam" })));
await no("place가 너무 긺", setDoc(doc(A, "stats", "uidA"), st({ place: "x".repeat(40) })));
await no("place가 숫자", setDoc(doc(A, "stats", "uidA"), st({ place: 5 })));
await no("km가 너무 큼", setDoc(doc(A, "stats", "uidA"), st({ km: 99999999 })));
await no("km가 음수", setDoc(doc(A, "stats", "uidA"), st({ km: -5 })));
await no("km가 글자", setDoc(doc(A, "stats", "uidA"), st({ km: "많이" })));
await ok("친구 B가 A의 기록 읽기", getDoc(doc(B, "stats", "uidA")));
await no("친구가 아닌 C가 A의 기록 읽기", getDoc(doc(C, "stats", "uidA")));
await no("기록 목록 조회", getDocs(collection(B, "stats")));
await ok("A가 자기 기록 읽기", getDoc(doc(A, "stats", "uidA")));
await ok("A가 자기 기록 지우기", deleteDoc(doc(A, "stats", "uidA")));

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

console.log("[예약 발송과 사진]");
await ok("A↔B 다시 친구 맺기", bat(A));
const HOUR = 3600e3, DAY = 24 * HOUR;
const ts = (ms) => Timestamp.fromMillis(Date.now() + ms);
const sched = (over = {}) => ({ fromUid: "uidA", fromName: "에이", toName: "비", routeId: "seoul-busan", birdId: "swallow", sentAt: serverTimestamp(), departAt: ts(2 * DAY), arriveAt: ts(2 * DAY + 8 * HOUR), recipientUid: "uidB", ...over });
await ok("예약 편지 만들기(출발 2일 뒤)", setDoc(doc(A, "letters", "S1"), sched()));
await no("출발 시각이 과거", setDoc(doc(A, "letters", "S2"), sched({ departAt: ts(-HOUR) })));
await no("출발 시각이 366일보다 멂", setDoc(doc(A, "letters", "S3"), sched({ departAt: ts(400 * DAY), arriveAt: ts(401 * DAY) })));
await no("도착이 출발보다 빠름", setDoc(doc(A, "letters", "S4"), sched({ arriveAt: ts(DAY) })));
await no("출발 시각이 문자열", setDoc(doc(A, "letters", "S5"), sched({ departAt: "내일" })));
await ok("보낸 사람은 출발 전에도 편지를 열 수 있음", getDoc(doc(A, "letters", "S1")));
await no("받는 사람은 출발 전에 편지를 열 수 없음", getDoc(doc(B, "letters", "S1")));
await no("제3자도 출발 전에 열 수 없음", getDoc(doc(C, "letters", "S1")));
await ok("예약 안 한 편지는 받는 사람이 바로 열 수 있음", getDoc(doc(B, "letters", "L3")));
await ok("출발이 지난 예약 편지는 받는 사람이 열 수 있음", env.withSecurityRulesDisabled(async (ctx) => {
  await setDoc(doc(ctx.firestore(), "letters", "S6"), { fromUid: "uidA", fromName: "에이", toName: "비", routeId: "seoul-busan", birdId: "swallow", sentAt: Timestamp.now(), departAt: ts(-HOUR), arriveAt: ts(HOUR), recipientUid: "uidB" });
}).then(() => getDoc(doc(B, "letters", "S6"))));
await ok("사진 한 장 저장(photo0)", setDoc(doc(A, "letters", "S1", "private", "photo0"), { data: "data:image/jpeg;base64,AAAA" }));
await ok("사진 세 번째 칸(photo2)", setDoc(doc(A, "letters", "S1", "private", "photo2"), { data: "data:image/jpeg;base64,AAAA" }));
await no("사진 네 번째(photo3)는 불가", setDoc(doc(A, "letters", "S1", "private", "photo3"), { data: "x" }));
await no("사진 문서에 다른 필드", setDoc(doc(A, "letters", "S1", "private", "photo1"), { data: "x", extra: 1 }));
await no("사진이 너무 큼(450000자 초과)", setDoc(doc(A, "letters", "S1", "private", "photo1"), { data: "x".repeat(450001) }));
await no("남이 내 편지에 사진 올리기", setDoc(doc(C, "letters", "S1", "private", "photo1"), { data: "x" }));
await no("받는 사람은 도착 전 사진을 볼 수 없음", getDoc(doc(B, "letters", "S1", "private", "photo0")));
await ok("보낸 사람은 사진을 볼 수 있음", getDoc(doc(A, "letters", "S1", "private", "photo0")));
await ok("글(body) 저장은 그대로", setDoc(doc(A, "letters", "S1", "private", "body"), { message: "예약 편지" }));
await no("body 이름이 아닌 글 문서", setDoc(doc(A, "letters", "S1", "private", "memo"), { message: "x" }));
await ok("보낸 사람이 예약 편지를 취소(삭제)", deleteDoc(doc(A, "letters", "S1")));
await no("받는 사람은 남의 예약 편지를 지울 수 없음", deleteDoc(doc(B, "letters", "S6")));


console.log("[푸시 구독]");
const sub = { endpoint: "https://fcm.googleapis.com/fcm/send/abc", p256dh: "BPxx", auth: "yy", at: Date.now() };
await ok("내 푸시 구독 저장", setDoc(doc(B, "users", "uidB", "push", "sub"), sub));
await ok("친구(A)가 B의 푸시 구독을 읽음", getDoc(doc(A, "users", "uidB", "push", "sub")));
await no("친구가 아닌 C는 읽을 수 없음", getDoc(doc(C, "users", "uidB", "push", "sub")));
await no("친구가 남의 구독을 쓸 수 없음", setDoc(doc(A, "users", "uidB", "push", "sub"), sub));
await no("https가 아닌 주소는 저장 불가", setDoc(doc(B, "users", "uidB", "push", "sub"), { ...sub, endpoint: "http://x" }));
await no("다른 필드는 저장 불가", setDoc(doc(B, "users", "uidB", "push", "sub"), { ...sub, extra: 1 }));
await no("sub 아닌 이름은 불가", setDoc(doc(B, "users", "uidB", "push", "other"), sub));
await ok("내 구독 삭제", deleteDoc(doc(B, "users", "uidB", "push", "sub")));

console.log("[답장]");
const rep = (to, replyTo, over = {}) => ({ fromUid: to === "uidA" ? "uidB" : "uidA", fromName: "답", toName: "원본", routeId: "busan-seoul", birdId: "pigeon", sentAt: serverTimestamp(), arriveAt: ts(3 * HOUR), recipientUid: to, replyTo, ...over });
await ok("A가 링크용 편지 L7(받는 사람 비움) 만들기", setDoc(doc(A, "letters", "L7"), { fromUid: "uidA", fromName: "에이", toName: "비", routeId: "seoul-busan", birdId: "swallow", sentAt: serverTimestamp(), arriveAt: ts(HOUR), recipientUid: null }));
await ok("B가 링크를 열어 받는 사람으로 등록", (await import("firebase/firestore")).updateDoc(doc(B, "letters", "L7"), { recipientUid: "uidB" }));
await ok("둘의 친구 관계 지우기(친구가 아닌 상태로 시험)", Promise.all([deleteDoc(doc(B, "users", "uidB", "friends", "uidA")), deleteDoc(doc(A, "users", "uidA", "friends", "uidB"))]));
await no("친구도 아니고 답장도 아니면 보낼 수 없음", setDoc(doc(B, "letters", "R0"), (({ replyTo, ...rest }) => rest)(rep("uidA", "L7"))));
await ok("B가 받은 편지(L7)에 친구가 아니어도 답장", setDoc(doc(B, "letters", "R1"), rep("uidA", "L7")));
await no("제3자 C는 L7에 답장 불가", setDoc(doc(C, "letters", "R2"), rep("uidA", "L7", { fromUid: "uidC" })));
await no("B가 답장으로 엉뚱한 사람(C)에게 보내기", setDoc(doc(B, "letters", "R3"), rep("uidC", "L7")));
await no("받는 사람이 아닌 A가 자기 편지에 답장", setDoc(doc(A, "letters", "R4"), rep("uidB", "L7", { fromUid: "uidA" })));
await no("replyTo가 없는 편지를 가리킴", setDoc(doc(B, "letters", "R5"), rep("uidA", "NOPE")));

console.log(`\n통과 ${pass} / 실패 ${fail}`);
await env.cleanup(); process.exit(fail ? 1 : 0);
