// 保存回数の記録API
// 置き場所: functions/api/log-save.js
// 使う環境変数: GITHUB_TOKEN, MEMBER_REPO, STATS_KEY (設定済みのものを再利用)

const FILE_PATH = "data/save-log.json";
const KEEP_DAYS = 120;
const KEEP_EVENTS = 300;

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

function blank() {
  return { totals: {}, days: {}, devs: {}, events: [] };
}

async function ghRead(env) {
  const repo = cleanRepo(env.MEMBER_REPO);
  const r = await fetch("https://api.github.com/repos/" + repo + "/contents/" + FILE_PATH, { headers: ghHeaders(env) });
  if (r.status === 404) return { sha: null, data: blank() };
  if (!r.ok) throw new Error("github read " + r.status);
  const j = await r.json();
  let data = blank();
  try {
    data = JSON.parse(decodeURIComponent(escape(atob(String(j.content || "").replace(/\n/g, "")))));
  } catch (e) {}
  if (!data.totals) data.totals = {};
  if (!data.days) data.days = {};
  if (!data.devs) data.devs = {};
  if (!Array.isArray(data.events)) data.events = [];
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

  // 記録 (POST): { files: ["xxx.png", ...], did: "端末の符号" }
  let files = [];
  let did = "";
  try {
    const b = await request.json();
    files = Array.isArray(b.files) ? b.files : [];
    did = String(b.did || "").replace(/[^a-z0-9]/gi, "").slice(0, 16);
  } catch (e) {}
  files = files.filter(f => typeof f === "string" && f.length > 0 && f.length < 200).slice(0, 60);
  if (!files.length) return json({ ok: false });
  if (!did) did = "unknown";

  const now = Date.now();
  const day = new Date(now + 9 * 3600 * 1000).toISOString().slice(0, 10);

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const cur = await ghRead(env);
      const d = cur.data;
      if (!d.days[day]) d.days[day] = {};
      if (!d.devs[day]) d.devs[day] = {};
      files.forEach(f => {
        d.totals[f] = (d.totals[f] || 0) + 1;
        d.days[day][f] = (d.days[day][f] || 0) + 1;
        d.devs[day][did] = (d.devs[day][did] || 0) + 1;
        d.events.push({ t: now, f: f, d: did });
      });
      if (d.events.length > KEEP_EVENTS) d.events = d.events.slice(d.events.length - KEEP_EVENTS);
      const keys = Object.keys(d.days).sort();
      while (keys.length > KEEP_DAYS) {
        const old = keys.shift();
        delete d.days[old];
        delete d.devs[old];
      }
      if (await ghWrite(env, cur.sha, d)) return json({ ok: true });
    } catch (e) {}
  }
  return json({ ok: false }, 500);
}
