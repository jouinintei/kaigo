(function () {
  var CFG = {
    inset: 0.035,
    line: 16,
    radius: 40,
    pad: 0.012
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

  function analyze(src, w, h) {
    var s = Math.min(1, 900 / Math.max(w, h));
    var aw = Math.max(1, Math.round(w * s)), ah = Math.max(1, Math.round(h * s));
    var c = document.createElement("canvas");
    c.width = aw; c.height = ah;
    var x = c.getContext("2d", { willReadFrequently: true });
    x.fillStyle = "#fff";
    x.fillRect(0, 0, aw, ah);
    x.drawImage(src, 0, 0, aw, ah);
    var d = x.getImageData(0, 0, aw, ah).data;
    var dark = new Uint8Array(aw * ah);
    var x0 = aw, y0 = ah, x1 = -1, y1 = -1;
    for (var yy = 0; yy < ah; yy++) {
      for (var xx = 0; xx < aw; xx++) {
        var i = (yy * aw + xx) * 4;
        var v = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
        if (v < 160) {
          dark[yy * aw + xx] = 1;
          if (xx < x0) x0 = xx;
          if (xx > x1) x1 = xx;
          if (yy < y0) y0 = yy;
          if (yy > y1) y1 = yy;
        }
      }
    }
    if (x1 < 0) return null;
    var band = Math.max(2, Math.round(Math.min(aw, ah) * 0.015));
    function rowCover(ya, yb) {
      var n = 0;
      for (var xx = x0; xx <= x1; xx++) {
        for (var yy = ya; yy <= yb; yy++) { if (dark[yy * aw + xx]) { n++; break; } }
      }
      return n / (x1 - x0 + 1);
    }
    function colCover(xa, xb) {
      var n = 0;
      for (var yy = y0; yy <= y1; yy++) {
        for (var xx = xa; xx <= xb; xx++) { if (dark[yy * aw + xx]) { n++; break; } }
      }
      return n / (y1 - y0 + 1);
    }
    var own = Math.min(
      rowCover(y0, Math.min(y1, y0 + band - 1)),
      rowCover(Math.max(y0, y1 - band + 1), y1),
      colCover(x0, Math.min(x1, x0 + band - 1)),
      colCover(Math.max(x0, x1 - band + 1), x1)
    ) >= 0.97;
    var tol = 0.01;
    var edge = [x0 <= aw * tol, y0 <= ah * tol, aw - 1 - x1 <= aw * tol, ah - 1 - y1 <= ah * tol]
      .filter(Boolean).length >= 2;
    return {
      x0: x0 / s, y0: y0 / s, x1: (x1 + 1) / s, y1: (y1 + 1) / s,
      own: own, edge: edge
    };
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
    var w = src.width, h = src.height;
    var size = w >= h ? A4L : A4P;
    var W = size[0], H = size[1];
    var info = analyze(src, w, h);
    var c = document.createElement("canvas");
    c.width = W; c.height = H;
    var ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, W, H);
    var m = Math.round(Math.min(W, H) * CFG.inset);
    var fx = m, fy = m, fw = W - 2 * m, fh = H - 2 * m;
    var L = CFG.line;

    ctx.save();
    roundRect(ctx, fx, fy, fw, fh, CFG.radius);
    ctx.clip();
    if (!info) {
      ctx.drawImage(src, fx, fy, fw, fh);
    } else if (info.own) {
      var cw = info.x1 - info.x0, ch = info.y1 - info.y0;
      if (Math.abs((cw / ch) / (fw / fh) - 1) < 0.06) {
        ctx.drawImage(src, info.x0, info.y0, cw, ch, fx, fy, fw, fh);
      } else {
        var s1 = Math.min(fw / cw, fh / ch);
        var dw = cw * s1, dh = ch * s1;
        ctx.drawImage(src, info.x0, info.y0, cw, ch, fx + (fw - dw) / 2, fy + (fh - dh) / 2, dw, dh);
      }
    } else {
      var ix = fx + L, iy = fy + L, iw = fw - 2 * L, ih = fh - 2 * L;
      if (info.edge) {
        var s2 = Math.max(iw / w, ih / h);
        var ew = w * s2, eh = h * s2;
        ctx.save();
        ctx.beginPath();
        ctx.rect(ix, iy, iw, ih);
        ctx.clip();
        ctx.drawImage(src, 0, 0, w, h, ix + (iw - ew) / 2, iy + (ih - eh) / 2, ew, eh);
        ctx.restore();
      } else {
        var px = w * 0.004, py = h * 0.004;
        var sx = Math.max(0, info.x0 - px), sy = Math.max(0, info.y0 - py);
        var sw = Math.min(w, info.x1 + px) - sx, sh = Math.min(h, info.y1 + py) - sy;
        var p = Math.round(Math.min(W, H) * CFG.pad);
        var aw = iw - 2 * p, ah = ih - 2 * p;
        var s3 = Math.min(aw / sw, ah / sh);
        var mw = sw * s3, mh = sh * s3;
        ctx.drawImage(src, sx, sy, sw, sh, ix + (iw - mw) / 2, iy + (ih - mh) / 2, mw, mh);
      }
    }
    ctx.restore();

    ctx.lineWidth = L;
    ctx.strokeStyle = "#000";
    roundRect(ctx, fx + L / 2, fy + L / 2, fw - L, fh - L, Math.max(0, CFG.radius - L / 2));
    ctx.stroke();
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
