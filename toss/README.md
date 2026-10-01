# 새편지 앱인토스 빌드 (틀 + 화면 규칙)

> 작업일 2026-10-01 / 개발자. 범위: 요건점검표의 ① 틀 + ② 화면 규칙. (③ 식별키·공유 링크, ④ 약관·방침, 배포·콘솔 업로드는 하지 않았습니다.)
> 근거 문서: 앱인토스 공식 개발자센터(developers-apps-in-toss.toss.im)의 "기존 웹 프로젝트에 SDK 연동하기", "SDK 3.x 마이그레이션", "네비게이션 바 설정", "NavigationBar.setOptions", 출시 체크리스트, FAQ.

## 실행 명령 (C:\bl 에서)

| 명령 | 하는 일 |
|---|---|
| `npm run build:toss` | 토스용 정적 빌드. 결과는 `toss/out/` |
| `npm run check:toss` | 토스 빌드 + 구조·크기·eval·금지 요소·라이트 모드·(가능하면) 브라우저 점검 |
| `npx ait build` | `toss/out/`을 묶어 `saepyeonji.ait` 번들 생성(업로드 아님. 먼저 `build:toss` 필요) |
| `npm run check` | 웹 빌드 점검(기존과 같음) |

## 구조

- 웹(Vercel): 루트 `src/`, 루트 `next.config.mjs` — 동작 변경 없음.
- 토스: `toss/` 폴더가 별도 Next 프로젝트(`next build toss`). 화면 코드는 `src/`를 그대로 가져다 쓰고(`toss/app/*/page.tsx`는 한 줄짜리 연결), 토스에서만 다른 곳은 `src/lib/target.ts`의 `IS_TOSS`(빌드 때 `NEXT_PUBLIC_TARGET=toss`로 채워짐, 웹에서는 항상 false)로 분기합니다.
- `toss/next.config.mjs`: `output: "export"`(서버 렌더링 없음), `trailingSlash`, 루트 `.env.local`의 Firebase 값을 읽어 번들에 넣음.
- `apps-in-toss.config.ts`(루트): 앱인토스 SDK 설정. `ait build`가 프로젝트 루트(package.json 있는 폴더)에서 이 파일을 읽습니다.
- `toss/toss.css`: 라이트 모드 고정. 웹의 `globals.css`는 수정하지 않았고, 토스 빌드에서 다크 블록을 같은 라이트 값으로 덮어씁니다(값이 웹과 같은지 `check:toss`가 검사).

## 설치한 패키지 (devDependency만)

- `@apps-in-toss/web-framework` **3.7.0** (`npm install -D`, package.json에는 `^3.7.0`). 이 패키지가 `ait` 명령을 제공합니다.
- 그 밖에 새로 추가한 패키지는 없음(`package-lock.json`에는 이 패키지의 하위 의존성이 함께 들어와 크게 늘었음).
- TDS(`@toss/tds-mobile`)는 넣지 않았습니다(필수 아님. 공식 문서 예시는 React 18을 안내하는데 이 프로젝트는 React 19라 충돌 가능성이 있어 보류 → 필요해지면 확인).

## 만든 것

1. **정적 빌드(SSR 없음)**: `next build toss` 성공, `toss/out/`에 index.html 등 정적 파일만 생성. 공식 문서는 "SSR 금지, CSR/SSG만"이라고 명시하지만 **"Next.js 정적 export를 앱인토스 번들로 올려도 되는가"는 문서에서 찾지 못했고**(문서 기본 예시는 Vite) 질의 응답도 "찾을 수 없음"이었습니다. `ait build`는 `toss/out/`을 묶어 `saepyeonji.ait`을 만드는 데 성공했지만, 실제 토스 앱 안에서 열리는지는 검증하지 못했습니다.
2. **동적 경로 처리**: 웹은 `/letter/<ID>` 그대로. 토스는 `/letter/?id=<ID>` 한 장짜리 화면(`toss/app/letter/page.tsx`). 편지 화면 본문을 `src/components/LetterView.tsx`로 옮겨 두 곳이 같이 씁니다(웹의 `letter/[id]/page.tsx`는 이 컴포넌트를 부르는 얇은 파일). 편지 링크 만드는 곳(홈 3곳, 편지 쓰기 후 이동, 공유)은 `letterHref()`를 쓰고 웹에서는 예전과 똑같은 주소가 나옵니다.
3. **SDK 설정**: SDK **3.x** 기준 `apps-in-toss.config.ts`. **중요: 3.x에서는 설정 파일 이름이 `granite.config.ts`에서 `apps-in-toss.config.ts`로, `outdir`이 `webBundleDir`로 바뀌고 `brand.displayName`·`icon`이 설정 파일에서 빠졌습니다**(공식 3.x 마이그레이션 문서). 요건점검표와 `console-copy.md`의 "granite.config.ts의 displayName" 표현은 옛 방식이니 참고만 하세요. appName은 `saepyeonji`(제안값, 콘솔 등록값과 같아야 함).
4. **토스 빌드에서만 적용한 화면 규칙** (웹은 그대로)
   - 라이트 모드 고정(다크 모드 폰에서도 배경 라이트로 확인).
   - viewport `maximum-scale=1, user-scalable=no`(확대·축소 비활성).
   - 자체 하단 메뉴 제거. 대신 홈 위쪽에 "편지 쓰기"·"설정" 버튼을 둠(토스 내비게이션 바에는 탭 메뉴 기능이 없어서). 편지·붕붕이 화면의 자체 "홈으로" 버튼 제거(토스 바 뒤로가기만 사용). 토스 바는 `navigationBar: { withBackButton: true, withHomeButton: false, withTitle: true }`로 설정(공식 `navigationBar` 옵션).
   - `?demo=1`(빨리 감기), `?test=1`(60배속), "받은 편지함(예시)" 가짜 목록, 설정의 알림 토글 3개와 "(테스트)" 문구 숨김. `/welcome`(체험판 소개)과 `/privacy`(체험판 기준 옛 처리방침)는 토스 빌드에서 제외하고 설정의 처리방침 링크도 숨김(④에서 토스용을 새로 만들어야 함).
5. **`npm run check:toss`**: 아래 "검사 결과" 참고.

## 검사 결과 (2026-10-01, 이 컴퓨터)

- `npm run check`(웹): 핵심 계산 24/24 통과, 빌드 성공, 11개 주소 통과. 웹 화면·주소는 예전과 같음. (웹 번들에도 `letter?id=` 글자가 소스에 들어 있으나 `IS_TOSS`가 false라 실행되지 않음.)
- `npm run check:toss`: 1~6단계 **모두 통과**(빌드, 구조, 3.42MB(100MB 이하), eval·new Function 없음, 체험판 문구 없음, Firebase 값 포함, viewport 확대 금지, 라이트 값 13개 일치). 단, **7단계(자동 브라우저 점검)는 이 환경에서 Edge가 실행되지 않아 건너뜀** → 스크립트는 "△ 건너뜀"이라고 따로 표시합니다.
- 7단계 대신 **Browser 창으로 직접 확인**(`toss/out`을 로컬에 띄워서, 폰 크기 + 다크 모드 켠 상태): 배경 라이트 유지, 하단 메뉴 없음, 홈의 두 버튼, 설정에 알림·처리방침·"(테스트)" 없음, `?test=1`·`?demo=1` 무시, 편지 보내기 → `/letter/?id=…` 이동과 새로고침 후 다시 열림, 편지 화면에 "홈으로" 없음, 내 데이터 삭제 후 홈으로 복귀. 이때 실제 Firebase에 시험 편지 1건이 만들어졌다가 앱의 "내 편지와 데이터 모두 삭제"로 지워졌습니다. 이 확인은 내 컴퓨터(localhost) 기준이며 **토스 앱 안에서의 동작은 검증하지 못했습니다.**
- eval 검사 참고: 빌드 결과에 `Function("return this")`가 2곳(Next 폴리필, webpack 전역 객체 찾기) 있습니다. 외부 코드 실행이 아닌 표준 코드지만 앱인토스의 자동 검사가 오탐할 수 있어 **확인 필요**(오탐 시 채널톡 수동 승인이라는 기존 기록 참고).

## 못 한 것 / 하지 않은 것 (범위 밖 또는 불가)

- 식별키(`getAnonymousKey`), 공유 링크 `intoss://`(점검표 A-10, A-16), 토스 로그인 판단 — ③ 단계.
- 약관·운영정책·개인정보 처리방침 — ④ 단계. 토스 빌드에는 처리방침 화면이 지금 없습니다.
- 토스 앱·실기기·콘솔 업로드·`ait deploy`·QR 테스트, 배포·push — 하지 않음(승인 범위 밖). `ait build`로 로컬 번들(`saepyeonji.ait`)만 만들어 봤고 업로드하지 않았습니다(`.gitignore`에 `*.ait` 추가).
- 스크린샷 제작(점검표 B).

## 확인 필요 (문서로 확정하지 못함)

1. Next.js 정적 export 결과를 앱인토스 번들로 올려 실제 토스 앱에서 열 수 있는지(문서에 Next 언급 없음). 가장 위험하므로 승인 후 시험 번들(QR) 확인 권장.
2. 번들이 호스팅되는 주소의 기준 경로. 지금 빌드는 `/_next/...` 절대 경로를 씀. 공식 CORS 문서상 주소는 `https://<appName>.web.tossmini.com`(실서비스), `https://<appName>.private-web.tossmini.com`(QR 테스트)로 적혀 있어 루트 경로일 가능성이 높지만 확정은 못 함. 또 `/letter/` 같은 폴더 주소가 그 호스팅에서 `index.html`로 열리는지(`trailingSlash: true`로 대비했지만 미확인).
3. Firebase(익명 로그인·Firestore)가 위 토스 주소(`*.web.tossmini.com`)에서 동작하는지. 공식 문서는 CORS 허용 목록에 위 두 주소를 등록하라고 하는데 Firebase 쪽 허용 설정(승인된 도메인 등)이 필요한지 모름 → 콘솔 설정 변경이므로 대표 승인 후 시험.
4. 토스 내비게이션 바의 기본값과 뒤로가기 동작(WebView에서 `history.back` 연동 여부)은 문서에 없음. 설정에 명시했지만 실기기에서 첫 화면 뒤로가기 = 앱 종료인지, 안드로이드 백버튼이 맞는지 확인 필요.
5. 앱 안 `window.confirm`(신고·차단·삭제 확인창)이 토스 WebView에서 정상 뜨는지(문서 미확인).
6. 폰트(Pretendard 가변 폰트 2.0MB)가 토스 iOS WebView에서 흰 화면 문제를 일으키지 않는지(공식 문서가 폰트·이미지 용량을 원인 후보로 언급) — 실기기 확인.
7. SDK 3.x 번들을 출시하면 2.x로 되돌릴 수 없다고 문서에 있음(QR로 충분히 시험 후 출시).
