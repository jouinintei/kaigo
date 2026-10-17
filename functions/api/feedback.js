// 👍👎の声を非公開リポジトリの data/feedback.json に記録する
// 使う環境変数: GITHUB_TOKEN, MEMBER_REPO, STATS_KEY (設定済みのものを再利用)

const FILE_PATH = "data/feedback.json";
const KEEP = 3000;

function cleanRepo(r) {
  return String(r || "")
    .replace(/^https?:\/\/github\.com\//, "")
    .replace(/\.git$/, "")
    .replace(/^\/+|\/+$/g, "");
}

function ghHeaders(env) {
  return {
    "Authorization": "Bearer " + String(env.GITHUB_TOKEN || "").trim(),
    "Accept": "application/vnd.github+json",
    "User-Agent": "rekupuri-feedback-fn",
    "X-GitHub-Api-Version": "2022-11-28"
  };
}

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

async function ghRead(env) {
  const repo = cleanRepo(env.MEMBER_REPO);
  const r = await fetch("https://api.github.com/repos/" + repo + "/contents/" + FILE_PATH, { headers: ghHeaders(env) });
  if (r.status === 404) return { sha: null, items: [] };
  if (!r.ok) throw new Error("gh_get_" + r.status);
  const j = await r.json();
  let items = [];
  try { items = JSON.parse(b64decodeUtf8(j.content || "")); } catch (e) {}
  if (!Array.isArray(items)) items = [];
  return { sha: j.sha, items };
}

async function ghWrite(env, sha, items, msg) {
  const repo = cleanRepo(env.MEMBER_REPO);
  const body = { message: msg, content: b64encodeUtf8(JSON.stringify(items, null, 1)) };
  if (sha) body.sha = sha;
  return fetch("https://api.github.com/repos/" + repo + "/contents/" + FILE_PATH, {
    method: "PUT",
    headers: Object.assign(ghHeaders(env), { "Content-Type": "application/json" }),
    body: JSON.stringify(body)
  });
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" }
  });
}

export async function onRequest({ request, env }) {
  if (!env || !env.GITHUB_TOKEN || !env.MEMBER_REPO) return json({ ok: false, error: "server_not_configured" }, 500);

  // 閲覧 (GET): 保存ログ画面から。STATS_KEY が必要
  if (request.method === "GET") {
    const url = new URL(request.url);
    if (!env.STATS_KEY || url.searchParams.get("key") !== env.STATS_KEY) {
      return new Response("Not found", { status: 404 });
    }
    try {
      const cur = await ghRead(env);
      return json({ ok: true, items: cur.items });
    } catch (e) {
      return json({ ok: false, error: String(e && e.message) }, 500);
    }
  }

  if (request.method !== "POST") return json({ ok: false, error: "method" }, 405);

  // 記録 (POST): { f: "ファイル名", v: "up" | "down", c: "コメント(任意)", did: "端末の符号" }
  let b = null;
  try { b = await request.json(); } catch (e) {}
  if (!b) return json({ ok: false }, 400);
  const f = String(b.f || "").trim();
  const v = b.v === "up" || b.v === "down" ? b.v : "";
  const c = String(b.c || "").trim().slice(0, 300);
  const d = String(b.did || "").replace(/[^a-z0-9]/gi, "").slice(0, 16) || "unknown";
  if (!f || f.length > 200 || !v) return json({ ok: false }, 400);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const cur = await ghRead(env);
      const items = cur.items;
      // 同じ端末が同じ絵に押したものは1件にまとめる(押し直し・コメント追加は上書き)
      const i = d === "unknown" ? -1 : items.findIndex(x => x.f === f && x.d === d);
      const now = new Date().toISOString();
      if (i >= 0) {
        const old = items[i];
        items.splice(i, 1);
        items.push({ t: now, f: f, v: v, c: c || (old.v === v ? old.c || "" : ""), d: d });
      } else {
        items.push({ t: now, f: f, v: v, c: c, d: d });
      }
      if (items.length > KEEP) items.splice(0, items.length - KEEP);
      const r = await ghWrite(env, cur.sha, items, (v === "up" ? "👍" : "👎") + (c ? " コメントあり" : ""));
      if (r.ok) return json({ ok: true });
      if (r.status === 409 || r.status === 422) continue;
      return json({ ok: false, error: "gh_" + r.status }, 500);
    } catch (e) {}
  }
  return json({ ok: false, error: "conflict" }, 500);
}
