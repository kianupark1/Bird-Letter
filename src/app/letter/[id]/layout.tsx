import type { Metadata } from "next";

// 링크를 붙였을 때 보이는 미리보기 카드. 편지 내용은 도착 전까지 보낸 사람만 알아야 하므로 문구는 항상 같다.
export const metadata: Metadata = {
  title: "새가 편지를 물고 날아오고 있어요",
  description: "소식은 날아서 와요. 새편지에서 편지가 어디쯤 오는지 같이 기다려 보세요.",
  openGraph: {
    title: "새가 편지를 물고 날아오고 있어요",
    description: "소식은 날아서 와요. 같이 기다려 보세요.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
    locale: "ko_KR",
    type: "website",
  },
};

export default function LetterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
