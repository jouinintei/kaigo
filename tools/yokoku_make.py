# 予告（作成中）用のファイルを作る。
#   python3 tools/yokoku_make.py 2026-11-26 本物の画像...（A4に整えたもの。名前はサイトでのファイル名）
#  ・images/<名前> に「作成中」のたすき入りの画像を書く（サイトに出るのはこちら）
#  ・yokoku/<名前>.enc に本物を暗号化して書く（公開日に自動で images/ に戻る）
#  data.js には pre: 1, open: "YYYY-MM-DD" を付けて登録する。
import os
import sys

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT = "/usr/share/fonts/opentype/noto/NotoSansCJK-Black.ttc"


def sash(im, label):
    """右上から左下へ、たすきがけの帯を入れる"""
    im = im.convert("RGB")
    w, h = im.size
    d = max(w, h)
    band = int(min(w, h) * 0.13)
    L = int((w * w + h * h) ** 0.5) + band * 2
    layer = Image.new("RGBA", (L, band), (192, 57, 43, 225))
    dr = ImageDraw.Draw(layer)
    dr.rectangle([0, 0, L, int(band * 0.06)], fill=(255, 255, 255, 230))
    dr.rectangle([0, band - int(band * 0.06), L, band], fill=(255, 255, 255, 230))
    f = ImageFont.truetype(FONT, int(band * 0.46))
    unit = "作成中　" + label + "　　"
    tw = dr.textlength(unit, font=f)
    x = -tw / 2
    while x < L:
        dr.text((x, band / 2), unit, font=f, fill=(255, 255, 255, 255), anchor="lm")
        x += tw
    import math
    ang = math.degrees(math.atan2(h, w))
    rot = layer.rotate(ang, expand=True, resample=Image.BICUBIC)
    out = im.convert("RGBA")
    out.alpha_composite(rot, ((w - rot.width) // 2, (h - rot.height) // 2))
    return out.convert("RGB")


def encrypt(data):
    pub = serialization.load_pem_public_key(open(os.path.join(ROOT, "yokoku/pub.pem"), "rb").read())
    key = AESGCM.generate_key(bit_length=256)
    wrapped = pub.encrypt(key, padding.OAEP(mgf=padding.MGF1(hashes.SHA256()), algorithm=hashes.SHA256(), label=None))
    nonce = os.urandom(12)
    return b"RKY1" + len(wrapped).to_bytes(2, "big") + wrapped + nonce + AESGCM(key).encrypt(nonce, data, None)


if __name__ == "__main__":
    day = sys.argv[1]
    y, m, dd = day.split("-")
    label = f"{int(m)}月{int(dd)}日公開予定"
    for p in sys.argv[2:]:
        name = os.path.basename(p)
        raw = open(p, "rb").read()
        open(os.path.join(ROOT, "yokoku", name + ".enc"), "wb").write(encrypt(raw))
        im = Image.open(p)
        out = sash(im, label)
        dst = os.path.join(ROOT, "images", name)
        if name.lower().endswith(".png"):
            out.save(dst, optimize=True)
        else:
            out.save(dst, quality=88)
        print("ok", name)
