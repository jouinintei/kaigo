// functions/api/popular.js
// 直近7日間に保存された作品を「保存した端末数」で並べて返す(件数は返さない)
// 非公開リポジトリ data/save-log.json(今日の分) と data/log/日付.json(過去の分) の fd(日ごとの保存端末)と days(日ごとの枚数)を集計する
// 環境変数: GITHUB_TOKEN, MEMBER_REPO(log-save.js と同じもの)

// 大きな save-log.json を毎回読むとCPU制限(無料枠10ms)を超えるので、
// 結果をCloudflareのキャッシュに10分置いて、その間はキャッシュから返す
export async function onRequest(ctx) {
  const { request } = ctx;
  if (request.method !== "GET") return new Response("method not allowed", { status: 405 });
  const cache = (typeof caches !== "undefined") ? caches.default : null;
  const ck = new Request("https://rekupuri.com/__cache/popular-v2");
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

    // 順位は毎晩 rekupuri-member の GitHub Actions が data/log/popular.json に作っておく
    // (ここで日ごとのファイルを読んで数えると無料枠のCPU 10msを超えるため、中身は読み解かずにそのまま返す)
    const r = await fetch("https://api.github.com/repos/" + repo + "/contents/data/log/popular.json?ref=main", {
      headers: {
        "Authorization": "Bearer " + token,
        "Accept": "application/vnd.github.raw",
        "User-Agent": "rekupuri-popular"
      }
    });
    if (!r.ok) return new Response(JSON.stringify({ files: [] }), { headers });
    return new Response(r.body, { headers });

  } catch (e) {
    return new Response(JSON.stringify({ files: [] }), { headers });
  }
}
