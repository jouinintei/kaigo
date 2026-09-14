// functions/api/insights.js
// 保存ログ(savelog.html)向けに、Google アナリティクス(GA4)・Search Console・Cloudflare Web Analytics の
// 数字をまとめて返す。閲覧には STATS_KEY が必要(log-save と同じ)。
//
// 使い方: GET /api/insights?key=STATS_KEY&src=ga|gsc|cf|bing
//
// 環境変数(EdgeOne Pages の設定画面で登録):
//   STATS_KEY        … 閲覧キー(既存)
//   GOOGLE_SA_JSON_B64 … Google Cloud のサービスアカウント鍵(JSONファイル全体を base64url にしたもの。記号なし)
//                      ※GOOGLE_SA_JSON(JSONそのまま) や GOOGLE_SA_EMAIL + GOOGLE_SA_KEY(鍵の本体だけ) でも可
//                      ※値が1000文字までの環境では GOOGLE_SA_EMAIL + GOOGLE_SA_KEY_1 / GOOGLE_SA_KEY_2 に分ける
//   GA_PROPERTY_ID   … GA4 のプロパティID(数字だけ。例: 123456789)
//   GSC_SITE         … Search Console のプロパティ(例: sc-domain:rekupuri.com  または  https://rekupuri.com/)
//   CF_API_TOKEN     … Cloudflare API トークン(既存。Account Analytics: Read が必要)
//   CF_ACCOUNT_ID    … Cloudflare アカウントID(既存)
//   BING_API_KEY     … Bing Webmaster Tools の設定 → APIアクセス で発行したAPIキー
//   BING_SITE        … (省略可) Bing に登録したサイトURL。既定は https://rekupuri.com/

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key") || "";
  if (!env.STATS_KEY || key !== env.STATS_KEY) return json({ error: "not found" }, 404);

  const src = url.searchParams.get("src") || "";
  try {
    if (src === "ga")  return json(await fetchGA(env));
    if (src === "gsc") return json(await fetchGSC(env));
    if (src === "cf")  return json(await fetchCF(env));
    if (src === "bing") return json(await fetchBing(env));
    return json({ error: "src は ga / gsc / cf のどれかを指定してください" }, 400);
  } catch (e) {
    return json({ error: String(e && e.message || e) }, 200);
  }
}

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, max-age=600"
    }
  });
}

/* ---------- 日付 (JST) ---------- */
function jstKey(offsetDays) {
  const d = new Date(Date.now() + 9 * 3600 * 1000 + (offsetDays || 0) * 86400 * 1000);
  return d.toISOString().slice(0, 10);
}

/* ---------- Google 認証 (サービスアカウント → アクセストークン) ---------- */
function saCreds(env) {
  let email = env.GOOGLE_SA_EMAIL || "";
  let pem = env.GOOGLE_SA_KEY || "";
  // 環境変数が1000文字までの環境向け: GOOGLE_SA_KEY_1, _2, _3 … に分けたものをつなげる
  if (!pem) {
    for (let i = 1; i <= 9; i++) {
      const part = env["GOOGLE_SA_KEY_" + i];
      if (!part) break;
      pem += String(part).trim();
    }
  }
  let jsonText = env.GOOGLE_SA_JSON || "";
  // 記号が使えない環境変数向け: JSON全体を base64url にしたもの
  if (!jsonText && env.GOOGLE_SA_JSON_B64) jsonText = new TextDecoder().decode(fromB64url(env.GOOGLE_SA_JSON_B64));
  if (jsonText) {
    const j = JSON.parse(jsonText);
    email = j.client_email || email;
    pem = j.private_key || pem;
  }
  if (!email || !pem) throw new Error("Google の設定がありません(GOOGLE_SA_JSON / GOOGLE_SA_JSON_B64 / GOOGLE_SA_EMAIL+GOOGLE_SA_KEY のいずれか)");
  return { email, pem: pem.replace(/\\n/g, "\n") };
}

function fromB64url(s) {
  let b = String(s).trim().replace(/-/g, "+").replace(/_/g, "/").replace(/\s+/g, "");
  while (b.length % 4) b += "=";
  return Uint8Array.from(atob(b), c => c.charCodeAt(0));
}

function b64url(bytes) {
  let s = "";
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlStr(str) { return b64url(new TextEncoder().encode(str)); }

async function importPem(pem) {
  // PEM(ヘッダー付き)でも、本体だけでも、base64url でも受け付ける
  const body = pem.replace(/-----[^-]+-----/g, "");
  const raw = fromB64url(body);
  return crypto.subtle.importKey("pkcs8", raw.buffer, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
}

async function googleToken(env, scope) {
  const { email, pem } = saCreds(env);
  const now = Math.floor(Date.now() / 1000);
  const header = b64urlStr(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64urlStr(JSON.stringify({
    iss: email, scope: scope, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600
  }));
  const key = await importPem(pem);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(header + "." + claim));
  const jwt = header + "." + claim + "." + b64url(sig);
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=" + encodeURIComponent(jwt)
  });
  const j = await r.json();
  if (!r.ok || !j.access_token) throw new Error("Google 認証に失敗: " + (j.error_description || j.error || r.status));
  return j.access_token;
}

async function gpost(url, token, body) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const j = await r.json();
  if (!r.ok) throw new Error((j.error && (j.error.message || j.error.status)) || ("HTTP " + r.status));
  return j;
}

/* ---------- GA4 ---------- */
async function fetchGA(env) {
  const pid = env.GA_PROPERTY_ID;
  if (!pid) throw new Error("GA_PROPERTY_ID がありません");
  const token = await googleToken(env, "https://www.googleapis.com/auth/analytics.readonly");
  const base = "https://analyticsdata.googleapis.com/v1beta/properties/" + pid;

  const daily = await gpost(base + ":runReport", token, {
    dateRanges: [{ startDate: "28daysAgo", endDate: "today" }],
    dimensions: [{ name: "date" }],
    metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }, { name: "sessions" }],
    orderBys: [{ dimension: { dimensionName: "date" } }],
    limit: 100
  });
  const pages = await gpost(base + ":runReport", token, {
    dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
    dimensions: [{ name: "pagePath" }],
    metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    limit: 10
  });
  const sources = await gpost(base + ":runReport", token, {
    dateRanges: [{ startDate: "28daysAgo", endDate: "today" }],
    dimensions: [{ name: "sessionDefaultChannelGroup" }],
    metrics: [{ name: "sessions" }],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit: 8
  });
  let realtime = null;
  try {
    const rt = await gpost(base + ":runRealtimeReport", token, { metrics: [{ name: "activeUsers" }] });
    realtime = Number(((rt.rows || [])[0] || {}).metricValues?.[0]?.value || 0);
  } catch (e) { realtime = null; }

  const rows = r => (r.rows || []).map(x => ({
    d: x.dimensionValues.map(v => v.value),
    m: x.metricValues.map(v => Number(v.value))
  }));
  return {
    updated: Date.now(),
    realtime: realtime,
    daily: rows(daily).map(x => ({ date: x.d[0].replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"), users: x.m[0], views: x.m[1], sessions: x.m[2] })),
    pages: rows(pages).map(x => ({ path: x.d[0], views: x.m[0], users: x.m[1] })),
    sources: rows(sources).map(x => ({ name: x.d[0], sessions: x.m[0] }))
  };
}

/* ---------- Search Console ---------- */
async function fetchGSC(env) {
  const site = env.GSC_SITE;
  if (!site) throw new Error("GSC_SITE がありません");
  const token = await googleToken(env, "https://www.googleapis.com/auth/webmasters.readonly");
  const url = "https://www.googleapis.com/webmasters/v3/sites/" + encodeURIComponent(site) + "/searchAnalytics/query";
  // Search Console のデータは2〜3日遅れて確定するので、3日前を終点にする
  const end = jstKey(-3), start = jstKey(-30);
  const q = (dims, limit) => gpost(url, token, { startDate: start, endDate: end, dimensions: dims, rowLimit: limit, dataState: "final" });
  const [daily, queries, pages] = await Promise.all([q(["date"], 100), q(["query"], 20), q(["page"], 10)]);
  const rows = r => (r.rows || []).map(x => ({
    key: x.keys[0], clicks: x.clicks || 0, impressions: x.impressions || 0, ctr: x.ctr || 0, position: x.position || 0
  }));
  return {
    updated: Date.now(),
    range: { start, end },
    daily: rows(daily).sort((a, b) => a.key < b.key ? -1 : 1),
    queries: rows(queries),
    pages: rows(pages)
  };
}

/* ---------- Cloudflare Web Analytics ---------- */
// 以前から動いている stats.js と同じ取り方(datetime で絞って時間別に取得)を使い、日本時間の日別にまとめる
async function fetchCF(env) {
  if (!env.CF_API_TOKEN || !env.CF_ACCOUNT_ID) throw new Error("CF_API_TOKEN / CF_ACCOUNT_ID がありません");
  const DAYS = 28;
  const nowJst = new Date(Date.now() + 9 * 3600 * 1000);
  const todayUtc0 = Date.UTC(nowJst.getUTCFullYear(), nowJst.getUTCMonth(), nowJst.getUTCDate()) - 9 * 3600 * 1000; // JST 今日0時
  const startMs = todayUtc0 - (DAYS - 1) * 86400 * 1000;
  const endMs = todayUtc0 + 86400 * 1000;
  const s = new Date(startMs).toISOString(), e = new Date(endMs).toISOString();
  const q = `query($t:string!,$s:Time!,$e:Time!){viewer{accounts(filter:{accountTag:$t}){
    byHour: rumPageloadEventsAdaptiveGroups(limit:2000,filter:{datetime_geq:$s,datetime_lt:$e},orderBy:[datetimeHour_ASC]){count sum{visits} dimensions{datetimeHour}}
  }}}`;
  const r = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: { "Authorization": "Bearer " + env.CF_API_TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify({ query: q, variables: { t: env.CF_ACCOUNT_ID, s: s, e: e } })
  });
  const j = await r.json();
  if (j.errors && j.errors.length) throw new Error(j.errors.map(x => x.message).join(" / "));
  const acc = (((j.data || {}).viewer || {}).accounts || [])[0] || {};
  const byDay = {};
  for (let i = 0; i < DAYS; i++) byDay[jstKey(-(DAYS - 1 - i))] = { views: 0, visits: 0 };
  (acc.byHour || []).forEach(x => {
    const t = Date.parse(x.dimensions.datetimeHour);
    if (isNaN(t)) return;
    const k = new Date(t + 9 * 3600 * 1000).toISOString().slice(0, 10);
    if (!byDay[k]) return;
    byDay[k].views += x.count || 0;
    byDay[k].visits += (x.sum && x.sum.visits) || 0;
  });
  return {
    updated: Date.now(),
    daily: Object.keys(byDay).sort().map(k => ({ date: k, views: byDay[k].views, visits: byDay[k].visits }))
  };
}

/* ---------- Bing Webmaster Tools ---------- */
async function fetchBing(env) {
  if (!env.BING_API_KEY) throw new Error("BING_API_KEY がありません");
  const site = env.BING_SITE || "https://rekupuri.com/";
  const base = "https://ssl.bing.com/webmaster/api.svc/json/";
  const get = async (method) => {
    const r = await fetch(base + method + "?siteUrl=" + encodeURIComponent(site) + "&apikey=" + encodeURIComponent(env.BING_API_KEY), {
      headers: { "Accept": "application/json" }
    });
    let j = null;
    try { j = await r.json(); } catch (e) { j = null; }
    if (!r.ok) throw new Error((j && (j.Message || j.ErrorCode)) ? (j.Message || ("ErrorCode " + j.ErrorCode)) : ("HTTP " + r.status));
    return (j && j.d) || [];
  };
  // "/Date(1694649600000-0000)/" 形式 → YYYY-MM-DD (UTC基準の日付をそのまま使う)
  const dkey = (v) => {
    const m = /\/Date\((-?\d+)/.exec(String(v || ""));
    const ms = m ? Number(m[1]) : Date.parse(v);
    if (isNaN(ms)) return "";
    return new Date(ms).toISOString().slice(0, 10);
  };
  const since = jstKey(-28);
  const [traffic, queries, pages] = await Promise.all([get("GetRankAndTrafficStats"), get("GetQueryStats"), get("GetPageStats")]);

  const daily = traffic.map(x => ({ key: dkey(x.Date), clicks: Number(x.Clicks || 0), impressions: Number(x.Impressions || 0) }))
    .filter(x => x.key).sort((a, b) => a.key < b.key ? -1 : 1).slice(-28);

  const agg = (rows, nameField) => {
    const m = {};
    rows.forEach(x => {
      const k = dkey(x.Date);
      if (k && k < since) return;
      const name = x[nameField];
      if (!name) return;
      if (!m[name]) m[name] = { key: name, clicks: 0, impressions: 0, posW: 0 };
      const imp = Number(x.Impressions || 0);
      m[name].clicks += Number(x.Clicks || 0);
      m[name].impressions += imp;
      m[name].posW += Number(x.AvgImpressionPosition || 0) * imp;
    });
    return Object.keys(m).map(k => {
      const o = m[k];
      return { key: o.key, clicks: o.clicks, impressions: o.impressions, position: o.impressions ? o.posW / o.impressions : 0 };
    }).sort((a, b) => (b.clicks - a.clicks) || (b.impressions - a.impressions));
  };
  return {
    updated: Date.now(),
    range: { start: daily.length ? daily[0].key : since, end: daily.length ? daily[daily.length - 1].key : jstKey(0) },
    daily: daily,
    queries: agg(queries, "Query").slice(0, 20),
    pages: agg(pages, "Query").slice(0, 10)
  };
}
