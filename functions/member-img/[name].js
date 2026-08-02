// 配達係: 通行証(クッキー)を確認し、本物なら非公開リポジトリから会員画像を取り出して渡す
// 必要な環境変数: MEMBER_PASSWORD, MEMBER_SECRET, GITHUB_TOKEN, MEMBER_REPO (例: jouinintei/rekupuri-member)

async function hmacHex(message, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function onRequest(context) {
  const { request, env, params } = context;

  if (!env || !env.MEMBER_PASSWORD || !env.MEMBER_SECRET || !env.GITHUB_TOKEN || !env.MEMBER_REPO) {
    return new Response("server_not_configured", { status: 500 });
  }

  // 1) 通行証の検認
  const cookie = request.headers.get("Cookie") || "";
  const m = cookie.match(/(?:^|;\s*)rk_member=([a-f0-9]{64})/);
  const expected = await hmacHex("member|" + env.MEMBER_PASSWORD, env.MEMBER_SECRET);
  if (!m || m[1] !== expected) {
    return new Response("会員専用です", { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  // 2) ファイル名の安全確認 (英数字・ドット・ハイフン・アンダースコアのみ)
  const name = decodeURIComponent(params && params.name ? String(params.name) : "");
  if (!/^[A-Za-z0-9_\-]+\.(png|jpg|jpeg|gif|webp)$/i.test(name)) {
    return new Response("bad name", { status: 400 });
  }

  // 3) 非公開リポジトリから画像を取得
  const gh = await fetch(
    "https://api.github.com/repos/" + env.MEMBER_REPO + "/contents/images/" + name,
    {
      headers: {
        "Authorization": "Bearer " + env.GITHUB_TOKEN,
        "Accept": "application/vnd.github.raw",
        "User-Agent": "rekupuri-member-fn",
        "X-GitHub-Api-Version": "2022-11-28"
      }
    }
  );
  if (!gh.ok) {
    return new Response("not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  const ext = name.split(".").pop().toLowerCase();
  const type = (ext === "jpg" || ext === "jpeg") ? "image/jpeg"
    : ext === "gif" ? "image/gif"
    : ext === "webp" ? "image/webp"
    : "image/png";
  return new Response(gh.body, {
    status: 200,
    headers: {
      "Content-Type": type,
      "Cache-Control": "private, max-age=3600"
    }
  });
}
