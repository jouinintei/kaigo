// 名簿係: 通行証(クッキー)を確認し、本物なら非公開リポジトリから会員作品リストを渡す
// 必要な環境変数: MEMBER_PASSWORD, MEMBER_SECRET, GITHUB_TOKEN, MEMBER_REPO (追加設定は不要・既存のものを使う)

async function hmacHex(message, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function cleanRepo(v) {
  let s = String(v || "").trim();
  s = s.replace(/^https?:\/\/github\.com\//i, "");
  s = s.replace(/^\/+|\/+$/g, "");
  s = s.replace(/\.git$/i, "");
  return s;
}

const FILE_PATH = "data/member-list.js";

export async function onRequest(context) {
  const { request, env } = context;
  const headers = { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" };

  const password = String((env && env.MEMBER_PASSWORD) || "").trim();
  const secret = String((env && env.MEMBER_SECRET) || "").trim();
  const token = String((env && env.GITHUB_TOKEN) || "").trim();
  const repo = cleanRepo(env && env.MEMBER_REPO);

  if (!password || !secret || !token || !repo) {
    return new Response("server_not_configured", { status: 500, headers });
  }

  // 1) 通行証の検認 (会員以外にはリストの中身も個数も一切見せない)
  const cookie = request.headers.get("Cookie") || "";
  const m = cookie.match(/(?:^|;\s*)rk_member=([a-f0-9]{64})/);
  const expected = await hmacHex("member|" + password, secret);
  if (!m || m[1] !== expected) {
    return new Response("会員専用です", { status: 403, headers });
  }

  // 2) 非公開リポジトリからリストを取得
  let gh;
  try {
    gh = await fetch("https://api.github.com/repos/" + repo + "/contents/" + FILE_PATH, {
      headers: {
        "Authorization": "Bearer " + token,
        "Accept": "application/vnd.github.raw",
        "User-Agent": "rekupuri-member-fn",
        "X-GitHub-Api-Version": "2022-11-28"
      }
    });
  } catch (e) {
    return new Response("fetch_error", { status: 502, headers });
  }
  if (gh.status === 404) {
    // まだリストのファイルが無い → 空のリストとして返す
    return new Response("", { status: 200, headers });
  }
  if (!gh.ok) {
    return new Response("gh_error_" + gh.status, { status: 502, headers });
  }
  const body = await gh.text();
  return new Response(body, { status: 200, headers });
}
