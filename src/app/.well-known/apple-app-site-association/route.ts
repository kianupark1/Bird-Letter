// 아이폰 "앱이 있으면 앱으로 바로 열기"(유니버설 링크): 이 주소의 편지·초대·대화방 링크는 새편지 앱이 열어요.
// 팀 ID XNFA8ZZW4Q + 번들 ID com.saepyeonji.app (docs/아이폰-출시.md). 앱 쪽 설정은 scripts/ios-prepare.sh(associated-domains)
export const dynamic = "force-static";
export function GET() {
  const body = {
    applinks: {
      details: [{
        appIDs: ["XNFA8ZZW4Q.com.saepyeonji.app"],
        components: [{ "/": "/letter/*" }, { "/": "/invite*" }, { "/": "/room*" }, { "/": "/friends*" }, { "/": "/penpal*" }],
      }],
    },
  };
  return new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } });
}
