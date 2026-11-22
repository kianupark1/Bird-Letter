# 새편지 (Sae Pyeonji) — 작업 설명서

새 세션에서 "새편지 이어서 가자"라고 하면 이 문서로 이어 갑니다.
**지난 결정·과정·이유의 전체 기록은 `docs/기록-전체.md`** (2026-11-18까지). 이 문서에 없는 내용이 필요하면 거기서 찾아(grep) 읽을 것. 새 결정은 이 문서에 짧게 적고, 길어지면 기록 문서로 옮긴다.

## 1. 앱 한 줄

실제 거리만큼 새가 날아가서 편지가 도착하는 한국형 느린 메신저. 앱 이름 **새편지**(UI 제목은 "새 편지"). Carrier Pidge에서 영감, 한국 정서·지리에 맞춤. 한국 출시.

## 2. 꼭 지킬 원칙

- **기다림의 미학**(가장 중요): 모든 기능·문구·연출은 기다림을 더 설레게 하는 쪽. 즉시 도착·도착 시간 단축 결제·확률을 돈으로 사는 상품은 금지. 편지는 사라지지 않고 꼭 도착.
- **과정은 둘 다 알고, 내용은 보낸 사람만 안다**: 날아가는 위치·도착 시각·사고는 둘 다 지도로 보고, 내용은 도착 뒤 받는 사람이 연다.
- **슬로건 "기다림도 소통의 일부입니다."** 를 모든 홍보물에 글자 그대로(`promo/store.mts SLOGAN`, 자동 게시는 `withSlogan`이 저절로 붙임).
- **홍보가 가장 중요**: 일의 순서는 "이걸로 몇 명이 더 오나"를 먼저. 보고마다 홍보 현황 한 줄.
- **수익이 기본**: 제안마다 수익 영향 한 줄. 돈이 오가는 결정은 재무 → 법무 → 대표 승인. 법무·재무는 AI 정리일 뿐 전문가 검토를 대신하지 않음.
- **단순함**: 주 화면에 카드를 늘어놓지 말고 버튼·시트·설정 안으로.
- **연락처 연결·사진 첨부는 절대 빼지 않음**(번호로 친구 찾기는 법무 뒤 반드시). 예약 발송만 우선순위 뒤.
- 홍보 문구에 **"실제 새 속도와 같다" 금지** → "실제 새의 비행 속도를 바탕으로". 지어낸 후기·사용자 이야기 금지, 연출 영상은 "연출된 가상의 이야기" 표시. 펜팔은 "펜팔 친구"로만(연애·소개팅·랜덤 만남 금지), 만 14세 이상 표시.
- 모르는 숫자·정책은 「미확인」, 가정은 「가정」.

## 3. 대표님과 일하는 방식

- 대표님은 비개발자. **쉬운 한국어**, 전문 용어 없이. 회사에서 **폰으로** 볼 때가 많아 짧게.
- 보고·작업은 **"OO팀 책임자입니다"** 로 시작(기획·조사·디자인·개발·검수·홍보·고객응대·법무·재무).
- 대표님이 가야 하는 곳은 **매번 링크·누를 버튼·붙여 넣을 글을 한 메시지에**. "앞에서 말한 대로" 금지. 한 번에 한 단계.
- **자동화할 수 있는 건 다 끝낸 뒤** "이것만 해 주세요".
- **두 번 시키지 않기**: 맡기기 전에 아래 "이미 끝낸 일"과 `docs/기록-전체.md`를 확인.
- **비밀 값(열쇠·비밀번호·아이디)은 채팅에 받지도 붙이지도 않음.** 필요하면 대표님이 직접 Vercel·GitHub 비밀 값에 넣게 안내. 화면 사진을 부탁할 땐 값이 가려졌는지 확인.
- **특별 광고(special 글)는 대표님이 "올려"라고 할 때만** 올림. 자동 예약 글은 그대로.
- 자주 쓰는 링크: Vercel 환경 변수 https://vercel.com/kianupark1-7752s-projects/bird-letter/settings/environment-variables · 카카오 개발자 https://developers.kakao.com/console/app · Firebase https://console.firebase.google.com/ · 사이트 https://bird-letter.vercel.app · 스레드 https://www.threads.com/@saepyeonji
- "OO 직원으로 일해줘" 요청 시 역할(Chief of Staff·기획·조사·디자인·개발·검수·마케터·CS)은 `docs/기록-전체.md` "직원 8명 업무 지시서".

## 4. 지금의 새·시간 (`core/birds.ts`, `core/flight.ts`)

고를 수 있는 새 4종(대략값). 걸리는 시간 = max(최소 시간, 순항 시간), 편지마다 컨디션 ±15%·사고(길 잃음·나무 걸림, 원래 시간의 25~75% 멈춤)는 **편지 ID로 결정**(서버 저장 없음, 양쪽 화면 같음).

| 새 | 시속 | 최소 | 서울→부산 |
|---|---|---|---|
| 매 | 약 90km | 30분 | 3시간 37분 |
| 비둘기 | 약 65km | 1시간 | 5시간 |
| 까치 | 약 35km | 2시간 | 9시간 17분 |
| 참새 | 약 28km | 3시간 | 11시간 36분 |

**비·눈 오는 날**(2026-11-22): 지금 보내는 편지만 출발·중간·도착지의 지금 날씨를 봐서(Open-Meteo, 열쇠 없음, 2.5초 안에 못 받으면 맑은 날처럼) 비 1.3배·눈 1.5배 오래 걸림. 편지에 `weather`(rain·snow) 저장, 화면에 "🌧 비가 와서 천천히" 표시(`core/weather.ts`). 예약 편지는 날씨 없음.

제비·두루미·붕붕이는 빠진 새(예전 편지 그림·시간에만). 붕붕이는 유료로 부활 예정. 그림은 `src/components/CuteBird.tsx`(A 서 있는 새·C 나는 새), 지도 위 나는 새 `FlyBird.tsx`.

## 5. 출시 상태 (2026-11-18)

- **아이폰**: 앱스토어 출시(1.1, 2026-11-09). 주소 https://apps.apple.com/kr/app/id6828785320 (Apple ID 6828785320). **1.2는 반려**(2.1 앱 완성도, 심사 중 꺼짐 기록 2개) → 꺼짐 고치기 + 수익 기능(우표·붕붕이·옷·StoreKit)을 넣어 다시 제출 예정. 자동 빌드 `ios-release.yml`(맥 없이 TestFlight), 제출 `ios-submit.yml`, 시뮬레이터 점검 `ios-sim-check.yml`.
- **안드로이드**: 구글 플레이 개인 계정. 내부 테스트 빌드 8, **비공개 테스트(zardu 대행, 2026-11-13 시작) → 2026-11-27부터 프로덕션 신청 가능**(답안 `docs/구글-프로덕션-신청.md`). 2~3일마다 설치 기기 그래프가 12대 아래로 떨어졌는지 확인. 비공개 트랙 업데이트 1번은 통과율에 도움(빌드 9 = 짹짹 알림 소리). 플레이 나오기 전 홍보의 안드로이드 줄은 **웹앱**(`https://bird-letter.vercel.app`, 크롬 '앱 설치'). 갤럭시 스토어는 대표님 판매자 가입 중(`docs/갤럭시스토어-등록.md`).
- **웹**: https://bird-letter.vercel.app (Vercel, main 합치면 자동 배포).
- 숫자(2026-11-17 저녁): 가입 14명·전체 편지 91통(대부분 대표님)·알림 켠 사람 6명. 매일 저녁 7시 숫자는 Actions "오늘의 숫자 알림"(`daily-stats.yml`) 로그·운영자 폰 알림, 화면은 `/admin`.

## 6. 사업·계정

- 상호 **부르노소노**(영문 BRUNOSONO, 개인사업자), 문의 animalmode@naver.com(`src/lib/release.ts OPERATOR`).
- 통신판매업 신고 **2026-서울송파-3095호**(부르노소노의 모든 앱 공용, 매년 1월 등록면허세).
- 애플 개발자(개인, 팀 ID XNFA8ZZW4Q), 무료·유료 앱 계약 활성화. 구글 플레이 개인 계정. D-U-N-S 없음(두 번 거절).
- 앱 ID `com.saepyeonji.app`(확정, 못 바꿈). Firebase 프로젝트 `bird-letter`, 카카오 앱 ID 1578396.

## 7. 수익 (확정된 것)

- 유료는 **모습·연출만**(시간·사고 확률은 무료와 같게), 뽑기 없음.
- 가격: 펜팔 우표 **3장 1,300원·5장 1,700원**(하루 5통 무료, 7일 답장 없으면 돌려줌), **붕붕이 1,000원**, 새 옷 **한 개 900원·왕관 1,100원·우체부 세트 1,500원**(꽃핀 무료). 코드 `core/appleIap.ts`, `src/components/BirdOutfit.tsx`.
- 앱 안 결제는 **새 앱 버전(1.2/1.3)+StoreKit**이 있어야 함. 옷 시안(`docs/시안/images/v13-*`) 대표님 확정 대기.
- 광고(앱 안)는 지금 없음. 유료 홍보 광고는 재무 → 대표 승인 뒤(애플 검색 광고 검토, 메타는 비즈니스 계정 광고 제한 상태).
- 선물(용돈 봉투·기프티콘)은 zardu 끝·정식 출시 뒤.

## 8. 홍보 운영 (`scripts/auto-post.mjs`, `promo/schedule.json`, `.github/workflows/auto-post.yml`)

- 채널: **인스타·스레드·X 자동**, 틱톡은 대표님 폰으로 직접. 유튜브·카카오 채널·네이버 블로그는 보류(블로그는 대표님이 만들면 예약 발행으로).
- **모든 글 본문에 링크 필수**: `👉 앱스토어 바로 가기 …` + `👉 안드로이드 바로 가기 https://bird-letter.vercel.app` + "링크는 프로필에" 줄(`storeLines`). 스레드는 링크를 **첫 문단 바로 아래**(더 보기로 접히기 전), 인스타는 링크가 안 눌려서 프로필 안내. `{{받기}}` 없는 글은 만들지 말 것. 그림 글은 여러 장(한 장 금지).
- 올리는 시각(한국): 아침 8:30(noon)·저녁 5:30(evening)·밤 10:00(night) = 인스타·스레드·X / **스레드만**: 10:30 앱 광고(dev)·12:30(talk1)·15:30(talk3)·20:30(talk2). special*는 손으로만. 시각마다 다시 시도 cron 여러 개, 빠진 글은 늦게라도(`autoSlot`). 기록은 `autopost-log` 브랜치 `posted.txt`(채널별).
- 손 실행: Actions "홍보 글 자동 게시" 입력 `send`(true/false)·`slot`·`only`(그 채널만 다시)·`delete_text`(그 글자로 시작하는 스레드 글 지우기 — **스레드 API 권한이 없어 지금은 실패**, 지우기는 대표님 앱에서). `send=false`면 열쇠 확인 + 인스타 게시물 수(3으로 나눈 나머지).
- **인스타 격자 하루 3개 같은 색**: 날마다 남색 → 황토 → 한지 → 먹 → 다홍(`promo/build-covers.mts`, START 2026-11-17 = 남색). **새 글을 일정에 넣으면 `npx tsx promo/build-covers.mts` 다시 돌리기**(색 표지 자동, 특별 글에 표지가 필요하면 `colorCover: true`). 특별 글은 하루 3개를 넘기지 않게 그날 자동 글 자리를 바꿔 넣기.
- 스레드 전략: 짧게·질문/투표(`poll: [...]`)로 끝내기·해시태그 1개·하루 여러 번·댓글엔 대표님이 빨리 답. **댓글 → 진짜 편지 이벤트**: "🕊 댓글 편지 배달"이 들어간 우리 글에 댓글을 달면 대표님 계정으로 비둘기 편지(약 1시간)가 가고 링크 답글이 달림(`scripts/threads-letters.mjs`, `core/campaign.ts`, 서버 `/api/campaign/letter` = GitHub OIDC aud `bird-letter-campaign`만, `threads-letters.yml` 한 번 돌면 5시간 40분 동안 5분마다, 기록 `campaign-log` 브랜치).
- 만든 사람 글로 퍼뜨리기: 긱뉴스 Show GN(계정 animalmode, **2026-11-23 저녁 8시부터** 글쓰기, 알림 예약됨)·디스콰이엇·Product Hunt 등 붙여 넣을 글은 `docs/만든사람-글.md`, `docs/앱소개-사이트.md`. 블로그 체험단은 2주 뒤 소규모 시험(유료라 재무 → 대표 승인, "광고/협찬" 표시 필수).
- 홍보물 만들기: 카드 `promo/build-carousel*.mts`·`build-classic*.mts`·`build-story.mts`, 릴스 `promo/build-reel-*.mts`(철수 씨·영희 씨, 연출 표시), 영상 4:5 사본 `promo/video/card/`. 인스타 자동 게시는 JPG만(카드마다 같은 이름 .jpg). X 영상 글은 표지 그림(`cover` 칸 = 그림 경로, png 없으면 jpg 지정).
- GitHub 예약 실행은 자주 늦거나 빠짐 → 근본 해결은 QStash 정시 예약(`/api/autopost/tick`), **대표님이 GitHub 토큰을 Vercel `GH_DISPATCH_TOKEN`에 넣은 뒤** `autopost-setup.yml` 실행.

## 9. 기술 지도

- **구조**: Next.js 웹(Vercel) + Capacitor 껍데기(스토어 앱은 배포 주소를 그대로 엶 → 웹을 고치면 앱도 바뀜, 단 결제·알림 소리 같은 앱 안 기능은 새 앱 파일) + Firebase(익명·카카오·네이버·구글·애플 로그인, Firestore 서울) + Upstash QStash(알림 예약) + GitHub Actions(빌드·게시·점검).
- 공통 계산은 **`core/`**(birds·flight·routes·places·threads·penpal 등, `src/lib/*`는 연결 파일). 화면 `src/app/*`, 부품 `src/components/*`.
- 주요 화면: 홈=채팅 목록 `src/app/page.tsx`, 대화방 `src/app/room/page.tsx`(+`RoomComposer.tsx`, `ChatLetter.tsx`), 편지 링크 `/letter/[id]`(`LetterView.tsx`), 친구 `/friends`, 펜팔 `/pen`·`/pen/browse`·`/penpal`, 랭킹 `/rank`, 설정 `/settings`, 초대 `/invite`, 운영자 `/admin`.
- 서버 입구(`src/app/api/*`): 카카오·네이버 로그인, 알림 예약·발송(`push/*`, 펜팔·친구 편지 알림 `push/letter`), 계정 삭제, 규칙 자동 게시(`/api/rules`, OIDC), 매일 숫자(`admin/daily`), 화면 오류 수집(`client-error`), 댓글 편지(`campaign/letter`). 서비스 계정은 Vercel `FIREBASE_SERVICE_ACCOUNT_JSON`.
- Firestore 규칙 `firebase/firestore.rules`: main에 합치면 **자동 게시**(대표님께 부탁하지 말 것). 시험 `scripts/rules-emulator.mjs`.
- 시험: `npm run test:core`(핵심 계산, 지금 542개 통과), `node scripts/e2e-local.mjs`(서버 없이 화면 흐름), 큰 화면 변경은 e2e 통과 뒤 배포(zardu 테스트 중 앱이 늘 정상으로 열리게).
- 안드로이드 빌드 `android-release.yml`(AAB·APK, 업로드 키 비밀 값 4개 들어 있음), 아이폰 빌드 위 5번.
- 이 저장소의 Claude 도구: `.claude/skills`(agent-browser·find-skills·taste-skill·mcp-builder), GSD(`/gsd-*`, standard, 훅 `.claude/settings.json`). agent-browser 프로그램은 세션마다 `npm i -g agent-browser`.
- 함정: Windows PowerShell 파이프로 환경 변수를 넣으면 BOM이 붙음(`vercel env add 이름 production --value "값"`). 스레드 API는 글 지우기 권한 없음. 자동 게시에서 `cover` 칸은 X 표지 그림 경로라 다른 뜻으로 쓰지 말 것.

## 10. 대표님 결정·할 일 대기

1. 스레드 옛 글 "개발을 하나도 몰라요" 직접 삭제(⋯ → 삭제).
2. 댓글 편지 이벤트 첫 댓글에 대표님 답글, 아는 분 2~3명에게 댓글 부탁.
3. 인스타 피드 맨 윗줄 남색 글 개수(줄 맞춤 확인).
4. 네이버 블로그 만들기 → 주소만 알려 주면 예약 발행용 4편 전달.
5. 디스콰이엇 프로덕트 등록(글은 `docs/앱소개-사이트.md`).
6. GitHub 토큰 → Vercel `GH_DISPATCH_TOKEN`(홍보 정시 예약).
7. 새 옷 시안(v13) 확정 → 1.2 재제출(수익 기능 포함).
8. 2026-11-27 구글 프로덕션 신청, zardu 그래프 확인.
9. 갤럭시 스토어 판매자 가입 마무리.
10. 운영자 폰 알림이 안 옴(저녁 7시 숫자가 "no-sub") → 대표님 폰 앱 계정이 운영자 계정과 같은지·설정 "서버로 시험 알림 보내기" 확인.
11. 유료 홍보(애플 검색 광고·블로그 체험단) 금액은 재무 검토 뒤 결정.
12. **정식 출시 전 열쇠 교체(보안)**: 서비스 계정 키, 카카오 시크릿, QStash 키, X OAuth 2.0 클라이언트 시크릿, App Store Connect API 키 — 화면 사진으로 노출된 적 있음.

## 11. 이미 끝낸 일 (다시 시키지 말 것)

Firebase 프로젝트·규칙(자동 게시)·승인된 도메인, Vercel 환경 변수(푸시 8개·카카오·서비스 계정), 카카오 로그인·동의항목(닉네임·프로필 사진)·앱 아이콘·키 해시·JS 키, Upstash QStash, 애플 개발자 결제·번들 ID·API 키·APNs 키·유료 계약·세금·은행, 앱스토어 출시, 구글 플레이 가입·결제·신원 확인·기기 확인·판매자 선언·앱 만들기·앱 콘텐츠·스토어 등록정보·내부/비공개 테스트·Firebase SHA·GitHub 업로드 키 비밀 값, zardu 결제(11/13), 통신판매업 신고·등록면허세, SNS 계정(인스타·스레드·틱톡·X `saepyeonji`)·자동 게시 열쇠(스레드·인스타·X, 확인 완료), 긱뉴스 가입, 홈 화면 앱·알림 실기기 확인.

## 12. ChatGPT와 같이 쓰기

ChatGPT 프로젝트가 `docs/chatgpt-handoff.md`(main)를 읽어 감 → 이 문서에 중요한 결정·상태를 적을 때 **`docs/chatgpt-handoff.md`도 같은 PR에서 짧게 고칠 것**(비밀 값·uid·개인정보 금지, 저장소 공개). ChatGPT는 기획·문구·검토, 코드·배포·게시는 Claude Code. 검토 요청 도구 `scripts/ask-gpt.mjs`는 OpenAI 열쇠(환경 네트워크 비밀)를 넣기 전엔 동작 안 함.
