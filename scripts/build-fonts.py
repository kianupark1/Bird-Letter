"""
설정에서 고르는 글씨체 2종 만들기 (2026-11-12, 대표님: "알아보기 쉬운 필기체와 새편지만의 폰트")
  python3.13 scripts/build-fonts.py <Gaegu-Bold.ttf> <Jua-Regular.ttf>
원본: Google Fonts ofl/gaegu/Gaegu-Bold.ttf, ofl/jua/Jua-Regular.ttf (둘 다 SIL OFL 1.1, Reserved Font Name 없음 → 고쳐서 새 이름으로 배포 가능)
- 손글씨체: 개구(굵게) — 손글씨 중 글자 모양이 또렷해 알아보기 쉬움. 글자 사이가 넓어 보여서 20% 좁힘
- 새편지체: 주아(둥글고 도톰함)를 바탕으로 글자 사이를 조금 넓히고(+4%) 이름을 '새편지체(SaePyeonji)'로 바꿈
글자는 scripts/font-chars.txt(자주 쓰는 한글 2,350자·영문·숫자·기호)만 담아 가볍게 → public/fonts/*.woff2
드문 글자는 CSS가 Pretendard로 이어서 보여 줌.
"""
import sys
from fontTools import subset
from fontTools.ttLib import TTFont

hand_src, jua_src = sys.argv[1], sys.argv[2]
chars = open("scripts/font-chars.txt", encoding="utf-8").read()
chars += "".join(chr(c) for c in range(0x20, 0x7F)) + "…·‘’“”~!?♡♥"

def build(src, out, family=None, widen=1.0):
    f = TTFont(src)
    if widen != 1.0:
        hmtx = f["hmtx"]
        for g, (adv, lsb) in list(hmtx.metrics.items()):
            extra = round(adv * (widen - 1))
            hmtx.metrics[g] = (adv + extra, lsb + extra // 2)
            # 글자 자체도 가운데로 옮김
        glyf = f["glyf"] if "glyf" in f else None
        if glyf is not None:
            for g, (adv, lsb) in hmtx.metrics.items():
                gl = glyf[g]
                if gl.numberOfContours != 0:
                    shift = round(adv / widen * (widen - 1)) // 2
                    gl.coordinates.translate((shift, 0)) if gl.numberOfContours > 0 else None
                    if gl.numberOfContours > 0:
                        gl.recalcBounds(glyf)
    if family:
        name = f["name"]
        for rec in name.names:
            if rec.nameID in (1, 16):
                rec.string = family
            elif rec.nameID == 4:
                rec.string = family
            elif rec.nameID == 6:
                rec.string = family.replace(" ", "") + "-Regular"
            elif rec.nameID == 3:
                rec.string = family.replace(" ", "") + "-1.0"
            elif rec.nameID == 0:
                rec.string = str(rec) + " Modified 2026 by BRUNOSONO (SaePyeonji)."
    opts = subset.Options()
    opts.flavor = "woff2"
    opts.layout_features = ["*"]
    opts.name_IDs = ["*"]
    opts.name_languages = ["*"]
    s = subset.Subsetter(opts)
    s.populate(text=chars)
    s.subset(f)
    f.flavor = "woff2"
    f.save(out)
    print(out)

build(hand_src, "public/fonts/SaePyeonjiHand.woff2", family="SaePyeonji Hand", widen=0.8)
build(jua_src, "public/fonts/SaePyeonji.woff2", family="SaePyeonji", widen=1.04)
