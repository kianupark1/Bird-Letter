import sys, math, os, subprocess, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H, FPS = 1080, 1920, 30
ORANGE = (211, 95, 60)
CREAM = (248, 241, 230)
DARK = (26, 20, 18)
INK = (30, 26, 23)
GREY = (150, 140, 132)
WHITE = (255, 255, 255)

FB = "/usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc"
FBO = "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc"
FM = "/usr/share/fonts/opentype/noto/NotoSansCJK-Medium.ttc"
EMO = "/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf"
_fc = {}
def font(path, size):
    k = (path, size)
    if k not in _fc:
        _fc[k] = ImageFont.truetype(path, size, index=1)
    return _fc[k]

# ---------- easing ----------
def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))
def eo(x): x = clamp(x); return 1 - (1 - x) ** 3
def eio(x): x = clamp(x); return 4*x*x*x if x < .5 else 1 - (-2*x+2)**3/2
def eback(x):
    x = clamp(x); c1 = 1.70158; c3 = c1 + 1
    return 1 + c3*(x-1)**3 + c1*(x-1)**2
def prog(t, s, d): return clamp((t - s) / d)

# ---------- sprites ----------
_sc = {}
def text_sprite(txt, size, color, path=FB, track=-0.03):
    k = ("t", txt, size, color, path)
    if k in _sc: return _sc[k]
    f = font(path, size)
    # manual tracking (tight, like the cards)
    widths = [f.getlength(c) for c in txt]
    tr = size * track
    tw = int(sum(widths) + tr * (len(txt) - 1)) + 10
    asc, desc = f.getmetrics()
    im = Image.new("RGBA", (max(tw, 1), asc + desc + 10), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    x = 0
    for c, w in zip(txt, widths):
        d.text((x, 0), c, font=f, fill=color)
        x += w + tr
    _sc[k] = im
    return im

def emoji_sprite(ch, size):
    k = ("e", ch, size)
    if k in _sc: return _sc[k]
    f = ImageFont.truetype(EMO, 109)
    im = Image.new("RGBA", (160, 160), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((10, 10), ch, font=f, embedded_color=True)
    im = im.crop(im.getbbox()).resize((size, size), Image.LANCZOS)
    _sc[k] = im
    return im

def bird_sprite():
    if "bird" in _sc: return _sc["bird"]
    im = Image.open("" + os.path.join(os.path.dirname(os.path.abspath(__file__)), "video/reel-maker-bird.png") + "").convert("RGB")
    a = np.asarray(im).astype(float)
    bg = np.array([209, 91, 56.])
    dist = np.sqrt(((a - bg) ** 2).sum(-1))
    alpha = np.clip((dist - 14) / 26, 0, 1)
    alpha[:, 325:] = 0
    rgba = np.dstack([a, alpha * 255]).astype(np.uint8)
    b = Image.fromarray(rgba, "RGBA")
    b = b.crop(b.getbbox())
    b = b.resize((b.width * 2, b.height * 2), Image.LANCZOS)
    _sc["bird"] = b
    return b

def paste(canvas, spr, x, y, scale=1.0, alpha=1.0, anchor="lt", rot=0.0):
    if alpha <= 0.003 or scale <= 0.01: return
    s = spr
    if scale != 1.0:
        s = s.resize((max(1, int(s.width * scale)), max(1, int(s.height * scale))), Image.BILINEAR)
    if rot:
        s = s.rotate(rot, resample=Image.BICUBIC, expand=True)
    if alpha < 1:
        s = s.copy(); s.putalpha(s.getchannel("A").point(lambda v: int(v * alpha)))
    if anchor == "c": x, y = x - s.width / 2, y - s.height / 2
    elif anchor == "lc": y = y - s.height / 2
    elif anchor == "ct": x = x - s.width / 2
    canvas.alpha_composite(s, (int(round(x)), int(round(y))))

def card_sprite(w, h, r=30, fill=WHITE, shadow=True):
    k = ("card", w, h, r, fill, shadow)
    if k in _sc: return _sc[k]
    pad = 40
    im = Image.new("RGBA", (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
    if shadow:
        sh = Image.new("RGBA", im.size, (0, 0, 0, 0))
        ImageDraw.Draw(sh).rounded_rectangle((pad, pad + 10, pad + w, pad + h + 10), r, fill=(80, 40, 20, 40))
        im = sh.filter(ImageFilter.GaussianBlur(14))
    ImageDraw.Draw(im).rounded_rectangle((pad, pad, pad + w, pad + h), r, fill=fill)
    _sc[k] = im
    return im

def logo(canvas, x, y, light=False):
    b = bird_sprite()
    paste(canvas, b, x, y, scale=56 / b.width)
    paste(canvas, text_sprite("새 편지", 34, WHITE if light else INK, FBO, 0), x + 68, y - 4)

def lines_in(canvas, lines, x, y0, t, start, lh, gap=0.12, anchor="lt"):
    """lines: list of (text, size, color). slide up + fade."""
    y = y0
    for i, (txt, size, color) in enumerate(lines):
        p = eo(prog(t, start + i * gap, 0.45))
        spr = text_sprite(txt, size, color)
        paste(canvas, spr, x, y + (1 - p) * 60, alpha=p, anchor=anchor)
        y += lh if isinstance(lh, (int, float)) else lh[i]

# ---------- scenes ----------
def scene_hook(t):
    c = Image.new("RGBA", (W, H), ORANGE + (255,))
    lines_in(c, [("카톡보다 느린", 128, WHITE), ("메신저를", 128, WHITE), ("만들었어요.", 128, WHITE)], 90, 330, t, 0.1, 158, 0.14)
    p = eo(prog(t, 1.15, 0.4))
    paste(c, text_sprite("네, 일부러요.", 60, WHITE, FBO, -0.02), 92, 840 + (1 - p) * 30, alpha=p)
    paste(c, emoji_sprite("🐤", 62), 100 + text_sprite("네, 일부러요.", 60, WHITE, FBO, -0.02).width, 848 + (1 - p) * 30, alpha=p)
    # bird flies in slowly from the left and hovers
    b = bird_sprite()
    px = eo(prog(t, 0.3, 2.6))
    x = -500 + px * 1020
    y = 1200 + math.sin(t * 6) * 18
    paste(c, b, x, y, scale=560 / b.width, rot=math.sin(t * 6 + 1) * 4, anchor="c")
    logo(c, 90, 1560, light=True)
    return c

RACE = [("카톡", "0.1초", 0.80, 0.05), ("KTX", "약 2시간 30분", 0.80, 1.3), ("참새 편지", "11시간 36분", 0.80, None)]
def scene_race(t):
    c = Image.new("RGBA", (W, H), DARK + (255,))
    d = ImageDraw.Draw(c)
    p0 = eo(prog(t, 0, 0.4))
    paste(c, text_sprite("서울 → 부산, 편지 배달 대결", 44, (200, 190, 182), FBO, -0.01), 90, 250 + (1 - p0) * 20, alpha=p0)
    go = prog(t, 0.45, 0.35)
    if 0.45 < t < 1.1:
        paste(c, text_sprite("출발!", 90, ORANGE), W / 2, 330, scale=0.6 + 0.4 * eback(go * 1.4), alpha=1 - prog(t, 0.9, 0.2), anchor="ct")
    y = 470
    for i, (name, label, start, dur) in enumerate(RACE):
        is_bird = i == 2
        col = ORANGE if is_bird else WHITE
        paste(c, text_sprite(name, 50, col, FBO, -0.01), 90, y)
        if is_bird: paste(c, emoji_sprite("🐤", 48), 90 + text_sprite(name, 50, col, FBO).width + 4, y + 10)
        by = y + 100
        d.rounded_rectangle((90, by, 990, by + 22), 11, fill=(58, 48, 44))
        if is_bird:
            fill = 0.22 * eio(prog(t, 0.8, 4.2))
        else:
            fill = eo(prog(t, start, dur))
        if fill > 0.01:
            d.rounded_rectangle((90, by, 90 + int(900 * fill), by + 22), 11, fill=col)
        done = fill >= 0.999 and not is_bird
        if done:
            pl = eback(prog(t, start + dur, 0.35))
            spr = text_sprite(label, 54, WHITE, FB, -0.02)
            paste(c, spr, 990 - spr.width, y - 4 + (1 - pl) * 20, alpha=clamp(pl))
        if is_bird:
            b = bird_sprite()
            bx = 90 + 900 * fill
            paste(c, b, bx, by + 8 + math.sin(t * 9) * 6, scale=150 / b.width, anchor="c")
            pl = eo(prog(t, 2.4, 0.4))
            spr = text_sprite(label, 54, ORANGE, FB, -0.02)
            paste(c, spr, 990 - spr.width, y - 4 + (1 - pl) * 20, alpha=pl)
            # "still near Suwon" joke
            pj = eo(prog(t, 3.0, 0.4))
            paste(c, text_sprite("…아직 수원 지나는 중", 36, GREY, FM, -0.01), 90 + 900 * fill + 40, by + 50 + (1 - pj) * 10, alpha=pj)
        y += 230
    lines_in(c, [("기차보다", 120, WHITE), ("4배 넘게 느려요.", 120, ORANGE)], 90, 1170, t, 3.2, 150, 0.15)
    logo(c, 90, 1560, light=True)
    return c

# journey timeline: (kind, duration, target_p or event idx)
EVENTS = [
    ("🌇", "노을이 예뻐서 잠깐 구경했어요", 0.22),
    ("🌦️", "소나기! 처마 밑에서 쉬었다 가요", 0.44),
    ("🌰", "도토리를 하나 주웠어요", 0.64),
    ("🌲", "나무에 걸려서 잠깐 쉬는 중이에요", 0.84),
]
SEG = [("fly", 1.0, 0.22), ("ev", 1.55, 0), ("fly", 0.8, 0.44), ("ev", 1.55, 1), ("fly", 0.8, 0.64), ("ev", 1.35, 2),
       ("fly", 0.8, 0.84), ("ev", 1.35, 3), ("fly", 0.6, 1.0)]
J_TOTAL = sum(s[1] for s in SEG)  # 9.8
J_LEN = J_TOTAL + 0.9

def journey_state(t):
    acc, p = 0.0, 0.0
    for kind, dur, arg in SEG:
        if t < acc + dur:
            lt = (t - acc) / dur
            if kind == "fly":
                return p + (arg - p) * eio(lt), None, lt
            return p, arg, lt
        acc += dur
        if kind == "fly": p = arg
    return 1.0, "arrived", t - J_TOTAL

def route_pt(p):
    # S-curve from Seoul (upper left) to Busan (lower right)
    x0, y0, x1, y1 = 200, 600, 880, 1230
    x = x0 + (x1 - x0) * p + math.sin(p * math.pi * 2) * 150
    y = y0 + (y1 - y0) * p
    return x, y

def scene_journey(t):
    p, ev, lt = journey_state(t)
    bg = np.array(CREAM, float)
    c = Image.new("RGBA", (W, H), CREAM + (255,))
    # sunset tint during event 0
    if ev == 0:
        k = math.sin(clamp(lt) * math.pi)
        ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        od = ImageDraw.Draw(ov)
        for yy in range(0, H, 8):
            f = yy / H
            col = (int(255 - 20 * f), int(170 + 40 * f), int(120 + 60 * f), int(120 * k))
            od.rectangle((0, yy, W, yy + 8), fill=col)
        c.alpha_composite(ov)
    d = ImageDraw.Draw(c)
    # header + clock (keeps running during stops)
    paste(c, text_sprite("서울 → 부산", 44, GREY, FBO, -0.01), 90, 190)
    mins = clamp(t / J_TOTAL) * (11 * 60 + 36)
    clock = f"{int(mins // 60):02d}:{int(mins % 60):02d}"
    paste(c, text_sprite(clock, 150, ORANGE, FB, -0.01), 84, 245)
    paste(c, text_sprite("경과", 40, GREY, FBO, 0), 90 + text_sprite(clock, 150, ORANGE, FB, -0.01).width + 10, 340)
    # route: dashed
    pts = [route_pt(i / 200) for i in range(201)]
    for i in range(0, 200, 4):
        d.line([pts[i], pts[i + 2]], fill=(214, 196, 178), width=10)
    # flown part solid orange
    n = int(p * 200)
    if n > 1: d.line(pts[:n + 1], fill=ORANGE, width=10, joint="curve")
    for (lp, name) in [(0, "서울"), (1, "부산")]:
        x, y = route_pt(lp)
        d.ellipse((x - 18, y - 18, x + 18, y + 18), fill=INK)
        spr = text_sprite(name, 46, INK, FBO, -0.01)
        paste(c, spr, x - spr.width / 2, y + 26)
    bx, by = route_pt(p)
    b = bird_sprite()
    flying = ev is None
    bob = math.sin(t * (9 if flying else 4)) * (10 if flying else 4)
    rot = math.sin(t * 9) * 3 if flying else 0
    # event props
    if ev == 1:  # rain
        rng = random.Random(int(t * 30))
        for _ in range(70):
            rx, ry = rng.uniform(bx - 300, bx + 300), rng.uniform(by - 320, by + 120)
            d.line((rx, ry, rx - 14, ry + 40), fill=(120, 140, 165), width=4)
        paste(c, emoji_sprite("🌧️", 110), bx, by - 230, anchor="c")
    if ev == 3:  # stuck in tree
        paste(c, emoji_sprite("🌲", 260), bx + 10, by + 10, anchor="c")
        rot = math.sin(t * 22) * 7
    paste(c, b, bx, by - 30 + bob, scale=200 / b.width, rot=rot, anchor="c")
    if ev == 2:  # acorn pops above
        pa = eback(prog(lt, 0.1, 0.25))
        paste(c, emoji_sprite("🌰", 90), bx, by - 150 - 20 * pa, scale=0.3 + 0.7 * pa, anchor="c")
    if ev == 0:
        paste(c, emoji_sprite("🌇", 90), bx + 140, by - 150, alpha=math.sin(clamp(lt) * math.pi), anchor="c")
    # event card
    if isinstance(ev, int):
        emo, txt, _ = EVENTS[ev]
        a = eo(lt * 4) * (1 - prog(lt, 0.86, 0.14))
        cy = 1395 + (1 - eo(lt * 4)) * 40
        cs = card_sprite(900, 130, 30)
        paste(c, cs, W / 2 - cs.width / 2, cy - cs.height / 2, alpha=a)
        paste(c, emoji_sprite(emo, 64), 140, cy - 32, alpha=a)
        paste(c, text_sprite(txt, 44, INK, FBO, -0.02), 230, cy - 34, alpha=a)
    if ev == "arrived":
        pa = eback(prog(lt, 0, 0.35))
        cs = card_sprite(900, 130, 30, ORANGE)
        paste(c, cs, W / 2, 1395, scale=0.6 + 0.4 * pa, alpha=clamp(pa), anchor="c")
        spr = text_sprite("그래도 편지는 꼭 도착해요", 46, WHITE, FB, -0.02)
        paste(c, spr, W / 2 - 40, 1395, scale=0.6 + 0.4 * pa, alpha=clamp(pa), anchor="c")
        paste(c, emoji_sprite("💌", 60), W / 2 + spr.width / 2 + 10 * pa, 1395, scale=0.6 + 0.4 * pa, alpha=clamp(pa), anchor="c")
    logo(c, 90, 1560)
    return c

def scene_receiver(t):
    c = Image.new("RGBA", (W, H), CREAM + (255,))
    lines_in(c, [("받는 사람은", 112, INK), ("도착 전엔", 112, INK), ("못 열어요.", 112, ORANGE)], 90, 160, t, 0.0, 138, 0.12)
    # phone
    pp = eo(prog(t, 0.3, 0.5))
    oy = (1 - pp) * 200
    ph = Image.new("RGBA", (640, 820), (0, 0, 0, 0))
    pd = ImageDraw.Draw(ph)
    pd.rounded_rectangle((0, 0, 640, 820), 80, fill=INK)
    pd.rounded_rectangle((22, 22, 618, 820), 62, fill=(253, 250, 245))
    pd.rounded_rectangle((250, 44, 390, 78), 17, fill=INK)
    paste(ph, text_sprite("엄마에게서 오는 편지", 34, GREY, FBO, -0.01), 320, 120, anchor="ct")
    remain = max(0, 5 - int(prog(t, 0.9, 2.2) * 5 + 0.0001))
    arrived = t >= 3.15
    if not arrived:
        cd = f"00:00:0{remain}"
        paste(ph, text_sprite(cd, 96, ORANGE, FB, -0.01), 320, 175, anchor="ct")
        env_s = 1.0 + (0.04 * math.sin(t * 30) if t > 2.4 else 0)
        paste(ph, emoji_sprite("✉️", 210), 320, 500, scale=env_s, anchor="c")
        paste(ph, emoji_sprite("🔒", 80), 410, 590, anchor="c")
        paste(ph, text_sprite("도착하면 열 수 있어요", 34, GREY, FBO, -0.01), 320, 690, anchor="ct")
    else:
        pa = eback(prog(t, 3.15, 0.4))
        paste(ph, text_sprite("도착!", 96, ORANGE, FB, -0.02), 320, 175, scale=0.6 + 0.4 * pa, alpha=clamp(pa), anchor="ct")
        paste(ph, emoji_sprite("💌", 230), 320, 500, scale=0.5 + 0.5 * pa, anchor="c")
        rng = random.Random(3)
        for i in range(26):
            ang = rng.uniform(0, 2 * math.pi); sp = rng.uniform(150, 280)
            k = eo(prog(t, 3.15, 0.7))
            x, y = 320 + math.cos(ang) * sp * k, 500 + math.sin(ang) * sp * k
            col = [ORANGE, (240, 190, 70), (230, 120, 140)][i % 3]
            ImageDraw.Draw(ph).ellipse((x - 9, y - 9, x + 9, y + 9), fill=col + (int(255 * (1 - prog(t, 3.5, 0.6))),))
        paste(ph, text_sprite("탭해서 열어보기", 34, INK, FBO, -0.01), 320, 690, alpha=clamp(pa), anchor="ct")
    paste(c, ph, W / 2 - 320, 730 + oy, alpha=pp)
    p2 = eo(prog(t, 0.6, 0.4))
    s = text_sprite("그래서 둘 다 지도만 봐요", 46, INK, FBO, -0.02)
    paste(c, s, 92, 600 + (1 - p2) * 15, alpha=p2)
    paste(c, emoji_sprite("🫣", 50), 100 + s.width, 603 + (1 - p2) * 15, alpha=p2)
    return c

def scene_cta(t):
    c = Image.new("RGBA", (W, H), ORANGE + (255,))
    lines_in(c, [("기다림도", 112, WHITE), ("소통의 일부입니다.", 112, WHITE)], W / 2, 350, t, 0.0, 145, 0.15, anchor="ct")
    b = bird_sprite()
    pb = eo(prog(t, 0.2, 0.8))
    paste(c, b, W / 2 + (1 - pb) * -600, 920 + math.sin(t * 6) * 16, scale=500 / b.width, rot=math.sin(t * 6 + 1) * 4, anchor="c")
    pp = eback(prog(t, 0.9, 0.4))
    cs = card_sprite(820, 120, 60, WHITE, shadow=False)
    paste(c, cs, W / 2, 1255, scale=0.7 + 0.3 * pp, alpha=clamp(pp), anchor="c")
    paste(c, text_sprite("앱스토어에서 ‘새편지’ 검색", 50, INK, FB, -0.02), W / 2, 1255, scale=0.7 + 0.3 * pp, alpha=clamp(pp), anchor="c")
    pq = eo(prog(t, 1.4, 0.4))
    s = text_sprite("제일 먼저 누구한테 보낼래요? 댓글로", 42, WHITE, FBO, -0.02)
    paste(c, s, W / 2 - 30, 1385 + (1 - pq) * 15, alpha=pq, anchor="ct")
    paste(c, emoji_sprite("👇", 46), W / 2 + s.width / 2 - 20, 1388 + (1 - pq) * 15, alpha=pq)
    pa = eo(prog(t, 1.8, 0.4))
    s2 = text_sprite("안드로이드는 지금 웹으로 · bird-letter.vercel.app", 34, (255, 226, 214), FBO, -0.01)
    paste(c, s2, W / 2, 1470 + (1 - pa) * 12, alpha=pa, anchor="ct")
    logo(c, 90, 1560, light=True)
    return c

SCENES = [("s1", scene_hook, 3.4), ("s2", scene_race, 5.2), ("s3", scene_journey, J_LEN), ("s4", scene_receiver, 4.6), ("s5", scene_cta, 4.2)]

def render(name, fn, dur, out):
    n = int(round(dur * FPS))
    tmp = out + ".part.mp4"
    proc = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                             "-c:v", "libx264", "-crf", "18", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-r", str(FPS), tmp], stdin=subprocess.PIPE)
    for i in range(n):
        im = fn(i / FPS).convert("RGB")
        proc.stdin.write(im.tobytes())
    proc.stdin.close()
    if proc.wait() == 0: os.replace(tmp, out)

if __name__ == "__main__":
    mode = sys.argv[1]
    if mode == "stills":
        for name, fn, t in [("s1", scene_hook, 2.5), ("s2", scene_race, 4.5), ("s3a", scene_journey, 1.8), ("s3b", scene_journey, 4.0),
                            ("s3c", scene_journey, 9.5), ("s3d", scene_journey, 8.4), ("s4", scene_receiver, 2.0), ("s4b", scene_receiver, 3.6), ("s5", scene_cta, 3.0)]:
            fn(t).convert("RGB").save(f"/home/claude/work/still_{name}.jpg", quality=85)
    else:
        name = mode
        for n, fn, dur in SCENES:
            if n == name: render(n, fn, dur, f"/home/claude/work/{n}.mp4")
