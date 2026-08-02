// 会員申請カウンター: 押された回数を非公開リポジトリの data/apply-count.json に記録する
// 必要な環境変数: GITHUB_TOKEN (rekupuri-memberのContents: Read and write), MEMBER_REPO

function cleanRepo(v) {
  let s = String(v || "").trim();
  s = s.replace(/^https?:\/\/github\.com\//i, "");
  s = s.replace(/^\/+|\/+$/g, "");
  s = s.replace(/\.git$/i, "");
  return s;
}

const FILE_PATH = "data/apply-count.json";

async function ghGet(repo, token) {
  const r = await fetch("https://api.github.com/repos/" + repo + "/contents/" + FILE_PATH, {
    headers: {
      "Authorization": "Bearer " + token,
      "Accept": "application/vnd.github+json",
      "User-Agent": "rekupuri-apply-fn",
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });
  if (r.status === 404) return { data: { count: 0, log: [] }, sha: null };
  if (!r.ok) throw new Error("gh_get_" + r.status);
  const j = await r.json();
  let data = { count: 0, log: [] };
  try {
    data = JSON.parse(atob(String(j.content || "").replace(/\n/g, "")));
  } catch (e) {}
  if (typeof data.count !== "number") data.count = 0;
  if (!Array.isArray(data.log)) data.log = [];
  return { data, sha: j.sha };
}

async function ghPut(repo, token, data, sha) {
  const body = {
    message: "会員申請 +1 (計" + data.count + "件)",
    content: btoa(JSON.stringify(data, null, 2))
  };
  if (sha) body.sha = sha;
  const r = await fetch("https://api.github.com/repos/" + repo + "/contents/" + FILE_PATH, {
    method: "PUT",
    headers: {
      "Authorization": "Bearer " + token,
      "Accept": "application/vnd.github+json",
      "User-Agent": "rekupuri-apply-fn",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  return r;
}

export async function onRequest(context) {
  const { request, env } = context;
  const headers = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "method" }), { status: 405, headers });
  }

  const token = String((env && env.GITHUB_TOKEN) || "").trim();
  const repo = cleanRepo(env && env.MEMBER_REPO);
  if (!token || !repo) {
    return new Response(JSON.stringify({ ok: false, error: "server_not_configured" }), { status: 500, headers });
  }

  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      const { data, sha } = await ghGet(repo, token);
      data.count += 1;
      data.log.push(new Date().toISOString());
      if (data.log.length > 300) data.log = data.log.slice(-300);
      const r = await ghPut(repo, token, data, sha);
      if (r.ok) {
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
      }
      if (r.status === 409 || r.status === 422) continue; // 競合したら読み直して1回だけ再挑戦
      if (r.status === 403 || r.status === 404) {
        // 書き込み権限がない(トークンがRead-onlyのまま)可能性が高い
        return new Response(JSON.stringify({ ok: false, error: "not_writable_gh" + r.status }), { status: 500, headers });
      }
      break;
    }
    return new Response(JSON.stringify({ ok: false, error: "conflict" }), { status: 500, headers });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e && e.message) }), { status: 500, headers });
  }
}
