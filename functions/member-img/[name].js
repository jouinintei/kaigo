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

function cleanRepo(v) {
  // 余分な空白・URL形式・前後のスラッシュを自動整理
  let s = String(v || "").trim();
  s = s.replace(/^https?:\/\/github\.com\//i, "");
  s = s.replace(/^\/+|\/+$/g, "");
  s = s.replace(/\.git$/i, "");
  return s;
}

export async function onRequest(context) {
  const { request, env, params } = context;

  const password = String((env && env.MEMBER_PASSWORD) || "").trim();
  const secret = String((env && env.MEMBER_SECRET) || "").trim();
  const token = String((env && env.GITHUB_TOKEN) || "").trim();
  const repo = cleanRepo(env && env.MEMBER_REPO);

  if (!password || !secret || !token || !repo) {
    return new Response("server_not_configured", { status: 500 });
  }

  // 1) 通行証の検認
  const cookie = request.headers.get("Cookie") || "";
  const m = cookie.match(/(?:^|;\s*)rk_member=([a-f0-9]{64})/);
  const expected = await hmacHex("member|" + password, secret);
  if (!m || m[1] !== expected) {
    return new Response("会員専用です", { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  // 2) ファイル名の安全確認
  const name = decodeURIComponent(params && params.name ? String(params.name) : "");
  if (!/^[A-Za-z0-9_\-]+\.(png|jpg|jpeg|gif|webp)$/i.test(name)) {
    return new Response("bad name", { status: 400 });
  }

  // 3) 非公開リポジトリから画像を取得
  let gh;
  try {
    gh = await fetch(
      "https://api.github.com/repos/" + repo + "/contents/images/" + name,
      {
        headers: {
          "Authorization": "Bearer " + token,
          "Accept": "application/vnd.github.raw",
          "User-Agent": "rekupuri-member-fn",
          "X-GitHub-Api-Version": "2022-11-28"
        }
      }
    );
  } catch (e) {
    return new Response("fetch_error: " + (e && e.message), { status: 502, headers: { "Cache-Control": "no-store" } });
  }
  if (!gh.ok) {
    // どこで失敗したか分かるように、GitHub側の状態を添えて返す
    // (gh 401=トークン不正 / gh 404=リポジトリ名・パス・権限の問題 / gh 403=権限やレート制限)
    return new Response("not found (gh " + gh.status + ", repo=" + repo + ")", {
      status: 404, headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" }
    });
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
