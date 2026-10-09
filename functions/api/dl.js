// functions/api/dl.js
// 画像保存の予備ルート。img.rekupuri.com(R2)の画像をサイト自身のドメイン経由で返す。
// 一部のPCでブラウザのキャッシュやセキュリティソフトが img.rekupuri.com への読み込みを邪魔して
// 「ファイルが見つかりません」になるのを防ぐ(同じドメインなのでCORSの影響を受けない)。
// 使い方: /api/dl?f=up_1234567890123_1.png&n=保存名.png

const IMG_ORIGIN = "https://img.rekupuri.com/images/";
const SAFE = /^[A-Za-z0-9_.-]{1,120}\.(png|jpe?g|webp|gif|pdf)$/i;
const TYPES = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif", pdf: "application/pdf" };

export async function onRequest({ request }) {
  if (request.method !== "GET" && request.method !== "HEAD") return new Response("method not allowed", { status: 405 });
  const u = new URL(request.url);
  const f = u.searchParams.get("f") || "";
  if (!SAFE.test(f) || f.indexOf("..") >= 0) return new Response("bad file", { status: 400 });

  let r;
  try { r = await fetch(IMG_ORIGIN + f); } catch (e) { r = null; }
  if (!r || !r.ok) return new Response("not found", { status: 404 });

  const ext = f.slice(f.lastIndexOf(".") + 1).toLowerCase();
  const h = new Headers();
  h.set("Content-Type", TYPES[ext] || "application/octet-stream");
  h.set("Cache-Control", "public, max-age=3600");
  const n = (u.searchParams.get("n") || "").replace(/[\r\n"\\\/:*?<>|]/g, "").slice(0, 150);
  if (n) {
    const ascii = f;
    h.set("Content-Disposition", "attachment; filename=\"" + ascii + "\"; filename*=UTF-8''" + encodeURIComponent(n));
  }
  return new Response(request.method === "HEAD" ? null : r.body, { status: 200, headers: h });
}
