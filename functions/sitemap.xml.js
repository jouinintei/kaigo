// サイトマップ (検索エンジンに全ページの場所を伝えるファイル)
// data.js を読んで自動生成するので、作品を投稿すると自動で反映されます

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
    items.push({ file: get(s, "file"), added: get(s, "added"), member: flag(s, "member") });
  }
  const seen = new Set();
  return items.filter(e => e.file && !seen.has(e.file) && seen.add(e.file));
}

export async function onRequest(context) {
  const origin = new URL(context.request.url).origin;
  const list = await loadList(origin);
  const urls = [
    origin + "/",
    origin + "/gallery.html",
    origin + "/gallery.html?page=noutore",
    origin + "/gallery.html?page=calendar"
  ];
  list.filter(e => !e.member).forEach(e => {
    urls.push(origin + "/works/" + encodeURIComponent(e.file.replace(/\.[^.]+$/, "")));
  });
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map(u => "  <url><loc>" + u.replace(/&/g, "&amp;") + "</loc></url>").join("\n") +
    "\n</urlset>\n";
  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600"
    }
  });
}
