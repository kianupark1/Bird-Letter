/**
 * 홈 화면 추가(앱처럼 설치) 점검 14가지(2026-10-28, 대표님: "홈 화면에 추가 원활히 잘됨? 확실히 점검해줘").
 * 실행: 점검용 화면 src/app/zzpreview/page.tsx(addToHome 버튼 .o-home-test + externalOpenUrl(true)를 #u에 표시)를 잠깐 만들고
 *   npm run build && npx next start -p 3120 &  그다음 node scripts/check-install.mjs <사진 저장 폴더>  (끝나면 zzpreview는 지움)
 */
import { createRequire } from "node:module";
const req = createRequire(import.meta.url);
const { chromium } = (() => { try { return req("playwright"); } catch { return req("/opt/node-tools/node_modules/playwright"); } })();
const B = "http://localhost:3120", S = process.argv[2];
const IOS = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const AND = "Mozilla/5.0 (Linux; Android 14; SM-S921N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36";
const out = [];
const ok = (name, pass, extra = "") => out.push(`${pass ? "✓" : "✗"} ${name}${extra ? " — " + extra : ""}`);
const b = await chromium.launch();

// 0) 크롬이 보는 "설치 가능" 여부(크롬 자체 점검)
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  await p.goto(B + "/"); await p.waitForTimeout(5000); // 서비스 워커 등록 기다림
  const cdp = await ctx.newCDPSession(p);
  const r = await cdp.send("Page.getInstallabilityErrors");
  ok("크롬 설치 가능 판정(오류 없음)", r.installabilityErrors.length === 0, JSON.stringify(r.installabilityErrors.map((e) => e.errorId)));
  const m = await cdp.send("Page.getAppManifest");
  ok("앱 정보 파일 읽힘·오류 없음", !!m.url && (m.errors || []).length === 0, (m.errors || []).map((e) => e.message).join("; "));
  const sw = await p.evaluate(async () => !!(await navigator.serviceWorker.getRegistration()));
  ok("서비스 워커 켜짐", sw);
  await ctx.close();
}

// 1) 안드로이드 크롬: 화면이 뜨기 전에 온 설치 신호도 받아서 버튼 한 번에 설치 창
{
  const ctx = await b.newContext({ userAgent: AND, viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(() => {
    window.__prompted = 0;
    // 화면 그리기 전에(가장 이른 시점) 크롬이 신호를 보낸 것처럼
    document.addEventListener("readystatechange", () => {
      if (document.readyState !== "interactive" || window.__sent) return; window.__sent = 1;
      const e = new Event("beforeinstallprompt", { cancelable: true });
      e.prompt = async () => { window.__prompted++; }; e.userChoice = Promise.resolve({ outcome: "accepted" });
      dispatchEvent(e);
    });
  });
  const p = await ctx.newPage(); await p.goto(B + "/zzpreview"); await p.waitForTimeout(3000);
  await p.locator(".o-home-test").click(); await p.waitForTimeout(800);
  ok("안드로이드 크롬: 일찍 온 신호도 받아 버튼 한 번에 설치 창", (await p.evaluate(() => window.__prompted)) === 1);
  ok("안드로이드 크롬: 안내 창 대신 바로 설치", (await p.locator(".ig-sheet").count()) === 0);
  await ctx.close();
}

// 2) 카카오톡 안(아이폰·안드로이드): 안내 없이 바로 기본 브라우저로, install=1 붙임
for (const [name, ua, scheme] of [["아이폰 카카오톡", IOS.replace("Safari/604.1", "KAKAOTALK 10.8.5"), "kakaotalk://web/openExternal"], ["안드로이드 카카오톡", AND + " KAKAOTALK 10.8.5", "kakaotalk://web/openExternal"]]) {
  const ctx = await b.newContext({ userAgent: ua, viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage(); await p.goto(B + "/zzpreview"); await p.waitForTimeout(2500);
  const u = await p.locator("#u").textContent();
  await p.locator(".o-home-test").click(); await p.waitForTimeout(800);
  ok(`${name}: 기본 브라우저로 바로 넘김`, u.startsWith(scheme) && decodeURIComponent(u).includes("install=1"), u.slice(0, 60));
  ok(`${name}: 막히는 안내 창 없음`, (await p.locator(".ig-sheet").count()) === 0);
  await ctx.close();
}

// 3) 인스타그램 안(아이폰): 넘길 방법이 없으면 "Safari로 열기" 안내
{
  const ctx = await b.newContext({ userAgent: IOS.replace("Safari/604.1", "Instagram 300.0"), viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage(); await p.goto(B + "/zzpreview"); await p.waitForTimeout(2500);
  await p.locator(".o-home-test").click(); await p.waitForTimeout(800);
  ok("아이폰 인스타 안: Safari로 여는 방법 안내", (await p.getByText("Safari로 열기").count()) > 0);
  await ctx.close();
}

// 4) 아이폰 Safari: 카카오톡에서 넘어온 주소(install=1)면 안내가 저절로 뜨고 주소는 깨끗하게
{
  const ctx = await b.newContext({ userAgent: IOS, viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage(); await p.goto(B + "/invite?c=ABCD1234&install=1"); await p.waitForTimeout(3000);
  ok("아이폰 Safari: 넘어오면 홈 화면 추가 안내가 저절로", (await p.getByText("홈 화면에 추가").count()) > 0 && (await p.locator(".ig-sheet").count()) === 1);
  ok("아이폰 Safari: 주소에서 install=1 지움(초대 코드는 그대로)", p.url().endsWith("/invite?c=ABCD1234"), p.url());
  await p.screenshot({ path: S + "/inst-ios.png" });
  // 직접 [홈 화면에 추가]를 누른 경우도 안내
  await p.goto(B + "/zzpreview"); await p.waitForTimeout(2000); await p.locator(".o-home-test").click(); await p.waitForTimeout(600);
  ok("아이폰 Safari: 버튼 누르면 공유 → 홈 화면에 추가 안내", (await p.locator(".ig-sheet").count()) === 1);
  await ctx.close();
}

// 5) 컴퓨터: 안내 창이 안 뜸(쓸모없어서)
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage(); await p.goto(B + "/zzpreview"); await p.waitForTimeout(2000);
  await p.locator(".o-home-test").click(); await p.waitForTimeout(600);
  ok("컴퓨터: 폰용 안내 창은 안 뜸", (await p.locator(".ig-sheet").count()) === 0);
  await ctx.close();
}
await b.close();
console.log(out.join("\n"));
