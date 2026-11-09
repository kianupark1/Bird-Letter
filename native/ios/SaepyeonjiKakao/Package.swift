// swift-tools-version: 5.9
// 새편지 카카오톡 간편 로그인(카카오 공식 아이폰 도구). scripts/ios-kakao.mjs가 CapApp-SPM에 붙여요.
import PackageDescription

let package = Package(
    name: "SaepyeonjiKakao",
    platforms: [.iOS(.v15)],
    products: [.library(name: "SaepyeonjiKakao", targets: ["SaepyeonjiKakao"])],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "8.0.0"),
        .package(url: "https://github.com/kakao/kakao-ios-sdk", from: "2.22.0"),
    ],
    targets: [
        .target(
            name: "SaepyeonjiKakao",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "KakaoSDKCommon", package: "kakao-ios-sdk"),
                .product(name: "KakaoSDKAuth", package: "kakao-ios-sdk"),
                .product(name: "KakaoSDKUser", package: "kakao-ios-sdk"),
            ]
        ),
    ]
)
