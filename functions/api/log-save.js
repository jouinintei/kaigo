// 保存回数の記録API
// 置き場所: functions/api/log-save.js
// 使う環境変数: GITHUB_TOKEN, MEMBER_REPO, STATS_KEY (設定済みのものを再利用)

const FILE_PATH = "data/save-log.json";
const KEEP_DAYS = 120;

function cleanRepo(r) {
  return String(r || "")
    .replace(/^https?:\/\/github\.com\//, "")
    .replace(/\.git$/, "")
    .replace(/^\/+|\/+$/g, "");
}

function ghHeaders(env) {
  return {
    "Authorization": "Bearer " + env.GITHUB_TOKEN,
    "Accept": "application/vnd.github+json",
    "User-Agent": "rekupuri-pages"
  };
}

async function ghRead(env) {
  const repo = cleanRepo(env.MEMBER_REPO);
  const r = await fetch("https://api.github.com/repos/" + repo + "/contents/" + FILE_PATH, { headers: ghHeaders(env) });
  if (r.status === 404) return { sha: null, data: { totals: {}, days: {} } };
  if (!r.ok) throw new Error("github read " + r.status);
  const j = await r.json();
  let data = { totals: {}, days: {} };
  try {
    data = JSON.parse(decodeURIComponent(escape(atob(String(j.content || "").replace(/\n/g, "")))));
  } catch (e) {}
  if (!data.totals) data.totals = {};
  if (!data.days) data.days = {};
  return { sha: j.sha, data: data };
}

async function ghWrite(env, sha, data) {
  const repo = cleanRepo(env.MEMBER_REPO);
  const body = {
    message: "save-log update",
    content: btoa(unescape(encodeURIComponent(JSON.stringify(data))))
  };
  if (sha) body.sha = sha;
  const r = await fetch("https://api.github.com/repos/" + repo + "/contents/" + FILE_PATH, {
    method: "PUT",
    headers: Object.assign(ghHeaders(env), { "Content-Type": "application/json" }),
    body: JSON.stringify(body)
  });
  return r.ok;
}

function json(obj, status) {
  return new Response(JSON.stringify(obj, null, 1), {
    status: status || 200,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" }
  });
}

export async function onRequest({ request, env }) {
  // 集計の閲覧 (GET): keyが必要
  if (request.method === "GET") {
    const url = new URL(request.url);
    if (!env.STATS_KEY || url.searchParams.get("key") !== env.STATS_KEY) {
      return new Response("Not found", { status: 404 });
    }
    try {
      const cur = await ghRead(env);
      return json(cur.data);
    } catch (e) {
      return json({ error: String(e) }, 500);
    }
  }

  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });

  // 記録 (POST): { files: ["xxx.png", ...] }
  let files = [];
  try {
    const b = await request.json();
    files = Array.isArray(b.files) ? b.files : [];
  } catch (e) {}
  files = files.filter(f => typeof f === "string" && f.length > 0 && f.length < 200).slice(0, 60);
  if (!files.length) return json({ ok: false });

  const day = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const cur = await ghRead(env);
      const d = cur.data;
      if (!d.days[day]) d.days[day] = {};
      files.forEach(f => {
        d.totals[f] = (d.totals[f] || 0) + 1;
        d.days[day][f] = (d.days[day][f] || 0) + 1;
      });
      const keys = Object.keys(d.days).sort();
      while (keys.length > KEEP_DAYS) delete d.days[keys.shift()];
      if (await ghWrite(env, cur.sha, d)) return json({ ok: true });
    } catch (e) {}
  }
  return json({ ok: false }, 500);
}
