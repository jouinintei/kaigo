import numpy as np
from PIL import Image, ImageDraw

CFG = dict(inset=0.012, line=14, radius=28, pad=0.012, logoH=0.02, logoRight=0.03,
           ownCover=0.85, maxCut=0.02, maxStretch=0.05)
A4L, A4P = (3508, 2480), (2480, 3508)
LOGO = Image.open("logo.png").convert("RGBA")


def to_gray(im):
    rgba = im.convert("RGBA")
    bg = Image.new("RGBA", rgba.size, (255, 255, 255, 255))
    bg.alpha_composite(rgba)
    return bg.convert("L")


def small_dark(g):
    w, h = g.size
    s = min(1, 1800 / max(w, h))
    aw, ah = max(1, round(w * s)), max(1, round(h * s))
    return np.array(g.resize((aw, ah), Image.BILINEAR)) < 200, s


def bbox(dark):
    if not dark.any():
        return None
    ys = np.where(dark.any(1))[0]
    xs = np.where(dark.any(0))[0]
    return xs[0], xs[-1], ys[0], ys[-1]


def try_strip(g):
    """元の枠線を見つけたら、その内側の範囲(元画像の座標)を返す。無ければ None"""
    dark, s = small_dark(g)
    b = bbox(dark)
    if not b:
        return None
    x0, x1, y0, y1 = b
    sub = dark[y0:y1 + 1, x0:x1 + 1]
    ah, aw = sub.shape
    band = max(2, round(min(dark.shape) * 0.015))
    cover = min(sub[:band].any(0).mean(), sub[-band:].any(0).mean(),
                sub[:, :band].any(1).mean(), sub[:, -band:].any(1).mean())
    if cover < CFG["ownCover"]:
        return None
    lim = round(min(aw, ah) * 0.08)
    rowf = sub.mean(1)
    colf = sub.mean(0)

    def strip(arr, rev):
        a = arr[::-1] if rev else arr
        seen, last = False, 0
        for k in range(min(lim, len(a))):
            if a[k] >= 0.6:
                seen, last = True, k
            elif seen and k - last > 2:
                break
        return last + 2 if seen else 0

    t0, t1 = strip(rowf, False), strip(rowf, True)
    l0, l1 = strip(colf, False), strip(colf, True)
    if not (t0 and t1 and l0 and l1):
        return None
    inner = sub[t0:ah - t1, l0:aw - l1]
    if inner.size == 0:
        return None
    ih, iw = inner.shape
    mx, my = max(3, round(iw * 0.04)), max(3, round(ih * 0.04))
    if (inner[:, mx:iw - mx].mean(0) >= 0.9).any():
        return None
    return ((x0 + l0) / s, (y0 + t0) / s, (x1 + 1 - l1) / s, (y1 + 1 - t1) / s)


def frame(im):
    g = to_gray(im)
    w, h = g.size
    W, H = A4L if w >= h else A4P
    meta = dict(orig=(w, h), stripped=0)
    for _ in range(3):
        ib = try_strip(g)
        if not ib:
            break
        g = g.crop((round(ib[0]), round(ib[1]), round(ib[2]), round(ib[3])))
        meta["stripped"] += 1
    w, h = g.size
    dark, s = small_dark(g)
    b = bbox(dark)
    L = CFG["line"]
    m = round(min(W, H) * CFG["inset"])
    lh = round(min(W, H) * CFG["logoH"])
    lgap = round(lh * 0.3)
    fx, fy = m, m
    fw = W - 2 * m
    fh = H - 2 * m - lh - lgap
    ix, iy, iw, ih = fx + L, fy + L, fw - 2 * L, fh - 2 * L
    out = Image.new("L", (W, H), 255)
    aw_, ah_ = dark.shape[1], dark.shape[0]
    if b:
        x0, x1, y0, y1 = b
        tol = 0.01
        edge = sum([x0 <= aw_ * tol, y0 <= ah_ * tol, aw_ - 1 - x1 <= aw_ * tol, ah_ - 1 - y1 <= ah_ * tol]) >= 2
    else:
        edge = True
    if edge:
        sc = max(iw / w, ih / h)
        cut = max(1 - iw / (w * sc), 1 - ih / (h * sc))
        stretch = abs((iw / ih) / (w / h) - 1)
        if stretch <= CFG["maxStretch"]:
            meta["mode"] = "edge-stretch"
            meta["cut"] = 0
            out.paste(g.resize((iw, ih), Image.LANCZOS), (ix, iy))
            meta["fill"] = 1
            sc = iw / w
        elif cut > CFG["maxCut"]:
            sc = min(iw / w, ih / h)
            meta["mode"] = "edge-contain"
        else:
            meta["mode"] = "edge-cover"
        if meta["mode"] != "edge-stretch":
            meta["cut"] = max(0, max(1 - iw / (w * sc), 1 - ih / (h * sc)))
            ew, eh = w * sc, h * sc
            r = g.resize((max(1, round(ew)), max(1, round(eh))), Image.LANCZOS)
            inner = Image.new("L", (iw, ih), 255)
            inner.paste(r, (round((iw - ew) / 2), round((ih - eh) / 2)))
            out.paste(inner, (ix, iy))
            meta["fill"] = min(1, (ew * eh) / (iw * ih))
    else:
        x0, x1, y0, y1 = [v / s for v in b]
        x1 += 1 / s
        y1 += 1 / s
        px, py = w * 0.004, h * 0.004
        sx, sy = max(0, x0 - px), max(0, y0 - py)
        sw, sh = min(w, x1 + px) - sx, min(h, y1 + py) - sy
        p = round(min(W, H) * CFG["pad"])
        aw, ah = iw - 2 * p, ih - 2 * p
        sc = min(aw / sw, ah / sh)
        mw, mh = sw * sc, sh * sc
        r = g.crop((round(sx), round(sy), round(sx + sw), round(sy + sh))).resize(
            (max(1, round(mw)), max(1, round(mh))), Image.LANCZOS)
        out.paste(r, (round(ix + (iw - mw) / 2), round(iy + (ih - mh) / 2)))
        meta["mode"] = "margin"
        meta["fill"] = (mw * mh) / (iw * ih)
        meta["cut"] = 0
    meta["scale"] = sc
    mask = Image.new("L", (W, H), 255)
    ImageDraw.Draw(mask).rounded_rectangle((fx, fy, fx + fw - 1, fy + fh - 1), radius=CFG["radius"], fill=0)
    out.paste(255, (0, 0), mask)
    ImageDraw.Draw(out).rounded_rectangle((fx, fy, fx + fw - 1, fy + fh - 1), radius=CFG["radius"], outline=0, width=L)
    lw = round(lh * LOGO.width / LOGO.height)
    lx = fx + fw - round(min(W, H) * CFG["logoRight"]) - lw
    ly = fy + fh + lgap
    tint = LOGO.resize((lw, lh), Image.LANCZOS)
    out.paste(Image.new("L", (lw, lh), 107), (lx, ly), tint.split()[3])
    # 残った枠らしき線(二重枠)の検査
    d2, _ = small_dark(out.crop((ix, iy, ix + iw, iy + ih)))
    hh, ww = d2.shape
    k = max(3, round(min(hh, ww) * 0.06))
    meta["resid"] = float(max(d2[:k].mean(1).max(), d2[-k:].mean(1).max(), d2[:, :k].mean(0).max(), d2[:, -k:].mean(0).max()))
    return out, meta
