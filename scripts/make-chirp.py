"""짹짹 알림 소리 만들기(앱을 닫았을 때 오는 알림 소리, 2026-11-12 대표님: "짹짹 소리가 나야 해, 진동과 함께").
assets/sounds/chirp.wav (16bit 모노 44.1kHz, 약 1초). 실행: python3 scripts/make-chirp.py
새 울음 = 빠르게 올라갔다 내려가는 높은 음 세 번 + 마지막 긴 짹."""
import math, struct, wave

RATE = 44100
out = []

def chirp(f0, f1, dur, vol=0.6, warble=0.0):
    n = int(RATE * dur)
    phase = 0.0
    for i in range(n):
        t = i / n
        # 위로 휘었다 내려오는 음 높이
        f = f0 + (f1 - f0) * math.sin(math.pi * t) + warble * math.sin(2 * math.pi * 38 * i / RATE)
        phase += 2 * math.pi * f / RATE
        env = math.sin(math.pi * t) ** 0.6  # 부드럽게 시작·끝
        s = math.sin(phase) * 0.8 + 0.2 * math.sin(2 * phase)  # 살짝 맑은 배음
        out.append(s * env * vol)

def rest(dur):
    out.extend([0.0] * int(RATE * dur))

rest(0.02)
for k in range(3):
    chirp(2600 + k * 150, 4200 + k * 150, 0.075)
    rest(0.045)
rest(0.08)
chirp(2900, 4600, 0.16, vol=0.7, warble=120)
rest(0.05)
chirp(3300, 4000, 0.09, vol=0.55)
rest(0.06)

with wave.open("assets/sounds/chirp.wav", "wb") as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE)
    w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, s)) * 30000)) for s in out))
print(f"chirp.wav {len(out)/RATE:.2f}s")
