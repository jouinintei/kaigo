// 予告（作成中）の素材を先行保存するためのアンケート。
// POST: 回答を非公開リポジトリの data/survey.json に記録し、その素材を保存・印刷するための合言葉(t)を返す（3時間有効）
// GET : 回答の一覧（survey.html から。STATS_KEY が必要）
// 使う環境変数: GITHUB_TOKEN, MEMBER_REPO, STATS_KEY

const FILE_PATH = "data/survey.json";
const KEEP = 5000;
const OPT = {
  place: ["デイサービス・デイケア", "特養・老健などの入所施設", "グループホーム", "有料老人ホーム・サ高住", "病院", "ご家庭", "その他"],
  state: ["ほぼご自分で塗れる", "声かけ・見守りがあれば塗れる", "手伝いが必要", "その他"],
  from: ["Google・Yahoo!などの検索", "Instagram", "note", "職場の人・知り合いから", "職場のパソコンのお気に入りなど", "その他"],
  diff: ["ちょうどいい", "もっと簡単なものを増やしてほしい", "もっと難しいものを増やしてほしい", "いろいろな難しさがほしい", "その他"],
  line: ["今くらいでいい", "もっと太い方がいい", "もっと細くていい", "その他"]
};
const MULTI = { state: 1 };
const enc = new TextEncoder();
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
async function hmac(key, msg) {
  const k = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return await crypto.subtle.sign("HMAC", k, enc.encode(msg));
}
async function signPass(env, file, exp) {
  return exp + "." + hex(await hmac(String(env.STATS_KEY || env.R2_SECRET_ACCESS_KEY || ""), "pre|" + file + "|" + exp)).slice(0, 40);
}
async function findPre(request, f) {
  const r = await fetch(new URL("/data.js", request.url).toString(), { cf: { cacheTtl: 60 } });
  if (!r.ok) return null;
  const txt = await r.text();
  for (const blk of txt.match(/\{[^{}]*\bpre:\s*1\b[^{}]*\}/g) || []) {
    const get = k => { const m = blk.match(new RegExp(k + ':\\s*"([^"]*)"')); return m ? m[1] : ""; };
    if ([get("file"), get("sample"), get("answer")].includes(f)) return { file: get("file"), title: get("title") };
  }
  return null;
}

const cleanRepo = r => String(r || "").replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "").replace(/^\/+|\/+$/g, "");
const ghHeaders = env => ({
  "Authorization": "Bearer " + String(env.GITHUB_TOKEN || "").trim(),
  "Accept": "application/vnd.github+json",
  "User-Agent": "rekupuri-survey-fn",
  "X-GitHub-Api-Version": "2022-11-28"
});
function b64encodeUtf8(str) { let bin = ""; new TextEncoder().encode(str).forEach(b => { bin += String.fromCharCode(b); }); return btoa(bin); }
function b64decodeUtf8(b64) { const bin = atob(String(b64).replace(/\n/g, "")); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return new TextDecoder().decode(a); }
async function ghRead(env) {
  const r = await fetch("https://api.github.com/repos/" + cleanRepo(env.MEMBER_REPO) + "/contents/" + FILE_PATH, { headers: ghHeaders(env) });
  if (r.status === 404) return { sha: null, items: [] };
  if (!r.ok) throw new Error("gh_get_" + r.status);
  const j = await r.json();
  let items = [];
  try { items = JSON.parse(b64decodeUtf8(j.content || "")); } catch (e) {}
  return { sha: j.sha, items: Array.isArray(items) ? items : [] };
}
function ghWrite(env, sha, items, msg) {
  const body = { message: msg, content: b64encodeUtf8(JSON.stringify(items, null, 1)) };
  if (sha) body.sha = sha;
  return fetch("https://api.github.com/repos/" + cleanRepo(env.MEMBER_REPO) + "/contents/" + FILE_PATH, {
    method: "PUT", headers: Object.assign(ghHeaders(env), { "Content-Type": "application/json" }), body: JSON.stringify(body)
  });
}
const json = (obj, status) => new Response(JSON.stringify(obj), {
  status: status || 200,
  headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" }
});

export async function onRequest({ request, env }) {
  if (request.method === "GET") {
    const url = new URL(request.url);
    if (!env || !env.STATS_KEY || url.searchParams.get("key") !== env.STATS_KEY) return new Response("Not found", { status: 404 });
    try { return json({ ok: true, items: (await ghRead(env)).items }); }
    catch (e) { return json({ ok: false, error: String(e && e.message) }, 500); }
  }
  if (request.method !== "POST") return json({ ok: false, error: "method" }, 405);

  let b = null;
  try { b = await request.json(); } catch (e) {}
  if (!b || typeof b.f !== "string" || !b.a) return json({ ok: false }, 400);
  const a = b.a || {};
  const rec = { t: new Date().toISOString() };
  for (const k of Object.keys(OPT)) {
    let v = a[k];
    if (MULTI[k]) { if (!Array.isArray(v)) return json({ ok: false, error: "answer" }, 400); v = [...new Set(v)].filter(x => OPT[k].includes(x)); if (!v.length) return json({ ok: false, error: "answer" }, 400); }
    else if (!OPT[k].includes(v)) return json({ ok: false, error: "answer" }, 400);
    rec[k] = v;
    if ([].concat(v).includes("その他")) rec[k + "_o"] = String(a[k + "_o"] || "").trim().slice(0, 80);
  }
  rec.want = String(a.want || "").trim().slice(0, 100);
  rec.good = String(a.good || "").trim().slice(0, 100);
  const it = await findPre(request, b.f.slice(0, 200));
  if (!it) return json({ ok: false, error: "not_pre" }, 404);
  rec.f = it.file; rec.title = it.title;

  if (env && env.GITHUB_TOKEN && env.MEMBER_REPO) {
    for (let i = 0; i < 3; i++) {
      try {
        const cur = await ghRead(env);
        cur.items.push(rec);
        if (cur.items.length > KEEP) cur.items.splice(0, cur.items.length - KEEP);
        const r = await ghWrite(env, cur.sha, cur.items, "アンケート回答");
        if (r.ok) break;
        if (r.status !== 409 && r.status !== 422) break;
      } catch (e) { break; }
    }
  }
  const exp = Date.now() + 3 * 3600e3;
  return json({ ok: true, t: await signPass(env, it.file, exp) });
}
