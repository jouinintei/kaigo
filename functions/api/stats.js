// アクセス統計API (Cloudflare Web Analytics を取得して返す)
// 置き場所: functions/api/stats.js
// 必要な環境変数: CF_API_TOKEN, CF_ACCOUNT_ID, STATS_KEY

export async function onRequest({ request, env }) {
  const url = new URL(request.url);

  if (!env.STATS_KEY || url.searchParams.get("key") !== env.STATS_KEY) {
    return new Response("Not found", { status: 404 });
  }

  // 対象日 (日本時間の1日分)。?date=YYYY-MM-DD 指定がなければ「昨日」
  let day = url.searchParams.get("date");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day || "")) {
    const nowJst = new Date(Date.now() + 9 * 3600 * 1000);
    nowJst.setUTCDate(nowJst.getUTCDate() - 1);
    day = nowJst.toISOString().slice(0, 10);
  }
  const base = new Date(day + "T00:00:00Z").getTime() - 9 * 3600 * 1000; // JST 0時 → UTC
  const s = new Date(base).toISOString();
  const e = new Date(base + 24 * 3600 * 1000).toISOString();

  const F = "filter:{datetime_geq:$s,datetime_lt:$e}";
  const q = `query($t:string!,$s:Time!,$e:Time!){viewer{accounts(filter:{accountTag:$t}){
    total: rumPageloadEventsAdaptiveGroups(limit:1,${F}){count sum{visits}}
    byHour: rumPageloadEventsAdaptiveGroups(limit:30,${F},orderBy:[datetimeHour_ASC]){count dimensions{datetimeHour}}
    byPath: rumPageloadEventsAdaptiveGroups(limit:20,${F},orderBy:[count_DESC]){count sum{visits} dimensions{requestPath}}
    byRef: rumPageloadEventsAdaptiveGroups(limit:20,${F},orderBy:[count_DESC]){count dimensions{refererHost}}
    byCountry: rumPageloadEventsAdaptiveGroups(limit:10,${F},orderBy:[count_DESC]){count dimensions{countryName}}
    byDevice: rumPageloadEventsAdaptiveGroups(limit:10,${F},orderBy:[count_DESC]){count dimensions{deviceType}}
  }}}`;

  let out;
  try {
    const r = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + env.CF_API_TOKEN,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query: q, variables: { t: env.CF_ACCOUNT_ID, s: s, e: e } })
    });
    out = await r.json();
  } catch (err) {
    return json({ date: day, error: String(err) });
  }

  if (out.errors && out.errors.length) {
    return json({ date: day, errors: out.errors });
  }
  const acc = out?.data?.viewer?.accounts?.[0] || {};
  return json({
    date: day,
    range_utc: { from: s, to: e },
    total: acc.total?.[0] || { count: 0, sum: { visits: 0 } },
    byHour: acc.byHour || [],
    byPath: acc.byPath || [],
    byRef: acc.byRef || [],
    byCountry: acc.byCountry || [],
    byDevice: acc.byDevice || []
  });
}

function json(obj) {
  return new Response(JSON.stringify(obj, null, 1), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex"
    }
  });
}
