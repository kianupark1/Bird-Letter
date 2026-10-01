import type { MetadataRoute } from "next";

// 폰에 "홈 화면에 추가"로 설치할 때 쓰이는 정보
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "새 편지",
    short_name: "새 편지",
    description: "실제 거리만큼 걸려 도착하는 느린 편지",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "ko",
    background_color: "#FBF3E4",
    theme_color: "#C1481F",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
