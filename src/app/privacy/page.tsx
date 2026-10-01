import Link from "next/link";

export const metadata = { title: "개인정보 처리방침 · 새 편지" };

// 초안입니다. 정식 출시(서버 연결·계정 도입) 전에 서비스 운영자 정보를 채우고 전문가 검토를 받으세요.
export default function Privacy() {
  return (
    <main className="app">
      <h1>개인정보 처리방침</h1>
      <p className="sub">체험판 기준 · 초안</p>

      <h2>1. 지금 수집하는 정보</h2>
      <div className="paper" style={{ marginTop: 0 }}>
        {"체험판은 이름, 연락처, 위치 같은 개인정보를 서버로 보내지 않아요.\n설정에서 정한 닉네임, 알림 설정, 작성한 편지는 이 기기의 브라우저 저장소에만 저장돼요."}
      </div>

      <h2>2. 저장된 정보 지우기</h2>
      <div className="paper" style={{ marginTop: 0 }}>
        {"설정의 ‘보낸 편지 모두 지우기’로 편지를 지울 수 있어요.\n브라우저의 사이트 데이터를 삭제하면 닉네임과 설정까지 모두 지워져요."}
      </div>

      <h2>3. 정식 출시 후 달라지는 점</h2>
      <div className="paper" style={{ marginTop: 0 }}>
        {"편지를 다른 사람에게 보내려면 서버가 필요해요. 그때는 받는 사람 이름, 편지 내용, 알림 토큰 등을 서버에 저장하게 되고, 수집 항목과 보관 기간, 이용 목적을 이 문서에 먼저 알려요."}
      </div>

      <h2>4. 문의</h2>
      <div className="paper" style={{ marginTop: 0 }}>
        {"서비스 운영자 정보와 문의 연락처는 정식 출시 전에 채워 넣을 예정이에요."}
      </div>

      <Link href="/settings" className="ghost">설정으로 돌아가기</Link>
    </main>
  );
}
