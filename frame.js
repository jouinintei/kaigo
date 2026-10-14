(function () {
  var CFG = {
    inset: 0.008,
    line: 14,
    radius: 28,
    pad: 0.012,
    label: "rekupuri.com",
    logoH: 0.022,
    logoColor: "#6b6b6b",
    logoRight: 0.035,
    ownCover: 0.85,
    maxCut: 0.02,
    maxStretch: 0.05
  };
  var A4L = [3508, 2480];
  var A4P = [2480, 3508];

  function loadBitmap(blob) {
    if (window.createImageBitmap) {
      return createImageBitmap(blob).catch(function () { return loadImg(blob); });
    }
    return loadImg(blob);
  }
  function loadImg(blob) {
    return new Promise(function (res, rej) {
      var u = URL.createObjectURL(blob);
      var i = new Image();
      i.onload = function () { res(i); setTimeout(function () { URL.revokeObjectURL(u); }, 1000); };
      i.onerror = function () { URL.revokeObjectURL(u); rej(new Error("img")); };
      i.src = u;
    });
  }

  function darkMap(src, sx, sy, sw, sh) {
    var s = Math.min(1, 1800 / Math.max(sw, sh));
    var aw = Math.max(1, Math.round(sw * s)), ah = Math.max(1, Math.round(sh * s));
    var c = document.createElement("canvas");
    c.width = aw; c.height = ah;
    var x = c.getContext("2d", { willReadFrequently: true });
    x.fillStyle = "#fff";
    x.fillRect(0, 0, aw, ah);
    x.imageSmoothingQuality = "high";
    x.drawImage(src, sx, sy, sw, sh, 0, 0, aw, ah);
    var d = x.getImageData(0, 0, aw, ah).data;
    var dark = new Uint8Array(aw * ah);
    var x0 = aw, y0 = ah, x1 = -1, y1 = -1;
    for (var yy = 0; yy < ah; yy++) {
      for (var xx = 0; xx < aw; xx++) {
        var i = (yy * aw + xx) * 4;
        if (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114 < 200) {
          dark[yy * aw + xx] = 1;
          if (xx < x0) x0 = xx;
          if (xx > x1) x1 = xx;
          if (yy < y0) y0 = yy;
          if (yy > y1) y1 = yy;
        }
      }
    }
    return { dark: dark, aw: aw, ah: ah, s: s, box: x1 < 0 ? null : [x0, y0, x1, y1] };
  }

  function hasGutter(get, start, n, short) {
    var arr = new Array(n);
    for (var i = 0; i < n; i++) arr[i] = get(start + i);
    var m = Math.max(3, Math.round(n * 0.08));
    var k = Math.max(2, Math.round(short * 0.03));
    var i2 = m;
    while (i2 < n - m) {
      if (arr[i2] === 0) {
        var j = i2;
        while (j < n && arr[j] === 0) j++;
        if (j - i2 >= n * 0.01) {
          var before = 0, after = 0;
          for (var a = Math.max(0, i2 - k); a < i2; a++) before = Math.max(before, arr[a]);
          for (var b2 = j; b2 < Math.min(n, j + k); b2++) after = Math.max(after, arr[b2]);
          if (before >= 0.95 && after >= 0.95) return true;
        }
        i2 = j;
      } else {
        i2++;
      }
    }
    return false;
  }

  function tryStrip(src, r) {
    var m = darkMap(src, r[0], r[1], r[2] - r[0], r[3] - r[1]);
    if (!m.box) return null;
    var dark = m.dark, aw = m.aw;
    var x0 = m.box[0], y0 = m.box[1], x1 = m.box[2], y1 = m.box[3];
    var bw = x1 - x0 + 1, bh = y1 - y0 + 1;
    var band = Math.max(2, Math.round(Math.min(m.aw, m.ah) * 0.015));
    function rowAny(ya, yb) {
      var n = 0;
      for (var xx = x0; xx <= x1; xx++) for (var yy = ya; yy <= yb; yy++) if (dark[yy * aw + xx]) { n++; break; }
      return n / bw;
    }
    function colAny(xa, xb) {
      var n = 0;
      for (var yy = y0; yy <= y1; yy++) for (var xx = xa; xx <= xb; xx++) if (dark[yy * aw + xx]) { n++; break; }
      return n / bh;
    }
    var cover = Math.min(
      rowAny(y0, Math.min(y1, y0 + band - 1)), rowAny(Math.max(y0, y1 - band + 1), y1),
      colAny(x0, Math.min(x1, x0 + band - 1)), colAny(Math.max(x0, x1 - band + 1), x1));
    if (cover < CFG.ownCover) return null;
    function rowMean(yy) { var n = 0; for (var xx = x0; xx <= x1; xx++) n += dark[yy * aw + xx]; return n / bw; }
    function colMean(xx) { var n = 0; for (var yy = y0; yy <= y1; yy++) n += dark[yy * aw + xx]; return n / bh; }
    if (hasGutter(rowMean, y0, bh, Math.min(bw, bh)) || hasGutter(colMean, x0, bw, Math.min(bw, bh))) return null;
    var lim = Math.round(Math.min(bw, bh) * 0.08);
    function strip(get, start, dir, len) {
      var seen = false, last = 0;
      for (var k = 0; k < Math.min(lim, len); k++) {
        if (get(start + dir * k) >= 0.6) { seen = true; last = k; }
        else if (seen && k - last > 2) break;
      }
      return seen ? last + 2 : 0;
    }
    var t0 = strip(rowMean, y0, 1, bh), t1 = strip(rowMean, y1, -1, bh);
    var l0 = strip(colMean, x0, 1, bw), l1 = strip(colMean, x1, -1, bw);
    if (!(t0 && t1 && l0 && l1)) return null;
    var ix0 = x0 + l0, ix1 = x1 - l1, iy0 = y0 + t0, iy1 = y1 - t1;
    if (ix1 <= ix0 || iy1 <= iy0) return null;
    var iw = ix1 - ix0 + 1, ih = iy1 - iy0 + 1;
    var mx = Math.max(3, Math.round(iw * 0.04));
    for (var xx = ix0 + mx; xx <= ix1 - mx; xx++) {
      var n = 0;
      for (var yy = iy0; yy <= iy1; yy++) n += dark[yy * aw + xx];
      if (n / ih >= 0.9) return null;
    }
    var s = m.s;
    return [r[0] + ix0 / s, r[1] + iy0 / s, r[0] + (ix1 + 1) / s, r[1] + (iy1 + 1) / s];
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }

  async function frameBlob(blob) {
    var src = await loadBitmap(blob);
    var size = src.width >= src.height ? A4L : A4P;
    var W = size[0], H = size[1];

    var r = [0, 0, src.width, src.height];
    for (var it = 0; it < 3; it++) {
      var nr = tryStrip(src, r);
      if (!nr) break;
      r = nr;
    }
    var w = r[2] - r[0], h = r[3] - r[1];
    var m = darkMap(src, r[0], r[1], w, h);

    var c = document.createElement("canvas");
    c.width = W; c.height = H;
    var ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, W, H);

    var L = CFG.line;
    var mg = Math.round(Math.min(W, H) * CFG.inset);
    var lh = Math.round(Math.min(W, H) * CFG.logoH);
    var fx = mg, fy = mg, fw = W - 2 * mg, fh = H - 2 * mg;
    var ix = fx + L, iy = fy + L, iw = fw - 2 * L, ih = fh - 2 * L;

    var edge = true;
    if (m.box) {
      var tol = 0.01;
      edge = [m.box[0] <= m.aw * tol, m.box[1] <= m.ah * tol,
        m.aw - 1 - m.box[2] <= m.aw * tol, m.ah - 1 - m.box[3] <= m.ah * tol].filter(Boolean).length >= 2;
    }

    ctx.save();
    roundRect(ctx, fx, fy, fw, fh, CFG.radius);
    ctx.clip();
    if (edge) {
      var stretch = Math.abs((iw / ih) / (w / h) - 1);
      if (stretch <= CFG.maxStretch) {
        ctx.drawImage(src, r[0], r[1], w, h, ix, iy, iw, ih);
      } else {
        var sc = Math.max(iw / w, ih / h);
        var cut = Math.max(1 - iw / (w * sc), 1 - ih / (h * sc));
        if (cut > CFG.maxCut) sc = Math.min(iw / w, ih / h);
        var ew = w * sc, eh = h * sc;
        ctx.save();
        ctx.beginPath();
        ctx.rect(ix, iy, iw, ih);
        ctx.clip();
        ctx.drawImage(src, r[0], r[1], w, h, ix + (iw - ew) / 2, iy + (ih - eh) / 2, ew, eh);
        ctx.restore();
      }
    } else {
      var s = m.s;
      var bx0 = m.box[0] / s, by0 = m.box[1] / s, bx1 = (m.box[2] + 1) / s, by1 = (m.box[3] + 1) / s;
      var px = w * 0.004, py = h * 0.004;
      var sx = Math.max(0, bx0 - px), sy = Math.max(0, by0 - py);
      var sw = Math.min(w, bx1 + px) - sx, sh = Math.min(h, by1 + py) - sy;
      var p = Math.round(Math.min(W, H) * CFG.pad);
      var aw = iw - 2 * p, ah = ih - 2 * p;
      var s3 = Math.min(aw / sw, ah / sh);
      var mw = sw * s3, mh = sh * s3;
      ctx.drawImage(src, r[0] + sx, r[1] + sy, sw, sh, ix + (iw - mw) / 2, iy + (ih - mh) / 2, mw, mh);
    }
    ctx.restore();

    ctx.lineWidth = L;
    ctx.strokeStyle = "#000";
    roundRect(ctx, fx + L / 2, fy + L / 2, fw - L, fh - L, Math.max(0, CFG.radius - L / 2));
    ctx.stroke();

    var label = CFG.label;
    if (label) {
      var fs = Math.round(lh * 0.95);
      ctx.font = "bold " + fs + "px 'Helvetica Neue', Arial, 'Hiragino Sans', sans-serif";
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      var lw = Math.ceil(ctx.measureText(label).width);
      var gap = Math.round(lh * 0.35);
      var vg = Math.round(lh * 0.15);
      var lx = fx + fw - Math.round(Math.min(W, H) * CFG.logoRight) - lw;
      var ly = Math.min(Math.round(fy + fh - L / 2 - lh / 2), H - lh - vg - 4);
      ctx.fillStyle = "#fff";
      ctx.fillRect(lx - gap, ly - vg, lw + gap * 2, lh + vg * 2);
      ctx.fillStyle = CFG.logoColor;
      ctx.fillText(label, lx, ly + lh / 2 + 1);
    }
    if (src.close) { try { src.close(); } catch (e) {} }

    return await new Promise(function (res, rej) {
      c.toBlob(function (b) { b ? res(b) : rej(new Error("toBlob")); }, "image/png");
    });
  }

  window.rekupuriFrame = async function (blob) {
    try {
      return await frameBlob(blob);
    } catch (e) {
      return blob;
    }
  };
})();
