"""수능 '특별한 날엔, 특별한 메신저로' 넘겨 보기 카드(c11)를 릴스 영상으로: python3 promo/build-reel-c11.py
카드마다 천천히 다가가는 움직임 + 장면 사이 부드럽게 넘김, 음악은 saepyeonji-15s.mp4 그대로.
결과: promo/video/reel-c11-suneung.mp4 (+ -cover.png, 4:5 사본 promo/video/card/)"""
import subprocess, os
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cards = [f"{R}/promo/cards/c11-suneung-{i}.png" for i in range(1, 9)]
D = [2.6, 2.3, 2.4, 2.4, 2.8, 2.8, 2.8, 3.4]  # 길 잃음·감나무는 조금 더 길게
X, FPS = 0.4, 30
args = []
for c, d in zip(cards, D):
    args += ["-loop", "1", "-t", str(d), "-i", c]
args += ["-stream_loop", "-1", "-i", f"{R}/promo/video/saepyeonji-15s.mp4"]
f = []
for i, d in enumerate(D):
    n = int(d * FPS)
    wob = "+8*sin(on/6)" if i in (4, 5) else ""  # 길 잃은·나무에 걸린 장면은 살짝 흔들흔들
    f.append(f"[{i}:v]scale=2160:-1,zoompan=z='1+0.06*on/{n}':x='iw/2-(iw/zoom/2){wob}':y='ih/2-(ih/zoom/2)':d={n}:s=1080x1350:fps={FPS},"
             f"pad=1080:1920:0:285:color=0xFBF3E4,setsar=1,format=yuv420p[v{i}]")
prev, t = "v0", D[0]
for i in range(1, len(D)):
    off = t - X
    f.append(f"[{prev}][v{i}]xfade=transition=slideleft:duration={X}:offset={off:.2f}[x{i}]")
    prev, t = f"x{i}", t + D[i] - X
T = round(t, 2)
f.append(f"[{len(D)}:a]atrim=0:{T},afade=t=out:st={T-1.5}:d=1.5[a]")
out = f"{R}/promo/video/reel-c11-suneung.mp4"
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *args, "-filter_complex", ";".join(f), "-map", f"[{prev}]", "-map", "[a]",
                "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "-t", str(T), out], check=True)
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-ss", "1.2", "-i", out, "-frames:v", "1", out.replace(".mp4", "-cover.png")], check=True)
os.makedirs(f"{R}/promo/video/card", exist_ok=True)
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", out, "-vf", "crop=1080:1350:0:285", "-c:v", "libx264", "-crf", "21", "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", f"{R}/promo/video/card/reel-c11-suneung.mp4"], check=True)
print("reel", T, out)
