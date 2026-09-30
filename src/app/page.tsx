import BirdPicker from "@/components/BirdPicker";

export default function Home() {
  return (
    <main className="app">
      <h1>새 편지</h1>
      <p className="sub">새를 골라 편지를 보내요. 실제 거리만큼 날아가요.</p>
      <BirdPicker />
    </main>
  );
}
