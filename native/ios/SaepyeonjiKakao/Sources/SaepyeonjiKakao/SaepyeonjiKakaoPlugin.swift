import Foundation
import Capacitor
import KakaoSDKCommon
import KakaoSDKAuth
import KakaoSDKUser

/// 카카오톡 간편 로그인: 카카오톡이 있으면 카카오톡이 열려 [동의]만 누르면 끝(아이디·비밀번호 안 침), 없으면 카카오 계정 화면.
/// 웹(src/lib/firebase/kakao.ts)은 받은 접근 토큰을 우리 서버(/api/auth/kakao)로 보내 카카오에 직접 확인해요.
@objc(SaepyeonjiKakaoPlugin)
public class SaepyeonjiKakaoPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SaepyeonjiKakaoPlugin"
    public let jsName = "SaepyeonjiKakao"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "login", returnType: CAPPluginReturnPromise),
    ]
    private var ready = false

    override public func load() {
        if let key = getConfig().getString("appKey"), !key.isEmpty {
            KakaoSDK.initSDK(appKey: key)
            ready = true
        }
        // 카카오톡에서 돌아오는 주소(kakao{앱 키}://oauth)를 카카오 도구에 넘겨요
        NotificationCenter.default.addObserver(self, selector: #selector(openUrl(_:)), name: .capacitorOpenURL, object: nil)
    }

    @objc private func openUrl(_ note: Notification) {
        guard let obj = note.object as? [String: Any], let url = obj["url"] as? URL else { return }
        Task { @MainActor in
            if AuthApi.isKakaoTalkLoginUrl(url) { _ = AuthController.handleOpenUrl(url: url) }
        }
    }

    @objc func login(_ call: CAPPluginCall) {
        guard ready else { call.reject("not-configured"); return }
        Task { @MainActor in
            let done: (OAuthToken?, Error?) -> Void = { token, error in
                if let token = token {
                    call.resolve(["accessToken": token.accessToken])
                } else if let e = error as? SdkError, case .ClientFailed(let reason, _) = e, reason == .Cancelled {
                    call.reject("cancelled")
                } else {
                    call.reject(error?.localizedDescription ?? "kakao-failed")
                }
            }
            if UserApi.isKakaoTalkLoginAvailable() {
                UserApi.shared.loginWithKakaoTalk(completion: done)
            } else {
                UserApi.shared.loginWithKakaoAccount(completion: done)
            }
        }
    }
}
