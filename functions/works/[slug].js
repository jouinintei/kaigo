// 作品ごとのページ (検索エンジン用)
// 例: /works/himawari_chu → ひまわり(中級)のページをサーバー側で組み立てて返す
// data.js を読むだけなので、新しい作品を投稿すると自動でページも増えます

const SITE = "介護のレクプリ";

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function loadList(origin) {
  const r = await fetch(origin + "/data.js?t=" + Date.now());
  if (!r.ok) return [];
  const text = await r.text();
  const items = [];
  const re = /\{[^{}]*file:\s*"[^"]*"[^{}]*\}/g;
  const get = (s, k) => {
    const m = s.match(new RegExp(k + ':\\s*"((?:[^"\\\\]|\\\\.)*)"'));
    return m ? m[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\") : "";
  };
  const flag = (s, k) => new RegExp(k + ":\\s*true").test(s);
  let m;
  while ((m = re.exec(text))) {
    const s = m[0];
    items.push({
      kind: get(s, "kind"), season: get(s, "season"), genre: get(s, "genre"),
      title: get(s, "title"), diff: get(s, "diff"), file: get(s, "file"),
      answer: get(s, "answer"), added: get(s, "added"), member: flag(s, "member")
    });
  }
  const seen = new Set();
  return items.filter(e => e.file && !seen.has(e.file) && seen.add(e.file));
}

function kindOf(n) {
  if (n.kind === "脳トレ") return "脳トレ";
  if (n.kind === "カレンダー") return "カレンダー";
  return "塗り絵";
}

export async function onRequest(context) {
  {
    const _u = new URL(context.request.url);
    if (_u.hostname === "kaigo-no-rekupuri.edgeone.dev") {
      return Response.redirect("https://rekupuri.com" + _u.pathname + _u.search, 301);
    }
  }
  const { request, params } = context;
  const origin = new URL(request.url).origin;
  let slug = "";
  try { slug = decodeURIComponent(String(params && params.name || params && params.slug || "")); } catch (e) {}
  slug = slug.replace(/\.html?$/i, "");

  const list = await loadList(origin);
  const n = list.find(e => !e.member && e.file.replace(/\.[^.]+$/, "") === slug);

  if (!n) {
    return new Response(
      "<!DOCTYPE html><html lang=\"ja\"><head><meta charset=\"UTF-8\"><title>ページが見つかりません|" + SITE + "</title><meta name=\"robots\" content=\"noindex\"></head>" +
      "<body style=\"font-family:sans-serif;text-align:center;padding:60px 20px\"><p>このページは見つかりませんでした。</p>" +
      "<p><a href=\"/gallery.html\">作品一覧へ</a></p></body></html>",
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
  }

  const kind = kindOf(n);
  const d = n.diff ? "(" + n.diff + ")" : "";
  const pageTitle = kind === "脳トレ"
    ? n.title + "|高齢者向け 無料脳トレプリント" + (n.answer ? "(答え付き)" : "") + "|" + SITE
    : kind === "カレンダー"
      ? n.title + "|塗り絵つき無料カレンダー|" + SITE
      : n.title + d + "|高齢者向け 無料塗り絵|" + SITE;
  const desc = kind === "脳トレ"
    ? "「" + n.title + "」の高齢者向け脳トレプリント。" + (n.genre ? "ジャンル: " + n.genre + "。" : "") + (n.answer ? "答え付き。" : "") + "無料でA4印刷できます。デイサービス・介護施設のレクリエーションに。"
    : kind === "カレンダー"
      ? "「" + n.title + "」の塗り絵つき月間カレンダー。無料でA4印刷できます。"
      : "「" + n.title + "」" + d + "の高齢者向け無料塗り絵。" + (n.season && n.season !== "通年" ? "季節: " + n.season + "。" : "") + (n.genre ? "ジャンル: " + n.genre + "。" : "") + "A4サイズで印刷して、デイサービスや介護施設のレクリエーションにそのまま使えます。";
  const img = origin + "/images/" + n.file;
  const url = origin + "/works/" + encodeURIComponent(slug);
  const backHref = kind === "脳トレ" ? "/gallery.html?page=noutore"
    : kind === "カレンダー" ? "/gallery.html?page=calendar" : "/gallery.html";
  const backLabel = kind === "脳トレ" ? "脳トレの一覧を見る"
    : kind === "カレンダー" ? "カレンダーの一覧を見る" : "塗り絵の一覧を見る";

  const tags = [];
  if (kind === "脳トレ") {
    tags.push("脳トレ");
    if (n.genre) tags.push(n.genre);
    if (n.answer) tags.push("答え付き");
  } else if (kind === "カレンダー") {
    tags.push("カレンダー");
  } else {
    if (n.season) tags.push(n.season);
    if (n.genre) tags.push(n.genre);
    if (n.diff) tags.push(n.diff);
  }

  const ld = {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    "name": n.title,
    "contentUrl": img,
    "url": url,
    "description": desc,
    "isAccessibleForFree": true,
    "inLanguage": "ja"
  };

  const html = "<!DOCTYPE html>\n<html lang=\"ja\">\n<head>\n" +
    "<meta charset=\"UTF-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
    "<title>" + esc(pageTitle) + "</title>\n" +
    "<meta name=\"description\" content=\"" + esc(desc) + "\">\n" +
    "<link rel=\"canonical\" href=\"" + esc(url) + "\">\n" +
    "<meta property=\"og:type\" content=\"article\">\n" +
    "<meta property=\"og:site_name\" content=\"" + SITE + "\">\n" +
    "<meta property=\"og:title\" content=\"" + esc(pageTitle) + "\">\n" +
    "<meta property=\"og:description\" content=\"" + esc(desc) + "\">\n" +
    "<meta property=\"og:url\" content=\"" + esc(url) + "\">\n" +
    "<meta property=\"og:image\" content=\"" + esc(img) + "\">\n" +
    "<link rel=\"icon\" href=\"/favicon.ico\" sizes=\"48x48\">\n" +
    "<script type=\"application/ld+json\">" + JSON.stringify(ld) + "</script>\n" +
    "<style>\n" +
    "body{font-family:\"Hiragino Maru Gothic ProN\",\"BIZ UDGothic\",\"Yu Gothic\",\"Meiryo\",sans-serif;background:#faf6ef;color:#3a3a3a;line-height:1.7;margin:0}\n" +
    "header{background:#fff;border-bottom:3px solid #e8833a;padding:16px 20px;text-align:center}\n" +
    "header img{max-width:min(70%,340px);height:auto}\n" +
    ".wrap{max-width:760px;margin:0 auto;padding:20px 16px 50px}\n" +
    "h1{font-size:22px;color:#6b5535;margin:14px 0 6px}\n" +
    ".tags{margin:4px 0 14px}\n" +
    ".tag{display:inline-block;font-size:13px;border-radius:6px;padding:2px 10px;background:#fbe3cf;color:#a05b1e;margin-right:6px}\n" +
    ".pic{background:#fff;border:1px solid #e5ddd0;border-radius:14px;padding:10px;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,.05)}\n" +
    ".pic img{max-width:100%;height:auto;border-radius:6px}\n" +
    "p.txt{font-size:15px;color:#6b6455;margin:14px 0}\n" +
    ".btns{display:flex;gap:10px;flex-wrap:wrap;margin:16px 0}\n" +
    ".btns a{flex:1;min-width:150px;text-align:center;font-size:16px;font-weight:bold;padding:12px 10px;border-radius:10px;text-decoration:none}\n" +
    ".b1{background:#e8833a;color:#fff}\n.b2{background:#6b8f7a;color:#fff}\n.b3{background:#fff;border:2px solid #e8833a;color:#e8833a}\n" +
    "footer{text-align:center;font-size:13px;color:#8a8477;padding:26px 16px;border-top:1px solid #e5ddd0}\n" +
    "footer a{color:#e8833a}\n" +
    "</style>\n</head>\n<body>\n" +
    "<header><a href=\"/\"><img src=\"/logo.png\" alt=\"" + SITE + "\"></a></header>\n" +
    "<div class=\"wrap\">\n" +
    "<h1>" + esc(n.title) + (kind === "塗り絵" && n.diff ? "(" + esc(n.diff) + ")" : "") + "</h1>\n" +
    "<div class=\"tags\">" + tags.map(t => '<span class="tag">' + esc(t) + "</span>").join("") + "</div>\n" +
    "<div class=\"pic\"><img src=\"" + esc("/images/" + n.file) + "\" alt=\"" + esc(n.title + (kind === "脳トレ" ? " 脳トレプリント" : " 塗り絵")) + "\"></div>\n" +
    "<p class=\"txt\">" + esc(desc) + "</p>\n" +
    "<div class=\"btns\">\n" +
    "<a class=\"b1\" href=\"" + esc("/images/" + n.file) + "\" download=\"" + esc(n.title + (n.diff && kind !== "脳トレ" ? "(" + n.diff + ")" : "")) + esc(n.file.substring(n.file.lastIndexOf("."))) + "\">💾 この" + (kind === "脳トレ" ? "プリント" : kind === "カレンダー" ? "カレンダー" : "塗り絵") + "を保存</a>\n" +
    (n.answer ? "<a class=\"b2\" href=\"" + esc("/images/" + n.answer) + "\" download=\"" + esc(n.title + " 答え") + esc(n.answer.substring(n.answer.lastIndexOf("."))) + "\">💾 答えを保存</a>\n" : "") +
    "<a class=\"b3\" href=\"" + backHref + "\">" + backLabel + " →</a>\n" +
    "</div>\n" +
    "<p class=\"txt\">保存した画像をA4サイズで印刷すると、そのままレクリエーションで使えます。ほかにも塗り絵・脳トレ・カレンダーを無料で配布しています。</p>\n" +
    "</div>\n" +
    "<footer><a href=\"/\">" + SITE + "</a> — 高齢者向けの無料塗り絵・脳トレ・カレンダー素材</footer>\n" +
    "</body>\n</html>";

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=600"
    }
  });
}
