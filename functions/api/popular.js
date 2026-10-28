// functions/api/popular.js
// 直近7日間に保存された作品を「保存した端末数」で並べて返す(件数は返さない)
// 非公開リポジトリ data/save-log.json の fd(日ごとの保存端末)と days(日ごとの枚数)を集計する
// 環境変数: GITHUB_TOKEN, MEMBER_REPO(log-save.js と同じもの)

// 大きな save-log.json を毎回読むとCPU制限(無料枠10ms)を超えるので、
// 結果をCloudflareのキャッシュに10分置いて、その間はキャッシュから返す
export async function onRequest(ctx) {
  const { request } = ctx;
  if (request.method !== "GET") return new Response("method not allowed", { status: 405 });
  const cache = (typeof caches !== "undefined") ? caches.default : null;
  const ck = new Request("https://rekupuri.com/__cache/popular-v1");
  if (cache) { try { const hit = await cache.match(ck); if (hit) return hit; } catch (e) {} }
  const res = await build(ctx);
  if (cache && res.status === 200) {
    try { ctx.waitUntil(cache.put(ck, res.clone())); } catch (e) {}
  }
  return res;
}

async function build({ request, env }) {

  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "public, max-age=600",   // 10分はCDNに任せる(GitHubへの問い合わせを減らす)
    "Access-Control-Allow-Origin": "*"
  };

  try {
    const repo = env.MEMBER_REPO;
    const token = env.GITHUB_TOKEN;
    if (!repo || !token) return new Response(JSON.stringify({ files: [] }), { headers });

    const r = await fetch("https://api.github.com/repos/" + repo + "/contents/data/save-log.json?ref=main", {
      headers: {
        "Authorization": "Bearer " + token,
        "Accept": "application/vnd.github.raw",
        "User-Agent": "rekupuri-popular"
      }
    });
    if (!r.ok) return new Response(JSON.stringify({ files: [] }), { headers });
    const log = await r.json();

    // 直近7日(日本時間・今日を含む)の日付
    const dayStart = Date.parse(new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10) + "T00:00:00+09:00");
    const keys = [];
    for (let i = 0; i < 7; i++) keys.push(new Date(dayStart - i * 24 * 3600 * 1000 + 9 * 3600 * 1000).toISOString().slice(0, 10));

    // ファイルごとに「保存した端末の集合」と「保存回数」を集める
    // 端末は fd(日ごと・絵ごとの保存端末)、回数は days(日ごと・絵ごとの枚数)から
    const devs = {};   // file -> Set(did)
    const cnt = {};    // file -> 回数
    const fd = log.fd || {}, days = log.days || {};
    for (const k of keys) {
      const o = fd[k] || {};
      for (const f of Object.keys(o)) {
        if (!devs[f]) devs[f] = new Set();
        (o[f] || []).forEach(x => devs[f].add(x));
      }
      const c = days[k] || {};
      for (const f of Object.keys(c)) cnt[f] = (cnt[f] || 0) + c[f];
    }
    for (const f of Object.keys(cnt)) if (!devs[f]) devs[f] = new Set();

    // 端末数の多い順 → 同数なら保存回数の多い順
    const files = Object.keys(devs)
      .sort((a, b) => (devs[b].size - devs[a].size) || (cnt[b] - cnt[a]))
      .slice(0, 30);

    // 順位だけ返す(数字は公開しない)
    return new Response(JSON.stringify({ files }), { headers });

  } catch (e) {
    return new Response(JSON.stringify({ files: [] }), { headers });
  }
}
