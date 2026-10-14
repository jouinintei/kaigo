import numpy as np
from PIL import Image, ImageDraw

CFG = dict(inset=0.012, line=14, radius=28, pad=0.012, logoH=0.022, logoRight=0.035)
A4L, A4P = (3508, 2480), (2480, 3508)
LOGO = Image.open("logo.png").convert("RGBA")


def to_gray(im):
    rgba = im.convert("RGBA")
    bg = Image.new("RGBA", rgba.size, (255, 255, 255, 255))
    bg.alpha_composite(rgba)
    return bg.convert("L")


def analyze(g):
    w, h = g.size
    s = min(1, 900 / max(w, h))
    aw, ah = max(1, round(w * s)), max(1, round(h * s))
    small = g.resize((aw, ah), Image.BILINEAR)
    dark = np.array(small) < 160
    if not dark.any():
        return None
    ys = np.where(dark.any(1))[0]
    xs = np.where(dark.any(0))[0]
    x0, x1, y0, y1 = xs[0], xs[-1], ys[0], ys[-1]
    band = max(2, round(min(aw, ah) * 0.015))
    sub = dark[y0:y1 + 1, x0:x1 + 1]
    cover = min(sub[:band].any(0).mean(), sub[-band:].any(0).mean(),
                sub[:, :band].any(1).mean(), sub[:, -band:].any(1).mean())
    own = cover >= 0.97
    inner = None
    strips = None
    if own:
        lim = round(min(x1 - x0, y1 - y0) * 0.08)

        def strip(get, start, d):
            seen, last = False, 0
            for k in range(lim):
                f = get(start + d * k)
                if f >= 0.6:
                    seen, last = True, k
                elif seen and k - last > 2:
                    break
            return last + 2 if seen else 0

        rowf = lambda yy: dark[yy, x0:x1 + 1].mean()
        colf = lambda xx: dark[y0:y1 + 1, xx].mean()
        t0, t1 = strip(rowf, y0, 1), strip(rowf, y1, -1)
        l0, l1 = strip(colf, x0, 1), strip(colf, x1, -1)
        strips = (t0, t1, l0, l1, lim)
        inner = ((x0 + l0) / s, (y0 + t0) / s, (x1 + 1 - l1) / s, (y1 + 1 - t1) / s)
    tol = 0.01
    edge = sum([x0 <= aw * tol, y0 <= ah * tol, aw - 1 - x1 <= aw * tol, ah - 1 - y1 <= ah * tol]) >= 2
    return dict(x0=x0 / s, y0=y0 / s, x1=(x1 + 1) / s, y1=(y1 + 1) / s, own=own, edge=edge,
                inner=inner, cover=float(cover), strips=strips)


def frame(im):
    g = to_gray(im)
    w, h = g.size
    W, H = A4L if w >= h else A4P
    info = analyze(g)
    meta = dict(orig=(w, h), mode=None)
    if info and info["own"] and info["inner"]:
        meta["strips"] = info["strips"]
        ib = info["inner"]
        g = g.crop((round(ib[0]), round(ib[1]), round(ib[2]), round(ib[3])))
        w, h = g.size
        info2 = analyze(g)
        meta["resid_cover"] = info2["cover"] if info2 else None
        info = info2
        if info:
            info["own"] = False
        meta["own"] = True
    meta["cover"] = info["cover"] if info else None
    out = Image.new("L", (W, H), 255)
    m = round(min(W, H) * CFG["inset"])
    fx, fy, fw, fh = m, m, W - 2 * m, H - 2 * m
    L = CFG["line"]
    ix, iy, iw, ih = fx + L, fy + L, fw - 2 * L, fh - 2 * L
    if not info:
        meta["mode"] = "blank"
    elif info["edge"]:
        s2 = max(iw / w, ih / h)
        ew, eh = w * s2, h * s2
        r = g.resize((max(1, round(ew)), max(1, round(eh))), Image.LANCZOS)
        inner = Image.new("L", (iw, ih), 255)
        inner.paste(r, (round((iw - ew) / 2), round((ih - eh) / 2)))
        out.paste(inner, (ix, iy))
        meta["mode"] = "edge"
        meta["cut"] = 1 - (iw * ih) / (ew * eh)
        meta["cut_x"] = max(0, (ew - iw) / ew)
        meta["cut_y"] = max(0, (eh - ih) / eh)
        meta["scale"] = s2
    else:
        px, py = w * 0.004, h * 0.004
        sx, sy = max(0, info["x0"] - px), max(0, info["y0"] - py)
        sw, sh = min(w, info["x1"] + px) - sx, min(h, info["y1"] + py) - sy
        p = round(min(W, H) * CFG["pad"])
        aw, ah = iw - 2 * p, ih - 2 * p
        s3 = min(aw / sw, ah / sh)
        mw, mh = sw * s3, sh * s3
        r = g.crop((round(sx), round(sy), round(sx + sw), round(sy + sh))).resize(
            (max(1, round(mw)), max(1, round(mh))), Image.LANCZOS)
        out.paste(r, (round(ix + (iw - mw) / 2), round(iy + (ih - mh) / 2)))
        meta["mode"] = "margin"
        meta["fill"] = (mw * mh) / (iw * ih)
        meta["scale"] = s3
    mask = Image.new("L", (W, H), 255)
    ImageDraw.Draw(mask).rounded_rectangle((fx, fy, fx + fw - 1, fy + fh - 1), radius=CFG["radius"], fill=0)
    out.paste(255, (0, 0), mask)
    ImageDraw.Draw(out).rounded_rectangle((fx, fy, fx + fw - 1, fy + fh - 1), radius=CFG["radius"], outline=0, width=L)
    lh = round(min(W, H) * CFG["logoH"])
    lw = round(lh * LOGO.width / LOGO.height)
    gap = round(lh * 0.35)
    lx = fx + fw - round(min(W, H) * CFG["logoRight"]) - lw
    cy = fy + fh - L / 2
    ly = round(cy - lh / 2)
    vg = round(lh * 0.15)
    box = (lx - gap, ly - vg, lx + lw + gap, ly + lh + vg)
    region = np.array(out.crop((box[0], box[1], box[2], round(fy + fh - L))))
    meta["under_logo"] = float((region < 128).mean())
    ImageDraw.Draw(out).rectangle(box, fill=255)
    tint = LOGO.resize((lw, lh), Image.LANCZOS)
    a = tint.split()[3]
    gray = Image.new("L", (lw, lh), 107)
    out.paste(gray, (lx, ly), a)
    meta["W"], meta["H"] = W, H
    return out, meta
