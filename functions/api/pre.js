// 予告（作成中）の塗り絵・脳トレの本物を返す。
// アンケートに答えたときにもらえる合言葉(t)があるか、公開日を過ぎていれば返す。
// 本物は R2 の yokoku/<ランダム>/<ファイル名> にある（.github/scripts/yokoku.py が置く）。
// 使う環境変数: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, STATS_KEY（合言葉の署名）

const ACCOUNT_ID = "f2973a9b06bd5d30be681c629f19145e";
const BUCKET = "rekupuri-img-apac";
const SAFE = /^[A-Za-z0-9_.-]{1,120}\.(png|jpe?g)$/i;
const enc = new TextEncoder();

const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
const sha256Hex = async data => hex(await crypto.subtle.digest("SHA-256", data));
async function hmac(key, msg) {
  const k = await crypto.subtle.importKey("raw", typeof key === "string" ? enc.encode(key) : key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return await crypto.subtle.sign("HMAC", k, enc.encode(msg));
}
const s3Enc = s => encodeURIComponent(s).replace(/[!'()*]/g, c => "%" + c.charCodeAt(0).toString(16).toUpperCase());

async function r2Get(env, key, query) {
  const host = ACCOUNT_ID + ".r2.cloudflarestorage.com";
  const path = "/" + BUCKET + (key ? "/" + key.split("/").map(s3Enc).join("/") : "");
  const q = Object.keys(query || {}).sort().map(k => s3Enc(k) + "=" + s3Enc(query[k])).join("&");
  const amz = new Date().toISOString().replace(/[:-]|\.\d{3}/g, ""), day = amz.slice(0, 8);
  const ph = await sha256Hex(new Uint8Array(0));
  const h = { host: host, "x-amz-content-sha256": ph, "x-amz-date": amz };
  const names = Object.keys(h).sort();
  const canonical = ["GET", path, q, names.map(n => n + ":" + h[n] + "\n").join(""), names.join(";"), ph].join("\n");
  const scope = day + "/auto/s3/aws4_request";
  const sts = ["AWS4-HMAC-SHA256", amz, scope, await sha256Hex(enc.encode(canonical))].join("\n");
  let k = await hmac("AWS4" + String(env.R2_SECRET_ACCESS_KEY).trim(), day);
  k = await hmac(k, "auto"); k = await hmac(k, "s3"); k = await hmac(k, "aws4_request");
  const sig = hex(await hmac(k, sts));
  const auth = "AWS4-HMAC-SHA256 Credential=" + String(env.R2_ACCESS_KEY_ID).trim() + "/" + scope + ", SignedHeaders=" + names.join(";") + ", Signature=" + sig;
  return fetch("https://" + host + path + (q ? "?" + q : ""), { headers: { "x-amz-content-sha256": ph, "x-amz-date": amz, "Authorization": auth } });
}

// data.js から予告の素材を探す（f は線画・色見本・答えのどれでもよい）
async function findPre(request, f) {
  const r = await fetch(new URL("/data.js", request.url).toString(), { cf: { cacheTtl: 60 } });
  if (!r.ok) return null;
  const txt = await r.text();
  for (const blk of txt.match(/\{[^{}]*\bpre:\s*1\b[^{}]*\}/g) || []) {
    const get = k => { const m = blk.match(new RegExp(k + ':\\s*"([^"]*)"')); return m ? m[1] : ""; };
    if ([get("file"), get("sample"), get("answer")].includes(f)) return { file: get("file"), open: get("open"), title: get("title") };
  }
  return null;
}

async function signPass(env, file, exp) {
  return exp + "." + hex(await hmac(String(env.STATS_KEY || env.R2_SECRET_ACCESS_KEY || ""), "pre|" + file + "|" + exp)).slice(0, 40);
}
const todayJst = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);

function fromOwnSite(request, u) {
  const site = request.headers.get("Sec-Fetch-Site");
  if (site) return site === "same-origin";
  const ref = request.headers.get("Referer");
  if (!ref) return false;
  try { return new URL(ref).host === u.host; } catch (e) { return false; }
}

export async function onRequest({ request, env }) {
  const u = new URL(request.url);
  const no = (s, m) => new Response(m || "not found", { status: s, headers: { "Cache-Control": "no-store" } });
  if (request.method !== "GET") return no(405, "method");
  if (!fromOwnSite(request, u)) return no(403, "forbidden");
  const f = u.searchParams.get("f") || "", t = u.searchParams.get("t") || "";
  if (!SAFE.test(f)) return no(400, "bad file");
  if (!env || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) return no(500, "not configured");
  const it = await findPre(request, f);
  if (!it) return no(404);
  let ok = !!(it.open && it.open <= todayJst());
  if (!ok && t) {
    const exp = Number(t.split(".")[0]);
    ok = exp > Date.now() && t === await signPass(env, "all", exp);
  }
  if (!ok) return no(403, "survey");

  const ls = await r2Get(env, "", { "list-type": "2", prefix: "yokoku/" });
  if (!ls.ok) return no(502, "list");
  const xml = await ls.text();
  const key = (xml.match(/<Key>([^<]+)<\/Key>/g) || []).map(s => s.slice(5, -6)).find(k => k.endsWith("/" + f));
  if (!key) return no(404);
  const r = await r2Get(env, key);
  if (!r.ok) return no(404);
  const h = new Headers();
  h.set("Content-Type", /\.png$/i.test(f) ? "image/png" : "image/jpeg");
  h.set("Cache-Control", "private, no-store");
  h.set("X-Robots-Tag", "noindex");
  return new Response(r.body, { status: 200, headers: h });
}
