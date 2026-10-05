// 受付係: お問い合わせ・要望を非公開リポジトリの data/contact.json に記録する
// 必要な環境変数: GITHUB_TOKEN (Contents: Read and write), MEMBER_REPO

function cleanRepo(v) {
  let s = String(v || "").trim();
  s = s.replace(/^https?:\/\/github\.com\//i, "");
  s = s.replace(/^\/+|\/+$/g, "");
  s = s.replace(/\.git$/i, "");
  return s;
}

const FILE_PATH = "data/contact.json";

function b64encodeUtf8(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin);
}

function b64decodeUtf8(b64) {
  const bin = atob(String(b64).replace(/\n/g, ""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function ghGet(repo, token) {
  const r = await fetch("https://api.github.com/repos/" + repo + "/contents/" + FILE_PATH, {
    headers: {
      "Authorization": "Bearer " + token,
      "Accept": "application/vnd.github+json",
      "User-Agent": "rekupuri-contact-fn",
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });
  if (r.status === 404) return { data: [], sha: null };
  if (!r.ok) throw new Error("gh_get_" + r.status);
  const j = await r.json();
  let data = [];
  try { data = JSON.parse(b64decodeUtf8(j.content || "")); } catch (e) {}
  if (!Array.isArray(data)) data = [];
  return { data, sha: j.sha };
}

async function ghPut(repo, token, data, sha) {
  const body = {
    message: "お問い合わせ +1 (計" + data.length + "件)",
    content: b64encodeUtf8(JSON.stringify(data, null, 2))
  };
  if (sha) body.sha = sha;
  return fetch("https://api.github.com/repos/" + repo + "/contents/" + FILE_PATH, {
    method: "PUT",
    headers: {
      "Authorization": "Bearer " + token,
      "Accept": "application/vnd.github+json",
      "User-Agent": "rekupuri-contact-fn",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

export async function onRequest(context) {
  const { request, env } = context;
  const headers = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };

  // 閲覧 (GET): 保存ログ画面から。STATS_KEY が合うときだけ内容を返す
  if (request.method === "GET") {
    const url = new URL(request.url);
    if (!env || !env.STATS_KEY || url.searchParams.get("key") !== env.STATS_KEY) {
      return new Response("Not found", { status: 404 });
    }
    const gtoken = String(env.GITHUB_TOKEN || "").trim();
    const grepo = cleanRepo(env.MEMBER_REPO);
    if (!gtoken || !grepo) {
      return new Response(JSON.stringify({ ok: false, error: "server_not_configured" }), { status: 500, headers });
    }
    try {
      const cur = await ghGet(grepo, gtoken);
      return new Response(JSON.stringify({ ok: true, items: cur.data }), { status: 200, headers });
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: String(e && e.message) }), { status: 500, headers });
    }
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "method" }), { status: 405, headers });
  }

  const token = String((env && env.GITHUB_TOKEN) || "").trim();
  const repo = cleanRepo(env && env.MEMBER_REPO);
  if (!token || !repo) {
    return new Response(JSON.stringify({ ok: false, error: "server_not_configured" }), { status: 500, headers });
  }

  let body;
  try { body = await request.json(); } catch (e) { body = null; }
  // ボット対策: 人には見えない欄に入力があれば、保存せずに成功したふりをして終える
  if (body && String(body.web || "").trim()) {
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
  }
  const text = String((body && body.text) || "").trim().slice(0, 1000);
  const from = String((body && body.from) || "").trim().slice(0, 200);
  const did = String((body && body.did) || "").replace(/[^a-z0-9]/gi, "").slice(0, 16);
  const TYPES = ["ご要望", "不具合", "その他"];
  const type = TYPES.includes(String((body && body.type) || "")) ? body.type : "その他";
  if (!text) {
    return new Response(JSON.stringify({ ok: false, error: "empty" }), { status: 400, headers });
  }

  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      const { data, sha } = await ghGet(repo, token);
      // 送信間隔の制限: 直前の受付から10秒以内は受け付けない
      const lastT = data.length ? Date.parse(data[data.length - 1].date) : 0;
      if (lastT && Date.now() - lastT < 10000) {
        return new Response(JSON.stringify({ ok: false, error: "too_fast" }), { status: 429, headers });
      }
      data.push({ date: new Date().toISOString(), type: type, text: text, from: from, d: did || "unknown" });
      if (data.length > 500) data.splice(0, data.length - 500);
      const r = await ghPut(repo, token, data, sha);
      if (r.ok) {
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
      }
      if (r.status === 409 || r.status === 422) continue;
      return new Response(JSON.stringify({ ok: false, error: "gh_" + r.status }), { status: 500, headers });
    }
    return new Response(JSON.stringify({ ok: false, error: "conflict" }), { status: 500, headers });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e && e.message) }), { status: 500, headers });
  }
}
