// 保存回数の記録API
// 置き場所: functions/api/log-save.js
// 使う環境変数: GITHUB_TOKEN, MEMBER_REPO, STATS_KEY (設定済みのものを再利用)

const FILE_PATH = "data/save-log.json";
const KEEP_DAYS = 120;
const KEEP_EVENTS = 300;
const KEEP_DEV_FILES = 200;

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

function blankFav() {
  return { days: {}, tot: {}, ev: [] };
}

function blank() {
  return { totals: {}, days: {}, devs: {}, events: [], src: {}, ent: {}, dfiles: {}, fav: blankFav() };
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
  if (!data.src) data.src = {};
  if (!data.ent) data.ent = {};
  if (!data.dfiles) data.dfiles = {};
  if (!data.fav || typeof data.fav !== "object") data.fav = blankFav();
  if (!data.fav.days) data.fav.days = {};
  if (!data.fav.tot) data.fav.tot = {};
  if (!Array.isArray(data.fav.ev)) data.fav.ev = [];
  if (!data.opens || typeof data.opens !== "object") data.opens = { days: {}, tot: { lb: {}, smp: {} } };
  if (!data.opens.days) data.opens.days = {};
  if (!data.opens.tot) data.opens.tot = { lb: {}, smp: {} };
  if (!Array.isArray(data.opens.ev)) data.opens.ev = [];
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

  // 開いた記録 (POST): { opens: [["xxx.png", "lb"(塗り絵の拡大)|"smp"(色見本)], ...], did }
  let openBody = null;
  try { openBody = await request.clone().json(); } catch (e) {}
  if (openBody && Array.isArray(openBody.opens)) {
    const odid = String(openBody.did || "").replace(/[^a-z0-9]/gi, "").slice(0, 16) || "unknown";
    const ops = openBody.opens
      .filter(x => Array.isArray(x) && typeof x[0] === "string" && x[0].length > 0 && x[0].length < 200 && (x[1] === "lb" || x[1] === "smp"))
      .slice(0, 60);
    if (!ops.length) return json({ ok: false });
    const onow = Date.now();
    const oday = new Date(onow + 9 * 3600 * 1000).toISOString().slice(0, 10);
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const cur = await ghRead(env);
        const O = cur.data.opens;
        if (!O.days[oday]) O.days[oday] = { lb: {}, smp: {} };
        const D = O.days[oday];
        ops.forEach(([f, k]) => {
          D[k][odid] = (D[k][odid] || 0) + 1;
          if (!O.tot[k]) O.tot[k] = {};
          O.tot[k][f] = (O.tot[k][f] || 0) + 1;
          O.ev.push({ t: onow, f: f, k: k, d: odid });
        });
        // 今日と昨日(日本時間)の分はすべて残す。それより古い記録は消す（念のため上限5000件）
        const keepFrom = Date.parse(oday + "T00:00:00+09:00") - 24 * 3600 * 1000;
        O.ev = O.ev.filter(e => e.t >= keepFrom);
        if (O.ev.length > 5000) O.ev = O.ev.slice(O.ev.length - 5000);
        const ok = Object.keys(O.days).sort();
        while (ok.length > KEEP_DAYS) delete O.days[ok.shift()];
        if (await ghWrite(env, cur.sha, cur.data)) return json({ ok: true });
      } catch (e) {}
    }
    return json({ ok: false }, 500);
  }

  // ☆の記録 (POST): { favs: [["xxx.png", 1(付けた)|0(外した), "ページ"], ...], did: "端末の符号" }
  let favBody = null;
  try { favBody = await request.clone().json(); } catch (e) {}
  if (favBody && Array.isArray(favBody.favs)) {
    const fdid = String(favBody.did || "").replace(/[^a-z0-9]/gi, "").slice(0, 16) || "unknown";
    const favs = favBody.favs
      .filter(x => Array.isArray(x) && typeof x[0] === "string" && x[0].length > 0 && x[0].length < 200)
      .slice(0, 60)
      .map(x => [x[0], x[1] ? 1 : 0, String(x[2] || "").replace(/[^a-z]/g, "").slice(0, 12)]);
    if (!favs.length) return json({ ok: false });
    const fnow = Date.now();
    const fday = new Date(fnow + 9 * 3600 * 1000).toISOString().slice(0, 10);
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const cur = await ghRead(env);
        const F = cur.data.fav;
        if (!F.days[fday]) F.days[fday] = { add: 0, rm: 0, devs: {} };
        const D = F.days[fday];
        favs.forEach(([f, on, pg]) => {
          if (on) { D.add++; F.tot[f] = (F.tot[f] || 0) + 1; } else D.rm++;
          D.devs[fdid] = (D.devs[fdid] || 0) + 1;
          const ev = { t: fnow, f: f, d: fdid, on: on };
          if (pg) ev.p = pg;
          F.ev.push(ev);
        });
        if (F.ev.length > KEEP_EVENTS) F.ev = F.ev.slice(F.ev.length - KEEP_EVENTS);
        const fk = Object.keys(F.days).sort();
        while (fk.length > KEEP_DAYS) delete F.days[fk.shift()];
        if (await ghWrite(env, cur.sha, cur.data)) return json({ ok: true });
      } catch (e) {}
    }
    return json({ ok: false }, 500);
  }

  // 記録 (POST): { files: ["xxx.png", ...], did: "端末の符号" }
  let files = [];
  let did = "";
  let srcs = [];
  let ctxs = [];
  let ent = null;
  try {
    const b = await request.json();
    files = Array.isArray(b.files) ? b.files : [];
    srcs = Array.isArray(b.srcs) ? b.srcs : [];
    ctxs = Array.isArray(b.ctxs) ? b.ctxs : [];
    if (b.ent && typeof b.ent === "object") {
      const k = String(b.ent.k || "").replace(/[^a-z]/g, "").slice(0, 10);
      const h = String(b.ent.h || "").toLowerCase().replace(/[^a-z0-9.-]/g, "").slice(0, 40);
      if (k) ent = k === "other" && h ? "o:" + h : k;
    }
    did = String(b.did || "").replace(/[^a-z0-9]/gi, "").slice(0, 16);
  } catch (e) {}
  const cleanCtx = c => {
    if (!c || typeof c !== "object") return null;
    const o = {};
    ["se", "ge", "di", "us", "q", "sr"].forEach(k => {
      if (typeof c[k] === "string" && c[k].trim()) o[k] = c[k].trim().slice(0, 30);
    });
    return o;
  };
  const items = files.map((f, i) => [f, String(srcs[i] || "unknown").replace(/[^a-z]/g, "").slice(0, 12) || "unknown", cleanCtx(ctxs[i])])
    .filter(x => typeof x[0] === "string" && x[0].length > 0 && x[0].length < 200).slice(0, 60);
  files = items.map(x => x[0]);
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
      if (!d.src[day]) d.src[day] = {};
      if (ent) {
        if (!d.ent[did]) d.ent[did] = {};
        d.ent[did][ent] = (d.ent[did][ent] || 0) + 1;
      }
      items.forEach(([f, s, c], i) => {
        d.src[day][s] = (d.src[day][s] || 0) + 1;
        d.totals[f] = (d.totals[f] || 0) + 1;
        d.days[day][f] = (d.days[day][f] || 0) + 1;
        d.devs[day][did] = (d.devs[day][did] || 0) + 1;
        const ev = { t: now, f: f, d: did, s: s };
        if (c) ev.c = c;
        if (ent && i === 0) ev.r = ent;
        d.events.push(ev);
        if (!d.dfiles[did]) d.dfiles[did] = {};
        const df = d.dfiles[did][f] || [0, 0];
        d.dfiles[did][f] = [df[0] + 1, now];
      });
      Object.keys(d.dfiles).forEach(id => {
        const fs = Object.keys(d.dfiles[id]);
        if (fs.length > KEEP_DEV_FILES) {
          fs.sort((a, b) => d.dfiles[id][b][1] - d.dfiles[id][a][1]).slice(KEEP_DEV_FILES).forEach(x => delete d.dfiles[id][x]);
        }
      });
      if (d.events.length > KEEP_EVENTS) d.events = d.events.slice(d.events.length - KEEP_EVENTS);
      const keys = Object.keys(d.days).sort();
      while (keys.length > KEEP_DAYS) {
        const old = keys.shift();
        delete d.days[old];
        delete d.devs[old];
        delete d.src[old];
      }
      if (await ghWrite(env, cur.sha, d)) return json({ ok: true });
    } catch (e) {}
  }
  return json({ ok: false }, 500);
}
