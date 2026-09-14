// functions/api/popular.js
// 直近7日間に保存された作品を「保存した端末数」で並べて返す(件数は返さない)
// 非公開リポジトリ data/save-log.json の events(時刻 t / ファイル f / 端末 d)を集計する
// 環境変数: GITHUB_TOKEN, MEMBER_REPO(log-save.js と同じもの)

export async function onRequest({ request, env }) {
  if (request.method !== "GET") return new Response("method not allowed", { status: 405 });

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

    const events = Array.isArray(log.events) ? log.events : [];
    const since = Date.now() - 7 * 24 * 3600 * 1000;

    // ファイルごとに「保存した端末の集合」と「保存回数」を集める
    const devs = {};   // file -> Set(did)
    const cnt = {};    // file -> 回数
    for (const e of events) {
      if (!e || !e.f || !e.t || e.t < since) continue;
      if (String(e.f).startsWith("m_")) continue;          // 会員作品は載せない
      if (!devs[e.f]) { devs[e.f] = new Set(); cnt[e.f] = 0; }
      devs[e.f].add(e.d || "?");
      cnt[e.f]++;
    }

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
