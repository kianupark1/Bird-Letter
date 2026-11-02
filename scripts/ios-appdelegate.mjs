/**
 * 아이폰 앱 AppDelegate.swift 손질(GitHub Actions 맥에서 scripts/ios-prepare.sh가 부름).
 *  1) 앱 알림: 애플이 준 APNs 번호를 Firebase Messaging에 넘겨서 FCM 토큰이 나오게 해요(@capacitor-firebase/messaging 안내 그대로)
 *  2) 어두운 화면: 위(상태 줄)·아래 여백이 한지색으로 남던 것 → 화면 모드에 맞춰 한지색/먹빛으로 칠해요(2026-11-01 대표님 실기기)
 *   node scripts/ios-appdelegate.mjs ios/App/App/AppDelegate.swift
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const file = process.argv[2];
// 시험용 스위치: PATCH_PARTS="push,theme,scene,opaque" 중 일부만(기본 전부)
// 2026-11-02: 화면 색칠(theme)은 시뮬레이터에서 앱을 멈추게(검은 화면·꺼짐) 해서 기본은 알림(push)만
const PARTS = (process.env.PATCH_PARTS || "push").split(",");
let s = readFileSync(file, "utf8");
if (s.includes("SaepyeonjiTheme")) { console.log("AppDelegate 이미 손질됨"); process.exit(0); }

if (!s.includes("import WebKit")) s = s.replace("import Capacitor", "import Capacitor\nimport WebKit");
const active = /func applicationDidBecomeActive\(_ application: UIApplication\) \{/;
if (!active.test(s)) throw new Error("applicationDidBecomeActive 를 찾지 못했어요");
if (PARTS.includes("theme")) s = s.replace(active, (m) => `${m}\n        SaepyeonjiTheme.apply()`);

s += `

${PARTS.includes("push") ? `// MARK: - 새편지 앱 알림(Firebase Messaging): APNs 번호를 플러그인에 넘겨요
extension AppDelegate {
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
    }

    func application(_ application: UIApplication, didReceiveRemoteNotification userInfo: [AnyHashable: Any], fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void) {
        NotificationCenter.default.post(name: Notification.Name.init("didReceiveRemoteNotification"), object: completionHandler, userInfo: userInfo)
    }
}` : ""}

// MARK: - 새편지 위·아래 여백 색: 밝은 화면 한지색 #FBF3E4, 어두운 화면 먹빛 #1A1613 (웹 globals.css --bg와 같음)
enum SaepyeonjiTheme {
    static let color = UIColor { t in
        t.userInterfaceStyle == .dark
            ? UIColor(red: 26 / 255, green: 22 / 255, blue: 19 / 255, alpha: 1)
            : UIColor(red: 251 / 255, green: 243 / 255, blue: 228 / 255, alpha: 1)
    }

    static func apply() {
        for case let scene as UIWindowScene in UIApplication.shared.connectedScenes {
            for window in scene.windows {
                window.backgroundColor = color
                if let root = window.rootViewController?.view { paint(root) }
            }
        }
    }

    private static func paint(_ view: UIView) {
        view.backgroundColor = color
        if let web = view as? WKWebView {
            ${PARTS.includes("opaque") ? "web.isOpaque = false" : ""}
            web.scrollView.backgroundColor = color
            web.underPageBackgroundColor = color
            return
        }
        view.subviews.forEach(paint)
    }
}
`;
writeFileSync(file, s);

// 화면(scene)을 쓰는 앱은 AppDelegate의 applicationDidBecomeActive가 안 불릴 수 있어서, SceneDelegate에서도 칠해요
const sceneFile = join(dirname(file), "SceneDelegate.swift");
if (PARTS.includes("scene") && existsSync(sceneFile)) {
  let sc = readFileSync(sceneFile, "utf8");
  if (!sc.includes("SaepyeonjiTheme")) {
    const end = sc.lastIndexOf("}");
    sc = sc.slice(0, end) + `
    func sceneDidBecomeActive(_ scene: UIScene) {
        SaepyeonjiTheme.apply()
        // 웹 화면이 처음 뜰 때 다시 칠해질 수 있어서 한 번 더
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { SaepyeonjiTheme.apply() }
    }
` + sc.slice(end);
    writeFileSync(sceneFile, sc);
  }
}
console.log("AppDelegate·SceneDelegate 손질 끝(앱 알림·어두운 화면 색)");
