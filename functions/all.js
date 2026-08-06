export async function onRequest(context) {
  {
    const _u = new URL(context.request.url);
    if (_u.hostname === "kaigo-no-rekupuri.edgeone.dev") {
      return Response.redirect("https://rekupuri.com" + _u.pathname + _u.search, 301);
    }
  }

  const esc = (s) =>
    String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  async function loadList(req) {
    const url = new URL("/data.js", req.url);
    const res = await fetch(url.toString(), { cf: { cacheTtl: 60 } });
    if (!res.ok) return [];
    const txt = await res.text();
    const body = txt.slice(txt.indexOf("["));
    const out = [];
    const objs = body.match(/\{[^{}]*\}/g) || [];
    for (const o of objs) {
      const item = {};
      let m;
      const reStr = /(\w+)\s*:\s*"([^"]*)"/g;
      while ((m = reStr.exec(o))) item[m[1]] = m[2];
      const reNum = /(\w+)\s*:\s*(true|false|\d+)\s*(?:,|\})/g;
      while ((m = reNum.exec(o))) {
        if (item[m[1]] === undefined) {
          item[m[1]] = m[2] === "true" ? true : m[2] === "false" ? false : Number(m[2]);
        }
      }
      if (item.file) out.push(item);
    }
    return out;
  }

  const list = (await loadList(context.request)).filter((n) => !n.member);
  if (!list.length) {
    return new Response("データを読み込めませんでした。", {
      status: 503,
      headers: { "content-type": "text/plain; charset=UTF-8" }
    });
  }

  const kindOf = (n) => n.kind || "塗り絵";
  const slug = (n) => n.file.replace(/\.[^.]+$/, "");
  const label = (n) => {
    const k = kindOf(n);
    if (k === "塗り絵" && n.diff) return n.title + "(" + n.diff + ")";
    return n.title;
  };

  const seasonOrder = ["春", "夏", "秋", "冬", "通年"];
  const nurie = list.filter((n) => kindOf(n) === "塗り絵");
  const noutore = list.filter((n) => kindOf(n) === "脳トレ");
  const calendar = list.filter((n) => kindOf(n) === "カレンダー");

  const linksOf = (arr) =>
    arr
      .map(
        (n) =>
          '<li><a href="/works/' +
          esc(encodeURIComponent(slug(n))) +
          '">' +
          esc(label(n)) +
          "</a></li>"
      )
      .join("");

  let sections = "";

  const nurieGroups = seasonOrder
    .map((s) => [s, nurie.filter((n) => n.season === s)])
    .filter((g) => g[1].length);
  if (nurieGroups.length) {
    sections +=
      "<h2>塗り絵(" +
      nurie.length +
      "枚)</h2>" +
      nurieGroups
        .map(
          (g) =>
            "<h3>" + esc(g[0]) + "(" + g[1].length + "枚)</h3><ul>" + linksOf(g[1]) + "</ul>"
        )
        .join("");
  }

  const ngenres = [];
  noutore.forEach((n) => {
    const g = n.genre || "その他";
    if (!ngenres.includes(g)) ngenres.push(g);
  });
  if (noutore.length) {
    sections +=
      "<h2>脳トレ(" +
      noutore.length +
      "枚)</h2>" +
      ngenres
        .map((g) => {
          const arr = noutore.filter((n) => (n.genre || "その他") === g);
          return "<h3>" + esc(g) + "(" + arr.length + "枚)</h3><ul>" + linksOf(arr) + "</ul>";
        })
        .join("");
  }

  if (calendar.length) {
    const sorted = calendar.slice().sort((a, b) => (a.year - b.year) || (a.month - b.month));
    sections += "<h2>カレンダー(" + calendar.length + "枚)</h2><ul>" + linksOf(sorted) + "</ul>";
  }

  const title = "作品いちらん|介護のレクプリ";
  const desc =
    "介護のレクプリで配布している高齢者向けの無料塗り絵・脳トレ・カレンダー" +
    list.length +
    "枚の一覧です。作品名から個別ページへ移動できます。";

  const html =
    '<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    "<title>" + esc(title) + "</title>" +
    '<meta name="description" content="' + esc(desc) + '">' +
    '<link rel="canonical" href="https://rekupuri.com/all">' +
    '<meta property="og:type" content="website">' +
    '<meta property="og:site_name" content="介護のレクプリ">' +
    '<meta property="og:title" content="' + esc(title) + '">' +
    '<meta property="og:description" content="' + esc(desc) + '">' +
    '<meta property="og:url" content="https://rekupuri.com/all">' +
    '<meta property="og:image" content="https://rekupuri.com/logo.png">' +
    '<link rel="icon" href="/favicon.ico" sizes="48x48">' +
    '<link rel="icon" type="image/png" sizes="96x96" href="/favicon-96.png">' +
    '<link rel="apple-touch-icon" href="/apple-touch-icon.png">' +
    "<style>" +
    ":root{--bg:#faf6ef;--card:#fff;--ink:#3a3a3a;--accent:#e8833a;--line:#e5ddd0}" +
    "*{box-sizing:border-box;margin:0;padding:0}" +
    'body{font-family:"Hiragino Maru Gothic ProN","BIZ UDGothic","Yu Gothic","Meiryo",sans-serif;' +
    "background:var(--bg);color:var(--ink);line-height:1.7}" +
    "header{background:var(--card);border-bottom:3px solid var(--accent);padding:18px 24px;text-align:center}" +
    "header h1{font-size:22px;color:var(--accent);letter-spacing:1px}" +
    "header p{font-size:14px;color:#8a8477;margin-top:4px}" +
    "a{color:#b3611f}" +
    ".wrap{max-width:900px;margin:0 auto;padding:20px 16px 60px}" +
    ".lead{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px 18px;font-size:15px;color:#6b5535}" +
    "h2{font-size:20px;color:var(--accent);margin:32px 0 4px;padding-bottom:6px;border-bottom:2px solid var(--line)}" +
    "h3{font-size:16px;color:#6b5535;margin:18px 0 6px}" +
    "ul{list-style:none;display:flex;flex-wrap:wrap;gap:4px 0}" +
    "li{font-size:15px;padding:2px 0;width:33.3%}" +
    "@media(max-width:700px){li{width:50%}}" +
    "@media(max-width:420px){li{width:100%}}" +
    "footer{text-align:center;font-size:13px;color:#8a8477;padding:34px 16px 26px;margin-top:30px;border-top:1px solid var(--line)}" +
    "</style></head><body>" +
    "<header><h1>作品いちらん</h1>" +
    '<p><a href="/">トップへ</a> ｜ <a href="/gallery.html">塗り絵をさがす</a> ｜ <a href="/gallery.html?page=noutore">脳トレをさがす</a></p></header>' +
    '<div class="wrap">' +
    '<p class="lead">「介護のレクプリ」で配布している素材' +
    list.length +
    "枚の一覧です。作品名をクリックすると、その作品のページが開いてA4サイズでダウンロードできます。会員登録も費用も必要ありません。</p>" +
    sections +
    "<footer>© 介護のレクプリ</footer></div></body></html>";

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=UTF-8",
      "cache-control": "public, max-age=600"
    }
  });
}
