/**
 * 기승전결 광고 영상 "만약 카톡이 하루아침에 사라진다면?"(4:5 1080x1350, 약 55초): npx tsx promo/build-reel-kakao.mts
 * 2026-11-24 대표님: "이렇게(블록 인형 스토리 영상) 만들어서 올리자, 일레븐랩스로 소리도 넣고, 기승전결 — 카톡이 없어지면 편지를 쓴다,
 * 그걸 대신하는 앱. 폴라로이드 사진 기능이랑 펜팔 기능도."
 * 그림 10장·내레이션: 일레븐랩스(그림 gpt-image-2.5-sunburst, 목소리 Gyeorina eleven_v3) → promo/inbox/kakao-gone/ (fetch-media.yml로 받음)
 * 연출된 가상의 이야기 표시를 화면 위에 늘 둠. 자막 시각은 내레이션의 쉬는 곳(ffmpeg silencedetect)에 맞춤.
 * 결과: promo/video/card/reel-kakao.mp4(4:5, 넘겨 보기 첫 장) · promo/video/reel-kakao.mp4(9:16) · -cover
 * 2탄(2026-11-24 대표님 "감동적으로, 카카오톡이 없어진다면"): npx tsx promo/build-reel-kakao.mts dad → 아빠와 아들 이야기, reel-kakao-dad.*
 */
import { createRequire } from "node:module";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";

const req = createRequire(import.meta.url);
const { chromium } = (() => { try { return req("playwright"); } catch { return req("/opt/node-tools/node_modules/playwright"); } })();
const { SLOGAN } = await import("./store.mts");
const root = resolve(import.meta.dirname, "..");
const f = (p: string) => "file://" + resolve(root, p);
// 3탄(dad2, 2026-11-24 대표님 "저녁에 한 번 더, 캐릭터만 살짝 다르게, 마지막에 앱스토어 바로 다운·안드로이드는 링크로·12월 초 출시 예정"):
// 같은 내레이션(kakao-dad/voice.mp3), 그림은 kakao-dad2(모자·콧수염 아빠, 안경 쓴 준호, 갈색 강아지)
// 4탄(gone2, 2026-11-24 저녁 6시 대표님 "카카오톡과 문자가 사라진다면?, 스토리 정리, 쓰는 나·받는 사람의 감동, 카톡 링크로 앱 없이 바로,
// 아이폰은 앱스토어도, 장면 10% 빠르게"): 새 내레이션 kakao-gone2/voice.mp3(1.12배 빠르게), 그림은 kakao-gone 그대로(엄마와 딸)
// 5탄(friend, 2026-11-25 점심 대표님 "카톡이 없어진다면, 재미있고 감동적이게"): 단짝 민지·하은, 참새가 은행나무에 걸리고 길을 잃어도 꼭 도착
// 6탄(army, 2026-11-25 저녁 대표님 "그림체 바꿔서, 2026년 조회수 잘 나온 것 참고"): 손그림 수채화 애니 그림체, 군대 간 아들과 엄마
const STORY = (["dad", "dad2", "gone2", "friend", "army"] as const).find((x) => x === process.argv[2]) ?? "kakao";
const SPD = STORY === "gone2" ? 1.12 : STORY === "army" ? 1.1 : 1; // 내레이션·장면을 이만큼 빠르게
const SRC = STORY === "army" ? "promo/inbox/kakao-army" : STORY === "friend" ? "promo/inbox/kakao-friend" : STORY === "kakao" || STORY === "gone2" ? "promo/inbox/kakao-gone" : STORY === "dad2" ? "promo/inbox/kakao-dad2" : "promo/inbox/kakao-dad";
const VOICE = STORY === "army" ? "promo/inbox/kakao-army/voice.mp3" : STORY === "friend" ? "promo/inbox/kakao-friend/voice.mp3" : STORY === "kakao" ? "promo/inbox/kakao-gone/voice.mp3" : STORY === "gone2" ? "promo/inbox/kakao-gone2/voice.mp3" : "promo/inbox/kakao-dad/voice.mp3";
const NAME = STORY === "army" ? "reel-kakao-army" : STORY === "friend" ? "reel-kakao-friend" : STORY === "kakao" ? "reel-kakao" : STORY === "dad2" ? "reel-kakao-dad2" : STORY === "gone2" ? "reel-kakao-gone2" : "reel-kakao-dad";
const END = STORY === "gone2" || STORY === "friend" || STORY === "army"
  ? { ios: "🍎 아이폰 · 앱스토어에서 바로 다운로드", android: "💬 카톡으로 받은 편지는 <span style='color:#F0BC5C'>앱 없이 바로</span> 열려요<br><span style='font-size:32px;font-weight:600;opacity:.85'>▶ 안드로이드는 링크로 바로 시작 · bird-letter.vercel.app</span>" }
  : STORY === "dad2"
  ? { ios: "🍎 아이폰 · 앱스토어에서 바로 다운로드", android: "▶ 안드로이드는 링크로 바로 사용 가능<br><span style='font-size:32px;font-weight:600;opacity:.85'>구글 플레이 <span style='color:#F0BC5C'>12월 초 출시 예정</span> · bird-letter.vercel.app</span>" }
  : { ios: "🍎 아이폰 · 앱스토어 '새편지'", android: "▶ 구글 플레이 <span style='color:#F0BC5C'>11월 중 출시 예정</span><br><span style='font-size:32px;font-weight:600;opacity:.85'>안드로이드는 지금 웹으로 · bird-letter.vercel.app</span>" };
const FPS = 30, W = 1080, H = 1350;

// [시작, 끝, 그림, 초점 x(0~1) 시작→끝, 자막, 위쪽 칩]
type Sc = { a: number; b: number; img?: string; fx?: [number, number]; z?: [number, number]; cap?: string; chip?: string; hook?: boolean; kind?: "title" | "card" | "end" };
const KAKAO: Sc[] = [
  { a: 0, b: 3.86, img: "s01", fx: [0.45, 0.45], z: [1.18, 1.0], cap: "만약 카톡이<br><span class='y'>하루아침에 사라진다면?</span>", hook: true },
  { a: 3.86, b: 7.92, img: "s01", fx: [0.42, 0.5], z: [1.05, 1.15], cap: "단톡방 수백 개가<br>한순간에 조용해졌어요." },
  { a: 7.92, b: 15.53, img: "s02", fx: [0.3, 0.55], z: [1.0, 1.1], cap: "엄마한테 \"밥 먹었어?\"<br>한마디도 못 보냈죠." },
  { a: 15.53, b: 19.6, img: "s03", fx: [0.3, 0.72], z: [1.0, 1.05], cap: "우체통 앞에<br>줄이 생겼고,", chip: "3일 뒤" },
  { a: 19.6, b: 23.44, img: "s04", fx: [0.6, 0.5], z: [1.12, 1.0], cap: "사진은 인화해서<br>편지에 끼워 보냈어요." },
  { a: 23.44, b: 27.5, img: "s05", fx: [0.42, 0.75], z: [1.0, 1.0], cap: "모르는 도시의 누군가와<br>펜팔도 시작했죠." },
  { a: 27.5, b: 31.59, img: "s10", fx: [0.75, 0.68], z: [1.0, 1.1], cap: "엄마의 답장이<br>도착했어요.", chip: "한 달 뒤" },
  { a: 31.59, b: 34.01, img: "s06", fx: [0.36, 0.36], z: [1.0, 1.12], cap: "\"보고 싶다, 우리 딸.\"" },
  { a: 34.01, b: 37.49, img: "s07", fx: [0.48, 0.48], z: [1.15, 1.0], cap: "그런데… 카톡은<br><span class='y'>사라지지 않았잖아요?</span>" },
  { a: 37.49, b: 42.98, img: "s08", fx: [0.36, 0.62], z: [1.0, 1.08], cap: "새가 편지를 물고,<br><span class='y'>실제 거리만큼 날아가는 앱</span>" },
  { a: 42.98, b: 44.8, kind: "title" },
  { a: 44.8, b: 46.6, img: "s09", fx: [0.42, 0.66], z: [1.0, 1.06], cap: "📸 사진은 폴라로이드로," },
  { a: 46.6, b: 49.45, kind: "card", cap: "🌏 모르는 누군가와는 펜팔로." },
  { a: 49.45, b: 55, kind: "end" },
];
// 2탄 장면은 아래 DAD(내레이션 쉬는 곳에 맞춤)
const DAD: Sc[] = [
  { a: 0, b: 3.3, img: "d1", fx: [0.36, 0.4], z: [1.15, 1.0], cap: "만약 카카오톡이<br><span class='y'>하루아침에 사라진다면?</span>", hook: true },
  { a: 3.3, b: 7.55, img: "d2", fx: [0.48, 0.56], z: [1.0, 1.08], cap: "아빠와 나눈 대화는<br>\"응.\" \"밥 먹었어.\"" },
  { a: 7.55, b: 10.05, img: "d2", fx: [0.56, 0.6], z: [1.08, 1.16], cap: "그게 <span class='y'>전부</span>였어요." },
  { a: 10.05, b: 14.4, img: "d3", fx: [0.42, 0.5], z: [1.0, 1.08], cap: "그래서 준호는 처음으로,<br>아빠에게 긴 편지를 썼어요." },
  { a: 14.4, b: 18.0, img: "d3", fx: [0.6, 0.78], z: [1.08, 1.14], cap: "\"아빠, 그동안<br>말 못 해서 미안해요.\"" },
  { a: 18.0, b: 20.2, img: "d4", fx: [0.55, 0.62], z: [1.0, 1.06], cap: "시골집 우체통 앞에서,", chip: "매일 아침" },
  { a: 20.2, b: 22.4, img: "d5", fx: [0.3, 0.4], z: [1.04, 1.12], cap: "아빠는 매일 아침<br>편지를 기다렸대요." },
  { a: 22.4, b: 25.2, img: "d6", fx: [0.35, 0.55], z: [1.0, 1.05], cap: "그리고 도착한<br><span class='y'>아빠의 답장.</span>" },
  { a: 25.2, b: 29.35, img: "d7", fx: [0.5, 0.52], z: [1.0, 1.1], cap: "꾹꾹 눌러 쓴 글씨,<br>마당에서 찍은 사진 한 장." },
  { a: 29.35, b: 33.85, img: "d7", fx: [0.53, 0.55], z: [1.12, 1.22], cap: "\"고맙다, 아들.<br>아빠도 많이 보고 싶다.\"" },
  { a: 33.85, b: 36.25, img: "d8", fx: [0.6, 0.68], z: [1.0, 1.05], cap: "카카오톡은<br>사라지지 않았어요." },
  { a: 36.25, b: 40.6, img: "d8", fx: [0.68, 0.76], z: [1.05, 1.12], cap: "하지만, 아직 <span class='y'>하지 못한 말</span>은<br>남아 있잖아요." },
  { a: 40.6, b: 44.15, img: "kakao-gone/s08", fx: [0.36, 0.6], z: [1.0, 1.08], cap: "새가 편지를 물고,<br><span class='y'>실제 거리만큼 날아가는 앱</span>" },
  { a: 44.15, b: 45.4, kind: "title" },
  { a: 45.4, b: 47.5, img: "kakao-gone/s09", fx: [0.45, 0.66], z: [1.0, 1.06], cap: "📸 사진은 폴라로이드로," },
  { a: 47.5, b: 50.5, kind: "card", cap: "🌏 모르는 누군가와는 펜팔로." },
  { a: 50.5, b: 56, kind: "end" },
];
// 3탄 그림은 인물 위치가 조금 달라서 초점만 고쳐요(장면·자막은 2탄과 같음)
const OV: Record<number, Partial<Sc>> = { 0: { fx: [0.3, 0.34] }, 4: { fx: [0.45, 0.3] }, 5: { fx: [0.62, 0.66] }, 6: { fx: [0.36, 0.44] }, 10: { fx: [0.52, 0.58] }, 11: { fx: [0.58, 0.62] } };
const DAD2: Sc[] = DAD.map((x, i) => ({ ...x, ...(OV[i] ?? {}) }));
const ARMY: Sc[] = [
  { a: 0, b: 3.33, img: "a1", fx: [0.4, 0.4], z: [1.18, 1.0], cap: "하루아침에<br>카카오톡이<br><span class='y'>사라진다면?</span>", hook: true },
  { a: 3.33, b: 8.38, img: "a2", fx: [0.42, 0.45], z: [1.0, 1.08], cap: "엄마는 군대 간 아들에게<br><span class='y'>20년 만에 편지를</span> 썼어요." },
  { a: 8.38, b: 11.45, img: "a2", fx: [0.45, 0.46], z: [1.08, 1.18], cap: "맞춤법을<br>세 번이나 고치면서요 😅" },
  { a: 11.45, b: 16.26, img: "a3", fx: [0.36, 0.44], z: [1.0, 1.1], cap: "편지를 물고 간 까치는…<br><span class='y'>위병소에서 경례</span>까지 받았대요 🫡", chip: "강원도" },
  { a: 16.26, b: 18.56, img: "a4", fx: [0.36, 0.4], z: [1.0, 1.08], cap: "반나절을 날아<br>도착한 편지." },
  { a: 18.56, b: 22.02, img: "a5", fx: [0.3, 0.36], z: [1.0, 1.08], cap: "훈련을 마친 아들이<br>조심스럽게 열었어요." },
  { a: 22.02, b: 26.7, img: "a6", fx: [0.3, 0.7], z: [1.0, 1.08], cap: "\"밥은 잘 먹니.<br>엄마는 네 방 청소하다가,<br><span class='y'>한참 앉아 있었다.\"</span>" },
  { a: 26.7, b: 31.5, img: "a7", fx: [0.45, 0.5], z: [1.0, 1.08], cap: "그날 밤, 아들은 처음으로<br>엄마에게 긴 답장을 썼어요." },
  { a: 31.5, b: 35.02, img: "a8", fx: [0.38, 0.4], z: [1.0, 1.1], cap: "<span class='y'>\"엄마, 나 잘 지내.<br>보고 싶어.\"</span>" },
  { a: 35.02, b: 37.5, img: "a8", fx: [0.4, 0.42], z: [1.1, 1.18], cap: "카카오톡은<br>사라지지 않았어요." },
  { a: 37.5, b: 41.66, img: "a4", fx: [0.4, 0.48], z: [1.05, 1.12], cap: "그래도, 하고 싶은 말은<br><span class='y'>천천히 보내도 괜찮아요.</span>" },
  { a: 41.66, b: 42.98, kind: "title" },
  { a: 42.98, b: 47, img: "a1", fx: [0.4, 0.42], z: [1.1, 1.2], cap: "💬 카톡으로 링크만 보내면<br><span class='y'>앱 없이 바로</span> 열려요" },
  { a: 47, b: 53, kind: "end" },
];
const FRIEND: Sc[] = [
  { a: 0, b: 2.62, img: "f1", fx: [0.36, 0.36], z: [1.18, 1.0], cap: "하루아침에<br>카카오톡이<br><span class='y'>사라진다면?</span>", hook: true },
  { a: 2.62, b: 5.82, img: "f1", fx: [0.36, 0.4], z: [1.05, 1.15], cap: "단톡방 300개가<br>한순간에 조용해졌어요." },
  { a: 5.82, b: 9.6, img: "f2", fx: [0.45, 0.48], z: [1.0, 1.08], cap: "부산 사는 단짝 하은이에게<br><span class='y'>편지를 쓰기로 했죠.</span>" },
  { a: 9.6, b: 12.38, img: "f3", fx: [0.6, 0.66], z: [1.0, 1.12], cap: "그런데 참새가…<br><span class='y'>은행나무에 걸렸어요</span> 😂" },
  { a: 12.38, b: 14.44, img: "f4", fx: [0.68, 0.72], z: [1.0, 1.08], cap: "대전 위에서는<br>길까지 잃었죠 🗺", chip: "대전 상공" },
  { a: 14.44, b: 16.65, img: "f4", fx: [0.72, 0.74], z: [1.08, 1.16], cap: "그래도 편지는,<br><span class='y'>꼭 도착해요.</span>" },
  { a: 16.65, b: 18.9, img: "f5", fx: [0.22, 0.28], z: [1.0, 1.08], cap: "반나절 넘게 날아<br>도착한 편지.", chip: "부산" },
  { a: 18.9, b: 21.72, img: "f6", fx: [0.38, 0.42], z: [1.0, 1.08], cap: "\"우리 교복 입던 사진,<br>아직 갖고 있어.\"" },
  { a: 21.72, b: 24.3, img: "f6", fx: [0.42, 0.42], z: [1.08, 1.18], cap: "하은이는 한참을 웃다가,<br><span class='y'>울었대요.</span>" },
  { a: 24.3, b: 27.6, img: "f7", fx: [0.45, 0.6], z: [1.0, 1.08], cap: "그리고 날아온 답장.<br><span class='y'>\"보고 싶다, 내 단짝.\"</span>" },
  { a: 27.6, b: 29.66, img: "f8", fx: [0.45, 0.45], z: [1.12, 1.0], cap: "카카오톡은<br>사라지지 않았어요." },
  { a: 29.66, b: 33.82, img: "f8", fx: [0.45, 0.48], z: [1.0, 1.1], cap: "그래도 가끔은,<br><span class='y'>천천히 도착한 마음</span>이<br>더 오래 남아요." },
  { a: 33.82, b: 34.7, kind: "title" },
  { a: 34.7, b: 38.5, img: "kakao-gone/s09", fx: [0.45, 0.66], z: [1.0, 1.06], cap: "💬 카톡으로 링크만 보내면<br><span class='y'>앱 없이 바로</span> 열려요" },
  { a: 38.5, b: 45, kind: "end" },
];
// 4탄 장면(내레이션 원래 속도의 초, 아래에서 SPD로 나눔)
const GONE2: Sc[] = [
  { a: 0, b: 4.76, img: "s01", fx: [0.45, 0.45], z: [1.18, 1.0], cap: "하루아침에<br>카카오톡과 문자가<br><span class='y'>사라진다면?</span>", hook: true },
  { a: 4.76, b: 7.0, img: "s01", fx: [0.42, 0.5], z: [1.05, 1.15], cap: "휴대폰이<br>조용해졌어요." },
  { a: 7.0, b: 10.95, img: "s07", fx: [0.45, 0.5], z: [1.0, 1.1], cap: "\"잘 지내?\" 그 한마디를<br>보낼 곳이 없어졌죠." },
  { a: 10.95, b: 15.2, img: "s02", fx: [0.4, 0.5], z: [1.0, 1.08], cap: "오랜만에 펜을 들었어요.<br><span class='y'>엄마에게 쓰는 편지.</span>" },
  { a: 15.2, b: 19.45, img: "s04", fx: [0.4, 0.5], z: [1.0, 1.1], cap: "무슨 말부터 써야 할지 몰라<br>한참을 망설였어요." },
  { a: 19.45, b: 23.3, img: "s08", fx: [0.4, 0.62], z: [1.0, 1.08], cap: "지금쯤 어디를<br>날고 있을까.", chip: "편지를 보내고" },
  { a: 23.3, b: 25.8, img: "s09", fx: [0.5, 0.62], z: [1.0, 1.08], cap: "기다리는 시간마저<br><span class='y'>설렜어요.</span>" },
  { a: 25.8, b: 29.55, img: "s10", fx: [0.4, 0.5], z: [1.0, 1.08], cap: "엄마는 창가에서<br>편지를 받았대요.", chip: "며칠 뒤" },
  { a: 29.55, b: 33.95, img: "s10", fx: [0.5, 0.56], z: [1.08, 1.18], cap: "천천히, 아주 천천히 읽고는<br><span class='y'>한참을 우셨대요.</span>" },
  { a: 33.95, b: 35.6, img: "s06", fx: [0.36, 0.42], z: [1.0, 1.06], cap: "그리고 도착한 <span class='y'>답장.</span>" },
  { a: 35.6, b: 37.75, img: "s06", fx: [0.42, 0.44], z: [1.08, 1.18], cap: "\"보고 싶다, 우리 딸.\"" },
  { a: 37.75, b: 40.1, img: "s07", fx: [0.48, 0.48], z: [1.15, 1.0], cap: "카카오톡은<br>사라지지 않았어요." },
  { a: 40.1, b: 44.95, img: "s04", fx: [0.5, 0.42], z: [1.1, 1.0], cap: "그래도 진짜 마음은,<br><span class='y'>천천히 도착할 때</span><br>더 깊이 닿아요." },
  { a: 44.95, b: 45.9, kind: "title" },
  { a: 45.9, b: 49.65, img: "s08", fx: [0.36, 0.62], z: [1.0, 1.08], cap: "새가 편지를 물고,<br><span class='y'>실제 거리만큼 날아가요</span>" },
  { a: 49.65, b: 55.1, img: "s09", fx: [0.45, 0.66], z: [1.0, 1.06], cap: "💬 카톡으로 링크만 보내면<br>받는 사람은<br><span class='y'>앱 없이 바로</span> 열어 봐요" },
  { a: 55.1, b: 63.5, kind: "end" },
];
const S: Sc[] = (STORY === "kakao" ? KAKAO : STORY === "dad2" ? DAD2 : STORY === "gone2" ? GONE2 : STORY === "friend" ? FRIEND : STORY === "army" ? ARMY : DAD).map((x) => ({ ...x, a: x.a / SPD, b: x.b / SPD }));
const T = S[S.length - 1].b;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: P; src: url(${f("src/app/fonts/PretendardSub.woff2")}); font-weight: 100 900; }
* { box-sizing: border-box; margin: 0; } html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: #000; }
body { font-family: P, sans-serif; letter-spacing: -1.5px; word-break: keep-all; position: relative; color: #fff; }
.sc { position: absolute; inset: 0; opacity: 0; overflow: hidden; }
.sc img.bg { position: absolute; top: 0; height: ${H}px; transform-origin: 50% 50%; }
.cap { position: absolute; left: 50px; right: 50px; top: 960px; text-align: center; font-size: 64px; font-weight: 900; line-height: 1.28;
  -webkit-text-stroke: 10px #111; paint-order: stroke fill; text-shadow: 0 6px 18px rgba(0,0,0,.45); }
.cap.hook { top: 860px; font-size: 84px; }
.y { color: #FFD43B; }
.chip { position: absolute; left: 0; right: 0; top: 150px; text-align: center; }
.chip span { display: inline-block; background: #FFD43B; color: #16110E; font-weight: 900; font-size: 54px; padding: 12px 40px; border-radius: 99px; letter-spacing: -1px; }
.fic { position: absolute; left: 0; right: 0; top: 46px; text-align: center; font-size: 26px; font-weight: 700; color: rgba(255,255,255,.85); letter-spacing: 0; z-index: 9;
  -webkit-text-stroke: 5px rgba(0,0,0,.6); paint-order: stroke fill; }
.btn { position: absolute; left: 110px; right: 110px; text-align: center; border-radius: 999px; font-weight: 800; }
</style></head><body>
<div class="fic" id="fic">연출된 가상의 이야기입니다</div>
${S.map((s, i) => {
  if (s.kind === "title") return `<div class="sc" id="s${i}" style="background:#FBF3E4;color:#16110E;text-align:center">
    <img src="${f("promo/store/play-icon-512.png")}" style="position:absolute;left:390px;top:330px;width:300px;height:300px;border-radius:70px;box-shadow:0 30px 60px rgba(0,0,0,.2)">
    <div style="position:absolute;left:0;right:0;top:690px;font-size:140px;font-weight:900;letter-spacing:-6px">새편지</div>
    <div style="position:absolute;left:0;right:0;top:880px;font-size:46px;font-weight:700;color:#C1481F">카톡 말고, 새가 물어다 주는 편지</div></div>`;
  if (s.kind === "card") return `<div class="sc" id="s${i}"><img src="${f("promo/cards/c12-penpal-2.png")}" style="position:absolute;inset:0;width:${W}px;height:${H}px">
    <div class="cap" style="top:1180px;font-size:58px">${s.cap}</div></div>`;
  if (s.kind === "end") return `<div class="sc" id="s${i}" style="background:#1E3A5C;text-align:center">
    <img src="${f("promo/store/play-icon-512.png")}" style="position:absolute;left:440px;top:150px;width:200px;height:200px;border-radius:48px;box-shadow:0 30px 60px rgba(0,0,0,.3)">
    <div style="position:absolute;left:0;right:0;top:380px;font-size:110px;font-weight:900;letter-spacing:-5px">새편지</div>
    <div style="position:absolute;left:0;right:0;top:530px;font-size:50px;font-weight:800;color:#F0BC5C">${SLOGAN}</div>
    <div class="btn" style="top:680px;background:#fff;color:#16110E;padding:30px 0;font-size:${STORY === "kakao" || STORY === "dad" ? 44 : 40}px">${END.ios}</div>
    <div class="btn" id="prof" style="top:820px;background:#F0BC5C;color:#16110E;padding:24px 0;font-size:40px">👆 링크는 프로필에 @saepyeonji</div>
    <div style="position:absolute;left:60px;right:60px;top:970px;font-size:40px;font-weight:800;line-height:1.5">${END.android}</div>
    <div style="position:absolute;left:0;right:0;top:1200px;font-size:32px;font-weight:700;opacity:.75">무료로 시작해요</div></div>`;
  return `<div class="sc" id="s${i}"><img class="bg" id="i${i}" src="${f(s.img!.includes("/") ? `promo/inbox/${s.img}.png` : `${SRC}/${s.img}.png`)}">
    ${s.chip ? `<div class="chip"><span>${s.chip}</span></div>` : ""}<div class="cap${s.hook ? " hook" : ""}">${s.cap}</div></div>`;
}).join("\n")}
<script>
const FIC_END = ${STORY === "kakao" ? 37.4 : STORY === "gone2" ? 44.95 / SPD : STORY === "friend" ? 33.82 : STORY === "army" ? 41.66 / SPD : 37.6}, END_AT = ${S[S.length - 1].a};
const S = ${JSON.stringify(S.map((s) => ({ a: s.a, b: s.b, fx: s.fx, z: s.z, img: !!s.img })))};
const IW = ${H} * 1280 / 720; // 그림 높이를 화면에 맞췄을 때 너비
const ease = (x) => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);
window.at = (t) => {
  S.forEach((s, i) => {
    const el = document.getElementById("s" + i);
    const o = Math.min(i === 0 ? 1 : (t - s.a) / 0.3, (s.b - t) / 0.3 + (i === S.length - 1 ? 9 : 0));
    el.style.opacity = Math.max(0, Math.min(1, o));
    if (s.img) {
      const k = ease((t - s.a) / (s.b - s.a));
      const fx = s.fx[0] + (s.fx[1] - s.fx[0]) * k, z = s.z[0] + (s.z[1] - s.z[0]) * k;
      const left = Math.min(0, Math.max(${W} - IW, ${W} / 2 - fx * IW));
      const img = document.getElementById("i" + i);
      img.style.left = left + "px"; img.style.transform = "scale(" + z + ")"; img.style.transformOrigin = (fx * 100) + "% 55%";
    }
  });
  document.getElementById("fic").style.opacity = t < FIC_END ? 1 : 0;
  const p = document.getElementById("prof"); if (p) p.style.transform = "scale(" + (1 + Math.max(0, Math.sin((t - END_AT) * 6)) * 0.05) + ")";
};
</script></body></html>`;

const tmp = resolve(root, `promo/.reel-frames-${NAME}`);
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });
writeFileSync(`${tmp}/index.html`, html);
const browser = await chromium.launch({ args: ["--allow-file-access-from-files"] });
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.goto("file://" + tmp + "/index.html", { waitUntil: "load" });
await page.evaluate(async () => { await (document as any).fonts.ready; await Promise.all([...document.images].map((i) => i.decode().catch(() => {}))); });
const N = Math.round(T * FPS);
for (let i = 0; i < N; i++) {
  await page.evaluate((t) => (window as any).at(t), i / FPS);
  await page.screenshot({ path: `${tmp}/f${String(i).padStart(4, "0")}.jpg`, type: "jpeg", quality: 90 });
}
await browser.close();

mkdirSync(resolve(root, "promo/video/card"), { recursive: true });
const card = resolve(root, `promo/video/card/${NAME}.mp4`);
const voice = resolve(root, VOICE);
const music = resolve(root, "promo/video/saepyeonji-15s.mp4");
// 목소리는 그대로, 음악은 작게 깔고 끝에서 줄여요
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-framerate", String(FPS), "-i", `${tmp}/f%04d.jpg`, "-i", voice, "-stream_loop", "-1", "-i", music,
  "-filter_complex", `[2:a]atrim=0:${T},volume=0.16,afade=t=out:st=${T - 2}:d=2[m];[1:a]${SPD !== 1 ? `atempo=${SPD},` : ""}apad=whole_dur=${T}[v];[v][m]amix=inputs=2:duration=first:normalize=0[a]`,
  "-map", "0:v", "-map", "[a]", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", "-t", String(T), card]);
const tall = resolve(root, `promo/video/${NAME}.mp4`);
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", card, "-vf", "pad=1080:1920:0:285:color=0x16110E", "-c:v", "libx264", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", tall]);
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", `${tmp}/f0000.jpg`, resolve(root, `promo/video/${NAME}-cover.png`)]);
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", `${tmp}/f0000.jpg`, resolve(root, `promo/video/card/${NAME}-cover.jpg`)]);
rmSync(tmp, { recursive: true, force: true });
console.log(NAME, card, tall);
