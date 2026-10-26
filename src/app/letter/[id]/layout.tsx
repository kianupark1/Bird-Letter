import type { Metadata } from "next";
import { previewText } from "../../../../core/letterPreview";
import { readLetterMeta } from "@/lib/serverLetter";

// 링크를 붙였을 때 보이는 미리보기 카드. 보낸 사람 이름·새·노선만 보여 주고(아는 사람이라 믿고 누르게),
// 편지 내용은 도착 전까지 보낸 사람만 알아야 하므로 넣지 않는다. 못 읽으면 기본 문구.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { title, description } = previewText(await readLetterMeta(id), Date.now());
  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: "/og.png", width: 1200, height: 630 }], locale: "ko_KR", type: "website" },
  };
}

export default function LetterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
