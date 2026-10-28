/* 介護のレクプリ 新デザイン（確認用） 共通スクリプト */
(function () {
  const IMG = "https://img.rekupuri.com/images/", TH = "https://img.rekupuri.com/thumbs/", THS = "https://img.rekupuri.com/thumbs_s/";
  const P = {
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    down: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    pal: '<circle cx="12" cy="12" r="9"/><circle cx="8.5" cy="10" r="1"/><circle cx="12" cy="7.5" r="1"/><circle cx="15.5" cy="10" r="1"/>',
    pen: '<path d="M4 20l4-1 11-11-3-3L5 16l-1 4z"/>',
    brain: '<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1V5a2 2 0 0 0-3-1z"/><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 1"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    print: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v7H6z"/>',
    check: '<path d="M5 12l5 5 9-10"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', crown: '<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>', full: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>', left: '<path d="M15 6l-6 6 6 6"/>', right: '<path d="M9 6l6 6-6 6"/>', home: '<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>', wall: '<rect x="3" y="4" width="18" height="16" rx="1.5"/><path d="M9 4v16M15 4v16M3 12h18"/>', mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'
  };
  const PROD = location.pathname.indexOf("/preview/") < 0;
  const L = k => PROD ? ({ nurie: "/gallery.html", noutore: "/gallery.html?page=noutore", cal: "/gallery.html?page=calendar", wall: "/gallery.html?page=wall", fav: "/gallery.html?page=fav" }[k] || "/gallery.html") : "list.html?k=" + k;
  const ROOT = PROD ? "/" : "../";
  window.RK_L = L;
  const ico = (n, s) => `<svg class="ico" ${s ? `style="width:${s}px;height:${s}px"` : ""} viewBox="0 0 24 24" aria-hidden="true">${P[n]}</svg>`;
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const kindOf = n => n.kind || "塗り絵";
  const ver = n => n.v ? "?v=" + encodeURIComponent(n.v) : "";
  const full = (n, f) => IMG + (f || n.file) + ver(n);
  const thumb = (n, f) => TH + (f || n.file) + ".jpg" + ver(n);
  const sthumb = (n, f) => THS + (f || n.file) + ".jpg" + ver(n);
  const srcs = n => `src="${sthumb(n)}" srcset="${sthumb(n)} 600w, ${thumb(n)} 1000w" sizes="(max-width:640px) 92vw, (max-width:900px) 46vw, 340px"`;
  addEventListener("error", e => {
    const t = e.target; if (!t || t.tagName !== "IMG") return;
    if (t.hasAttribute("srcset")) { const c = t.currentSrc || t.src; t.removeAttribute("srcset"); t.src = c.indexOf(THS) === 0 ? TH + c.slice(THS.length) : c; if (c.indexOf(TH) !== 0) return; }
    if (t.src.indexOf(THS) === 0) { t.src = TH + t.src.slice(THS.length); return; }
    if (t.src.indexOf(TH) === 0) { t.src = IMG + t.src.slice(TH.length).replace(/\.jpg(\?.*)?$/, "$1"); }
  }, true);
  const seen = new Set();
  const LIST = (window.NURIE_LIST || []).filter(n => n && n.file && !seen.has(n.file) && seen.add(n.file)).reverse();

  const J = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
  const S = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const FAV = "nurie_fav_v1", HIST = "nurie_history_v1";
  const favs = () => J(FAV, []);
  const isFav = f => favs().includes(f);
  const PT = (() => { try { return matchMedia("(pointer:fine)").matches; } catch (e) { return false; } })();
  const isUsed = f => !!(J(HIST, {})[f]);
  function toggleFav(f) { let a = favs(); a = a.includes(f) ? a.filter(x => x !== f) : a.concat(f); S(FAV, a); updFavCount(); return a.includes(f); }
  const hOf = f => J(HIST, {})[f] || null;
  const isSaved = f => { const h = hOf(f); return !!h && (!!h.save || !h.print); };
  const isPrinted = f => { const h = hOf(f); return !!h && !!h.print; };
  function markPrinted(f) { const h = J(HIST, {}); h[f] = h[f] || {}; h[f].print = new Date().toISOString().slice(0, 10); S(HIST, h); }
  function badges(f) {
    const a = hOf(f) ? `<span class="used">${ico("check", 13)}使用済み</span>` : "";
    return a ? `<span class="bdg">${a}</span>` : "";
  }
  function refreshCard(f) {
    document.querySelectorAll(`article[data-f="${CSS.escape(f)}"]`).forEach(ar => {
      const ph = ar.querySelector(".ph"); if (ph) { const o = ph.parentNode.querySelector(".bdg"); if (o) o.remove(); ph.parentNode.insertAdjacentHTML("beforeend", badges(f)); }
      const sb = ar.querySelector(`[data-save="${CSS.escape(f)}"]`) || ar.querySelector("[data-save]:not([data-of])"); if (sb && isSaved(f)) { sb.className = "btn done"; sb.innerHTML = ico("down", 17) + "もう一度保存"; }
      const pb = ar.querySelector(`[data-print="${CSS.escape(f)}"]`); if (pb && isPrinted(f)) { pb.textContent = pb.textContent.replace("直接印刷する", pb.classList.contains("half") ? "もう一度印刷" : "もう一度印刷する"); pb.classList.add("pdone"); }
    });
  }
  function resetHist(kind) {
    const h = J(HIST, {}); let n = 0;
    Object.keys(h).forEach(f => { const e = h[f] || {}; if (kind === "save" ? (e.save || !e.print) : e.print) { n++; if (kind === "save") delete e.save; else delete e.print; if (!e.save && !e.print) delete h[f]; else h[f] = e; } });
    S(HIST, h); return n;
  }
  function markUsed(f) { const h = J(HIST, {}); h[f] = h[f] || {}; h[f].save = new Date().toISOString().slice(0, 10); S(HIST, h); }

  const today = new Date();
  const isNew = n => {
    if (n.date) return (today - new Date(n.date)) / 864e5 < 21;
    const ym = today.toISOString().slice(0, 7); return n.added === ym;
  };
  const seasonNow = (() => { const m = today.getMonth() + 1; return m <= 2 || m === 12 ? "冬" : m <= 5 ? "春" : m <= 8 ? "夏" : "秋"; })();

  function updFavCount() { const n = favs().length; document.querySelectorAll("[data-favn]").forEach(e => { e.textContent = n; e.style.display = n ? "" : "none"; }); document.querySelectorAll("[data-favtab]").forEach(e => { e.textContent = n; }); }

  /* ---------- layout ---------- */
  function header(cur) {
    const nav = [["塗り絵", L("nurie"), "nurie"], ["脳トレ", L("noutore"), "noutore"], ["カレンダー", L("cal"), "cal"]];
    return `${PROD ? "" : '<div class="pvnote">新デザインの確認用ページです <a href="../index.html">今のサイトへ</a></div>'}
<header class="hd${cur === "" ? " top" : ""}"><div class="wrap">${cur === "" ? "" : `<div class="hl"><a class="logo" href="${PROD ? "/" : "index.html"}" aria-label="介護のレクプリ トップへ"><span class="ls">高齢者向けレク素材</span><img class="lmimg" src="/brand/logo.webp?v=3" alt="" width="900" height="283"></a><a class="favbtn fv${cur === "fav" ? " on" : ""}" href="${L("fav")}">${ico("star", 18)}お気に入り<span class="n" data-favtab>${favs().length}</span>件</a></div>`}

${cur === "" ? "" : `<a class="favbtn" href="${ROOT}contact.html">${ico("mail", 18)}お問い合わせ・要望</a>`}</div></header>`;
  }
  function tabs(cur) {
    const t = [["塗り絵", "nurie", "pen", "COLORING"], ["脳トレ", "noutore", "brain", "BRAIN"], ["カレンダー", "cal", "cal", "CALENDAR"], ["壁紙作り", "wall", "wall", "WALL"]];
    const cnt = k => k === "fav" ? favs().length : LIST.filter(n => kindOf(n) === { nurie: "塗り絵", noutore: "脳トレ", cal: "カレンダー", wall: "壁紙作り" }[k]).length;
    const v = new URLSearchParams(location.search).get("tab") || "bc";
    return `<nav class="tabs tabs-${v}" aria-label="素材の種類"><div class="wrap">${t.map(([n, k, i, en]) => `<a href="${L(k)}${!PROD && v !== "bc" ? "&tab=" + v : ""}"${cur === k ? ' aria-current="page"' : ""}><span class="ti">${ico(i, 22)}</span><span class="tl"><span class="en">${en}</span><span class="jp">${n}</span></span><span class="tc"${k === "fav" ? " data-favtab" : ""}>${cnt(k)}</span>${k === "wall" ? '<span class="tnew">NEW</span>' : ""}</a>`).join("")}</div></nav>`;
  }
  function footer(cur) {
    const b = [["塗り絵", "nurie", "pen"], ["脳トレ", "noutore", "brain"], ["カレンダー", "cal", "cal"], ["壁紙作り", "wall", "wall"], ["お気に入り", "fav", "star"]];
    return `<section class="req"><div class="wrap"><div><h3>「こんな${cur === "noutore" ? "脳トレ" : cur === "cal" ? "カレンダー" : cur === "wall" ? "壁紙作り" : cur === "fav" || cur === "" ? "素材" : "塗り絵"}がほしい」をお聞かせください</h3><p>ご要望・不具合のご連絡はこちらから。いただいた声をもとに素材を増やしています。</p></div><a class="btn p" href="${ROOT}contact.html" style="height:52px">ご要望を送る</a></div></section>
<footer class="ft"><div class="wrap"><span>© 介護のレクプリ</span><nav aria-label="サイトについて"><a href="${ROOT}terms.html">素材のご利用について</a><a href="${ROOT}privacy.html">プライバシーポリシー</a><a href="${ROOT}contact.html">お問い合わせ</a></nav></div></footer>
<nav class="bnav" aria-label="下部メニュー">${b.map(([t, k, i]) => `<a href="${L(k)}"${cur === k ? ' aria-current="page"' : ""}>${ico(i)}${t}${k === "wall" ? '<span class="bnew">NEW</span>' : ""}</a>`).join("")}</nav>
<div class="toast" role="status" aria-live="polite"><span class="ok">${ico("check", 18)}</span><span class="tx"></span></div>
<div class="md" role="dialog" aria-modal="true" aria-labelledby="mdT"><div class="box"></div></div>`;
  }

  /* ---------- card ---------- */
  function metaOf(n) {
    const k = kindOf(n);
    if (k === "カレンダー") return `${n.year}年${n.month}月`;
    if (k === "壁紙作り") return [n.season, n.people ? "推奨" + n.people : ""].filter(Boolean).join(" ・ ");
    return [n.season, n.genre, n.diff].filter(Boolean).join(" ・ ");
  }
  function card(n, opt = {}) {
    const k = kindOf(n), f = n.file, fav = isFav(f);
    const btn2 = k === "脳トレ" ? (n.answer ? `<button class="btn o" data-save="${esc(n.answer)}" data-of="${esc(f)}">答えを保存</button>` : "")
      : (n.sample ? `<button class="btn o" data-open="${esc(f)}" data-tab="s">${ico("pal", 17)}色見本</button>` : "");
    const W = k === "壁紙作り";
    const lab1 = k === "脳トレ" ? "問題を保存" : W ? "まとめて保存" : "保存する";
    const used = isSaved(f), printed = isPrinted(f);
    const saveBtn = `<button class="btn ${used ? "done" : "p"}" data-save="${esc(W && n.pdf ? n.pdf : f)}">${used ? ico("down", 17) + "もう一度保存" : ico("down", 17) + lab1}</button>`;
    return `<article class="card wk${k !== "塗り絵" ? " v" : ""}" data-f="${esc(f)}">
<div style="position:relative"><button class="ph" data-open="${esc(f)}" aria-label="${esc(n.title)}を拡大"><img class="sk" loading="lazy" decoding="async" alt="" ${srcs(n)} onload="this.classList.remove('sk')"></button>
${opt.chk ? `<span class="chk" role="checkbox" tabindex="0" aria-checked="${opt.on ? "true" : "false"}" data-chk="${esc(f)}" aria-label="選ぶ">${opt.on ? ico("check", 20) : ""}</span>` : (isNew(n) ? '<span class="new">NEW</span>' : "")}
<button class="star" data-fav="${esc(f)}" aria-pressed="${fav}" aria-label="お気に入り">${ico("star", 20)}</button>
${badges(f)}</div>
<div class="tt"><b>${esc(n.title)}</b><span>${esc(metaOf(n))}</span></div>
${PT && (k === "塗り絵" || W) ? `${btn2 ? `<div class="acts one">${btn2}</div>` : ""}<div class="acts${btn2 ? " a2" : ""}">${saveBtn}<button class="btn ptb half${printed ? " pdone" : ""}" data-print="${esc(f)}">${ico("print", 17)}${printed ? "もう一度印刷" : W ? "まとめて印刷" : "直接印刷する"}</button></div>` : `<div class="acts${btn2 ? "" : " one"}">${saveBtn}${btn2}</div>${PT && k !== "カレンダー" ? `<button class="btn ptb${printed ? " pdone" : ""}" data-print="${esc(f)}">${ico("print", 17)}${printed ? "もう一度印刷する" : "直接印刷する"}${k === "脳トレ" && n.answer ? "(答え付き)" : ""}</button>` : ""}`}</article>`;
  }
  function skeleton(n) {
    return Array.from({ length: n }, () => `<div class="card wk"><div class="sk" style="aspect-ratio:1.414;border-radius:6px"></div><div class="sk" style="height:16px;width:60%;border-radius:4px;margin:16px 0 8px"></div><div class="sk" style="height:12px;width:40%;border-radius:4px"></div></div>`).join("");
  }

  /* ---------- save ---------- */
  function toast(t, s) {
    const el = document.querySelector(".toast"); if (!el) return;
    el.querySelector(".tx").innerHTML = `<b>${esc(t)}</b>${s ? `<small>${esc(s)}</small>` : ""}`;
    el.classList.add("on"); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove("on"), 3200);
  }
  /* ---------- logging (same as old gallery) ---------- */
  function deviceId() {
    let id = ""; try { id = localStorage.getItem("rekupuri_did") || ""; } catch (e) {}
    if (!id) { id = Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 4); try { localStorage.setItem("rekupuri_did", id); } catch (e) {} }
    return id;
  }
  function entOnce(flag) {
    try { if (!sessionStorage.getItem(flag)) { const e = JSON.parse(sessionStorage.getItem("rk_ent") || "null"); if (e) sessionStorage.setItem(flag, "1"); return e; } } catch (e) {}
    return null;
  }
  const API = ROOT + "api/log-save";
  const post = body => { if (!PROD) return; try { fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), keepalive: true }).catch(() => {}); } catch (e) {} };
  const sq = []; let st = null;
  function logSave(file, src, ctx) {
    sq.push([file, src || "unknown", ctx || null]); clearTimeout(st);
    st = setTimeout(() => { const q = sq.splice(0); post({ files: q.map(x => x[0]), srcs: q.map(x => x[1]), ctxs: q.map(x => x[2]), ent: entOnce("rk_ent_sent"), did: deviceId() }); }, 2000);
  }
  const oq = []; let ot = null;
  function logOpen(file, kind, src) {
    if (!file) return; const s0 = String(src || window.RK_SRC || "").slice(0, 12); oq.push((s0 === "list" || s0 === "noutore" || s0 === "wall") && window.RK_SORT ? [file, kind, s0, window.RK_SORT] : [file, kind, s0]); clearTimeout(ot);
    ot = setTimeout(() => { const q = oq.splice(0); post({ opens: q, ent: entOnce("rk_ent_osent"), did: deviceId() }); }, 3000);
  }
  const fq = []; let ft = null;
  function logFav(file, on) {
    fq.push([file, on ? 1 : 0, window.RK_PAGE || "list"]); clearTimeout(ft);
    ft = setTimeout(() => { const q = fq.splice(0); post({ favs: q, did: deviceId() }); }, 1500);
  }
  window.RK_SRC = "list"; window.RK_CTX = null;

  /* ---------- save ---------- */
  function dlName(n, file) {
    const d = kindOf(n) === "脳トレ" ? "" : (n.diff ? "(" + n.diff + ")" : "");
    if (file === n.answer) return n.title + " 答え" + d + file.slice(file.lastIndexOf("."));
    if (file === n.sample) return n.title + d + "（見本）.jpg";
    if (file === n.pdf) return "壁紙作り_" + n.title + ".pdf";
    return n.title + d + file.slice(file.lastIndexOf("."));
  }
  async function stampSample(blob) {
    try {
      const bmp = await createImageBitmap(blob), w = bmp.width, h = bmp.height, cv = document.createElement("canvas");
      cv.width = w; cv.height = h; const c = cv.getContext("2d"); c.drawImage(bmp, 0, 0);
      const text = "rekupuri.com", fs = Math.round(Math.min(w, h) * 0.0245); c.font = "bold " + fs + "px Arial, Helvetica, sans-serif";
      const tw = c.measureText(text).width, right = w - Math.min(w, h) * 0.043, base = h - Math.min(w, h) * 0.022, pad = fs * 0.35;
      c.fillStyle = "rgba(255,255,255,.88)"; c.fillRect(right - tw - pad, base - fs * 0.95, tw + pad * 2, fs * 1.25);
      c.fillStyle = "#666"; c.textAlign = "right"; c.textBaseline = "alphabetic"; c.fillText(text, right, base);
      return await new Promise(res => cv.toBlob(b => res(b || blob), "image/jpeg", 0.92));
    } catch (e) { return blob; }
  }
  async function getBlob(n, file) {
    let r = null;
    try { r = await fetch(full(n, file), { mode: "cors", cache: "no-cache" }); } catch (e) { r = null; }
    if ((!r || !r.ok) && PROD) { try { r = await fetch("/api/dl?f=" + encodeURIComponent(file), { cache: "no-store" }); } catch (e) { r = null; } }
    if (!r || !r.ok) throw new Error("load");
    const b = await r.blob();
    if (file === n.file && kindOf(n) === "塗り絵" && window.rekupuriFrame) return await window.rekupuriFrame(b);
    if ((file === n.file || file === n.answer) && kindOf(n) === "脳トレ" && window.rekupuriStamp) return await window.rekupuriStamp(b);
    if (file === n.sample) return await stampSample(b);
    return b;
  }
  const busy = new Set();
  async function save(file, src, ctx) {
    const n = LIST.find(x => x.file === file || x.answer === file || x.sample === file || x.pdf === file); if (!n || busy.has(file)) return;
    busy.add(file);
    const name = dlName(n, file);
    const go = (url, direct) => { const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); };
    try { const b = await getBlob(n, file), u = URL.createObjectURL(b); go(u); setTimeout(() => URL.revokeObjectURL(u), 30000); }
    catch (e) { if (PROD) go("/api/dl?f=" + encodeURIComponent(file) + "&n=" + encodeURIComponent(name), true); else window.open(full(n, file), "_blank"); }
    busy.delete(file);
    if (file === n.file || file === n.pdf) { markUsed(n.file); logSave(n.file, src || window.RK_SRC, ctx === undefined ? window.RK_CTX : ctx); }
    else logSave(file, src || window.RK_SRC, null);
    toast(`「${n.title}」を保存しました`, file === n.pdf ? "全体図と塗り絵をまとめたPDFです。A4・実際のサイズで印刷してください" : "A4サイズで印刷してお使いください");
    if (file === n.file || file === n.pdf) refreshCard(n.file);
  }

  /* ---------- print (test) ---------- */
  let jspdfP = null;
  const loadPdf = () => jspdfP || (jspdfP = new Promise((res, rej) => { const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"; s.onload = () => res(window.jspdf.jsPDF); s.onerror = rej; document.head.appendChild(s); }));
  async function toJpeg(blob) {
    const bmp = await createImageBitmap(blob), cv = document.createElement("canvas"); cv.width = bmp.width; cv.height = bmp.height;
    const c = cv.getContext("2d"); c.fillStyle = "#fff"; c.fillRect(0, 0, cv.width, cv.height); c.drawImage(bmp, 0, 0);
    return { url: cv.toDataURL("image/jpeg", 0.92), w: bmp.width, h: bmp.height };
  }
  async function printIt(file, btn, src, ctx) {
    const n = LIST.find(x => x.file === file || x.sample === file); if (!n || busy.has("p:" + file)) return;
    const isS = file === n.sample;
    busy.add("p:" + file);
    const win = window.open("", "_blank");
    if (win) win.document.write('<p style="font:16px sans-serif;padding:24px">印刷用のPDFを作成しています…</p>');
    const old = btn ? btn.textContent : ""; if (btn) btn.textContent = "作成中…";
    try {
      if (kindOf(n) === "壁紙作り" && n.pdf) {
        const b = await getBlob(n, n.pdf), url = URL.createObjectURL(new Blob([b], { type: "application/pdf" }));
        if (win) win.location.href = url; else window.open(url, "_blank");
        markPrinted(n.file); logSave(n.file, src || window.RK_SRC, Object.assign({}, ctx || {}, { pr: "1" })); refreshCard(n.file);
        toast(`「${n.title}」の印刷画面を開きました`, "A4・実際のサイズ（100%）で印刷してください");
        busy.delete("p:" + file); return;
      }
      const JsPDF = await loadPdf();
      const files = isS ? [n.sample] : [n.file].concat(kindOf(n) === "脳トレ" && n.answer ? [n.answer] : []);
      let doc = null;
      for (const f of files) {
        const im = await toJpeg(await getBlob(n, f)), land = im.w > im.h, W = land ? 297 : 210, H = land ? 210 : 297;
        if (!doc) doc = new JsPDF({ orientation: land ? "l" : "p", unit: "mm", format: "a4" }); else doc.addPage("a4", land ? "l" : "p");
        const r = Math.min(W / im.w, H / im.h), w = im.w * r, h = im.h * r;
        doc.addImage(im.url, "JPEG", (W - w) / 2, (H - h) / 2, w, h);
      }
      doc.setProperties({ title: n.title + (isS ? "（見本）" : "") }); doc.autoPrint();
      const url = URL.createObjectURL(doc.output("blob"));
      if (win) win.location.href = url; else window.open(url, "_blank");
      markPrinted(file); logSave(file, src || window.RK_SRC, Object.assign({}, ctx || {}, { pr: "1" })); if (!isS) refreshCard(n.file);
      document.querySelectorAll(`.md [data-print="${CSS.escape(file)}"]`).forEach(b => { b.classList.add("pdone"); });
      toast(`「${n.title}」${isS ? "の色見本" : ""}の印刷画面を開きました`, "A4サイズで印刷してください");
    } catch (e) { if (win) win.close(); toast("印刷用PDFを作れませんでした", "保存してから印刷してください"); }
    if (btn && btn.textContent === "作成中…") btn.textContent = old; if (!isS) refreshCard(file); busy.delete("p:" + file);
  }

  /* ---------- modal ---------- */
  let mdN = null, mdTab = "l", zoom = 100, mdPg = -1;
  function related(n) {
    const k = kindOf(n), pool = LIST.filter(x => x.file !== n.file && kindOf(x) === k && x.title !== n.title);
    const head = t => String(t).split(/[ 　(（]/)[0];
    const sc = x => (head(x.title) === head(n.title) ? 8 : 0) + (x.genre && x.genre === n.genre ? 4 : 0) + (x.season === n.season ? 2 : 0) + (x.diff === n.diff ? 1 : 0) + Math.random();
    return pool.map(x => [sc(x), x]).sort((a, b) => b[0] - a[0]).slice(0, 6).map(a => a[1]);
  }
  let mdSrc = "list", mdCtx = null;
  function openMd(file, tab, src) {
    const n = LIST.find(x => x.file === file); if (!n) return;
    mdN = n; mdTab = tab || "l"; zoom = 100; mdPg = -1; mdSrc = src || window.RK_SRC; mdCtx = src ? null : window.RK_CTX; renderMd();
    if (kindOf(n) === "塗り絵" || kindOf(n) === "脳トレ" || kindOf(n) === "壁紙作り") logOpen(n.file, "lb", mdSrc); if (mdTab === "s") logOpen(n.sample, "smp", mdSrc);
    const md = document.querySelector(".md"); if (!md.classList.contains("on")) { try { history.pushState({ md: 1 }, ""); } catch (e) {} } md.classList.add("on"); document.body.style.overflow = "hidden";
    const bx = md.querySelector(".box"); bx.setAttribute("tabindex", "-1"); bx.focus({ preventScroll: true });
  }
  function hideMd() { document.querySelector(".md").classList.remove("on"); document.body.style.overflow = ""; }
  function closeMd() { if (!document.querySelector(".md.on")) return; if (history.state && history.state.md) history.back(); else hideMd(); }
  addEventListener("popstate", hideMd);
  function upgradeMd() {
    const im = document.querySelector(".md .view img"); if (!im || !im.dataset.full) return;
    const u = im.dataset.full, pre = new Image(); pre.onload = () => { if (im.isConnected && im.dataset.full === u) im.src = u; }; pre.src = u;
  }
  function renderMd() {
    const n = mdN, k = kindOf(n);
    const tabs = k === "脳トレ" ? (n.answer ? [["l", "問題"], ["a", "答え"]] : [["l", "問題"]]) : (n.sample ? [["l", "線画"], ["s", "色見本"]] : [["l", "線画"]]);
    const f = mdTab === "s" ? n.sample : mdTab === "a" ? n.answer : (k === "壁紙作り" && n.pdf ? n.pdf : n.file);
    const PGL = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫";
    const vf = k === "壁紙作り" && mdTab !== "s" && mdPg >= 0 && n.pages && n.pages[mdPg] ? n.pages[mdPg] : (f === n.pdf ? n.file : f);
    const wpages = k === "壁紙作り" && mdTab !== "s" && n.pages && n.pages.length ? `<div class="wpages"><h3>保存・印刷される内容<small>A4縦・全${n.pages.length}枚<br>押すと大きく表示</small></h3><div class="wpg">${n.pages.map((p, i) => `<button type="button" data-wpg="${i}" aria-pressed="${mdPg === i}"><img loading="lazy" alt="" src="${sthumb(n, p)}"><span>${i ? PGL[i - 1] : "全体図"}</span></button>`).join("")}</div></div>` : "";
    const rel = related(n), pf = mdTab === "s" ? n.sample : n.file;
    document.querySelector(".md .box").classList.toggle("wall", k === "壁紙作り");
    document.querySelector(".md .box").innerHTML = `<div class="top"><div class="tt2"><h2 id="mdT">${esc(n.title)}</h2><div class="meta">${esc(metaOf(n))}</div></div><div class="tb" role="tablist">${tabs.map(([id, t]) => `<button role="tab" aria-selected="${mdTab === id}" data-mtab="${id}">${t}</button>`).join("")}</div><button class="mdx" data-close aria-label="閉じる">${ico("x", 22)}</button></div>
<div class="scr">
<div class="body"><div class="view"><img alt="${esc(n.title)}" src="${thumb(n, vf)}" data-full="${full(n, vf)}" onload="this.closest('.box').classList.toggle('tate',this.naturalHeight>this.naturalWidth)">${k !== "カレンダー" ? `<button class="vstar" data-fav="${esc(n.file)}" aria-pressed="${isFav(n.file)}" aria-label="お気に入り">${ico("star", 24)}</button>` : ""}<button class="fsb" data-fs aria-label="全画面で見る">${ico("full", 18)}全画面</button>${wpages}</div>

${rel.length ? `<div class="rel"><div class="h2" style="margin:0"><h2 style="font-size:18px">似た${k === "脳トレ" ? "脳トレ" : k === "カレンダー" ? "カレンダー" : k === "壁紙作り" ? "壁紙作り" : "塗り絵"}</h2></div><div class="g">${rel.map(r => `<button data-open="${esc(r.file)}" data-src="nita"><img loading="lazy" alt="" src="${sthumb(r)}">${esc(r.title)}</button>`).join("")}</div></div>` : ""}</div></div><div class="mdf"><div class="row2">${PT && k !== "カレンダー" ? `<button class="btn p" data-save="${esc(f)}">${ico("down", 19)}${mdTab === "s" ? "色見本を保存" : mdTab === "a" ? "答えを保存" : k === "脳トレ" ? "問題を保存" : k === "壁紙作り" ? "まとめて保存" : "保存する"}</button><button class="btn ptb mdp${isPrinted(pf) ? " pdone" : ""}" data-print="${esc(pf)}">${ico("print", 17)}${isPrinted(pf) ? "もう一度印刷" : mdTab === "s" ? "色見本を印刷" : k === "壁紙作り" ? "まとめて印刷" : "直接印刷する"}${k === "脳トレ" && n.answer ? "(答え付き)" : ""}</button>` : `<button class="btn g" data-fav="${esc(n.file)}" aria-pressed="${isFav(n.file)}">${ico("star", 19)}${isFav(n.file) ? "お気に入り済み" : "<span>お気に入り<span class=lg>に追加</span></span>"}</button><button class="btn p" data-save="${esc(f)}">${ico("down", 19)}${mdTab === "s" ? "色見本を保存" : mdTab === "a" ? "答えを保存" : k === "壁紙作り" ? "まとめて保存" : "<span><span class=lg>印刷用画像を</span>保存</span>"}</button>`}</div>
</div>`;
    upgradeMd();
  }

  /* ---------- 全画面表示（スマホで横長を大きく） ---------- */
  function openFs() {
    const im = document.querySelector(".md .view img"); if (!im) return;
    const src = im.dataset.full && im.dataset.up ? im.dataset.full : im.src;
    const o = document.createElement("div"); o.className = "fsv"; o.setAttribute("role", "dialog"); o.setAttribute("aria-label", "全画面表示");
    o.innerHTML = `<img alt="" src="${src}"><button class="fsx" aria-label="閉じる">${ico("x", 22)}</button><span class="fsh">画面を押すと閉じます</span>`;
    const fit = () => { const i = o.querySelector("img"), w = i.naturalWidth || 1414, h = i.naturalHeight || 1000, vw = innerWidth, vh = innerHeight, rot = w > h && vh > vw;
      i.style.transform = rot ? "translate(-50%,-50%) rotate(90deg)" : "translate(-50%,-50%)";
      const s = rot ? Math.min(vh / w, vw / h) : Math.min(vw / w, vh / h); i.style.width = w * s * .96 + "px"; i.style.height = h * s * .96 + "px"; };
    o.querySelector("img").onload = fit; addEventListener("resize", fit);
    const close = () => { removeEventListener("resize", fit); o.remove(); };
    o.addEventListener("click", close); document.body.appendChild(o); fit();
    if (!im.dataset.up && im.dataset.full) { const f = new Image(); f.onload = () => { const i = o.querySelector("img"); if (i) { i.src = im.dataset.full; } }; f.src = im.dataset.full; }
  }
  /* ---------- events ---------- */
  document.addEventListener("click", e => {
    if (e.target.classList && e.target.classList.contains("md")) { closeMd(); return; }
    const t = e.target.closest("button,[data-chk]"); if (!t) return;
    if (t.dataset.close !== undefined) return closeMd();
    if (t.dataset.fs !== undefined) { openFs(); return; }
    if (t.dataset.fav) {
      const on = toggleFav(t.dataset.fav); logFav(t.dataset.fav, on);
      document.querySelectorAll(`[data-fav="${CSS.escape(t.dataset.fav)}"]`).forEach(b => b.setAttribute("aria-pressed", on));
      if (t.closest(".md")) renderMd();
      toast(on ? "お気に入りに追加しました" : "お気に入りから外しました", on ? "お気に入りページからまとめて保存できます" : "");
      document.dispatchEvent(new CustomEvent("favchange")); return;
    }
    if (t.dataset.print) { const inMd = !!t.closest(".md"); printIt(t.dataset.print, t, inMd ? mdSrc : (t.dataset.src || window.RK_SRC), inMd ? mdCtx : window.RK_CTX); return; }
    if (t.dataset.save) { const inMd = !!t.closest(".md"); save(t.dataset.save, inMd ? mdSrc : (t.dataset.src || window.RK_SRC), inMd ? mdCtx : undefined); return; }
    if (t.dataset.open) { openMd(t.dataset.open, t.dataset.tab, t.dataset.src || (t.closest(".md") ? "nita" : null)); return; }
    if (t.dataset.wpg !== undefined) { const i = +t.dataset.wpg; mdPg = mdPg === i ? -1 : i; if (mdTab === "s") mdTab = "l"; renderMd(); return; }
    if (t.dataset.mtab) { mdTab = t.dataset.mtab; mdPg = -1; renderMd(); if (mdTab === "s") logOpen(mdN.sample, "smp", mdSrc); return; }
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeMd(); });
  const inZoom = t => t && t.tagName === "IMG" && !!t.closest(".md .view, .fsv");
  document.addEventListener("contextmenu", e => { if (inZoom(e.target)) e.preventDefault(); });
  document.addEventListener("dragstart", e => { if (inZoom(e.target)) e.preventDefault(); });

  window.RK = { PT, resetHist, isUsed, sthumb, srcs, LIST, kindOf, card, skeleton, header, tabs, footer, ico, esc, thumb, full, isFav, favs, save, toast, updFavCount, seasonNow, isNew, metaOf, openMd };
})();
