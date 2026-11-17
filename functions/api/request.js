const FILE_PATH = "data/requests.json";
const KEEP = 3000;
const OPT = {
  kind: ["塗り絵", "脳トレ", "カレンダー"],
  season: ["春", "夏", "秋", "冬", "通年"],
  line: ["細め", "ふつう", "太め"],
  comp: ["大きく1つ", "背景・風景あり", "いくつか並べる"],
  diff: ["初級", "中級", "上級"],
  dir: ["縦向き", "横向き"]
};

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
    "User-Agent": "rekupuri-request-fn",
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

  if (request.method === "GET") {
    const url = new URL(request.url);
    if (!env.STATS_KEY || url.searchParams.get("key") !== env.STATS_KEY) return new Response("Not found", { status: 404 });
    try { const cur = await ghRead(env); return json({ ok: true, items: cur.items }); }
    catch (e) { return json({ ok: false, error: String(e && e.message) }, 500); }
  }

  if (request.method !== "POST") return json({ ok: false, error: "method" }, 405);

  let b = null;
  try { b = await request.json(); } catch (e) {}
  if (!b) return json({ ok: false }, 400);
  const q = String(b.q || "").replace(/\s+/g, " ").trim().slice(0, 60);
  if (!q) return json({ ok: false, error: "empty" }, 400);
  const item = { t: new Date().toISOString(), q: q };
  Object.keys(OPT).forEach(k => {
    const v = (Array.isArray(b[k]) ? b[k] : [b[k]]).map(x => String(x || "")).filter(x => OPT[k].includes(x));
    if (v.length) item[k] = k === "kind" ? v[0] : [...new Set(v)];
  });
  const g = (Array.isArray(b.genre) ? b.genre : []).map(x => String(x || "").trim().slice(0, 12)).filter(Boolean).slice(0, 12);
  if (g.length) item.genre = [...new Set(g)];
  const memo = String(b.memo || "").trim().slice(0, 200);
  if (memo) item.memo = memo;
  const p = String(b.p || "").slice(0, 80);
  if (p) item.p = p;
  item.d = String(b.did || "").replace(/[^a-z0-9]/gi, "").slice(0, 16) || "unknown";

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const cur = await ghRead(env);
      const items = cur.items;
      items.push(item);
      if (items.length > KEEP) items.splice(0, items.length - KEEP);
      const r = await ghWrite(env, cur.sha, items, "リクエスト: " + q.slice(0, 30));
      if (r.ok) return json({ ok: true });
      if (r.status === 409 || r.status === 422) continue;
      return json({ ok: false, error: "gh_" + r.status }, 500);
    } catch (e) {}
  }
  return json({ ok: false, error: "conflict" }, 500);
}
