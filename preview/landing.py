# landing.py — 特集ページ8つと規約・プライバシーを新デザインで作り直す
# 元の文面は /home/claude/aud/lp_orig/ から読み、枚数は data.js から数え直す
import re, json, time, html as H
K = '/home/claude/kaigo/'
O = '/home/claude/aud/lp_orig/'
V = str(int(time.time()))

# ---- data.js から一覧を読む（kind 未指定は塗り絵）
src = open(K + 'data.js', encoding='utf-8').read()
items = []
seen = set()
for m in re.finditer(r'\{[^{}]*\}', src):
    o = m.group(0)
    f = re.search(r'file:\s*"([^"]+)"', o)
    if not f or f.group(1) in seen: continue
    seen.add(f.group(1))
    g = lambda k: (re.search(k + r':\s*"([^"]*)"', o) or [None, ""])[1]
    items.append(dict(file=f.group(1), kind=g('kind') or '塗り絵', season=g('season'), genre=g('genre'), title=g('title')))

def count(F):
    n = 0
    for it in items:
        if F.get('kind') and it['kind'] != F['kind']: continue
        if F.get('season') and it['season'] != F['season']: continue
        if F.get('genre') and it['genre'] != F['genre']: continue
        if F.get('title_has') and F['title_has'] not in it['title']: continue
        n += 1
    return n

PAGES = {
  'nurie-haru':     ('SPRING',   'gallery.html?season=春'),
  'nurie-natsu':    ('SUMMER',   'gallery.html?season=夏'),
  'nurie-aki':      ('AUTUMN',   'gallery.html?season=秋'),
  'nurie-fuyu':     ('WINTER',   'gallery.html?season=冬'),
  'nurie-doubutsu': ('ANIMALS',  'gallery.html?genre=動物'),
  'keirou-nurie':   ('RESPECT FOR THE AGED', 'gallery.html?q=敬老'),
  'noutore-print':  ('BRAIN TRAINING', 'gallery.html?page=noutore'),
  'nurie-calendar': ('CALENDAR', 'gallery.html?page=calendar'),
}
THEMES = [('nurie-haru','春の塗り絵'),('nurie-natsu','夏の塗り絵'),('nurie-aki','秋の塗り絵'),('nurie-fuyu','冬の塗り絵'),('nurie-doubutsu','動物の塗り絵'),('keirou-nurie','敬老の日の塗り絵'),('noutore-print','脳トレプリント'),('nurie-calendar','塗り絵カレンダー')]

FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
         '<link href="https://fonts.googleapis.com/css2?family=Shippori+Mincho+B1:wght@700&display=swap" rel="stylesheet">\n'
         f'<link rel="stylesheet" href="/rk.css?v={V}">\n')
BEACON = "<script type='module' src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{\"token\": \"a9863d837944405fb5b7d52eafc53b9e\"}'></script>"

LP_CSS = '''<style>
.lp{max-width:1200px;margin:0 auto;padding:0 24px}
.crumb{font-size:13px;color:var(--mute);padding:18px 0 0}.crumb a{color:var(--mute)}
.lph{display:grid;grid-template-columns:1.3fr 1fr;gap:40px;align-items:end;padding:22px 0 30px;border-bottom:1px solid var(--line)}
.lph .ey{font-size:13px;letter-spacing:.25em;color:var(--btn);font-weight:700}
.lph h1{font-family:var(--mincho);font-size:38px;line-height:1.4;margin:6px 0 14px;color:#3A2A21}
.lph p{margin:0 0 10px;color:#4A423A;font-size:16px;line-height:1.9}.lph p b{color:#3A2A21}
.lpc{background:#fff;border:1px solid var(--line);border-radius:16px;padding:24px;display:flex;flex-direction:column;gap:14px;box-shadow:var(--shadow)}
.lpc .nm{display:flex;align-items:baseline;gap:6px;color:var(--sub)}.lpc .nm b{font-family:var(--mincho);font-size:56px;line-height:1;color:var(--acc)}
.lpc .pt{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px;font-size:14.5px;color:#4A423A}.lpc .pt li::before{content:"✓";color:var(--acc);font-weight:700;margin-right:8px}
.lpc .btn{height:52px;font-size:16px}
.lps{margin-top:36px}.lps .h2 h2{font-family:var(--mincho)}
.lpgrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px;margin-top:8px}
.lpmore{display:flex;justify-content:center;margin:28px 0 8px}.lpmore .btn{height:52px;padding:0 32px;font-size:16px}
.lphow{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:8px;padding:0;list-style:none}
.lphow li{background:#fff;border:1px solid var(--line);border-radius:14px;padding:20px 22px;display:flex;gap:14px;align-items:flex-start;font-size:15.5px;color:#4A423A}
.lphow li span{font-family:var(--mincho);font-size:32px;line-height:1;color:var(--acc)}
.lpthemes{display:flex;flex-wrap:wrap;gap:10px;margin-top:10px}.lpthemes a{display:inline-flex;align-items:center;height:44px;padding:0 18px;border:1px solid var(--line);border-radius:999px;background:#fff;color:var(--ink);text-decoration:none;font-size:15px}.lpthemes a:hover{border-color:var(--acc);color:var(--btn)}.lpthemes a[aria-current]{background:var(--btn);border-color:var(--btn);color:#fff}
.doc{max-width:860px;margin:0 auto;padding:0 24px}
.doc .ph1{padding:34px 0 8px}.doc .ph1 .ey{font-size:13px;letter-spacing:.25em;color:var(--btn);font-weight:700}.doc .ph1 h1{font-family:var(--mincho);font-size:34px;margin:6px 0 0;color:#3A2A21}
.doc .body{background:#fff;border:1px solid var(--line);border-radius:16px;padding:32px;margin-top:22px;font-size:16px;line-height:1.95;color:#4A423A}
.doc .body h2,.doc .body h3{font-family:var(--mincho);color:#3A2A21;margin:28px 0 10px;display:flex;align-items:center;gap:10px}.doc .body h2{font-size:22px}.doc .body h3{font-size:19px}
.doc .body h2::before,.doc .body h3::before{content:"";width:3px;height:20px;background:var(--acc);border-radius:2px;flex:none}
.doc .body > :first-child{margin-top:0}.doc .body p{margin:0 0 14px}.doc .body ul,.doc .body ol{margin:0 0 16px;padding-left:1.4em}.doc .body li{margin:4px 0}
.doc .body .ok,.doc .body .ng,.doc .body .box{border-radius:12px;padding:18px 22px;margin:18px 0}.doc .body .ok{background:#F2F7EF;border:1px solid #CFE3C6}.doc .body .ng{background:#FCF1EC;border:1px solid #F0D2C2}.doc .body .ok h3,.doc .body .ng h3{margin-top:0}
.doc .body a{color:var(--btn)}
@media (max-width:900px){.lpgrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.lph{grid-template-columns:1fr;gap:20px}}
@media (max-width:640px){.lp,.doc{padding:0 16px}.lph h1{font-size:28px}.lpgrid{grid-template-columns:1fr}.lphow{grid-template-columns:1fr}.lpc .nm b{font-size:44px}.doc .body{padding:22px 18px}.doc .ph1 h1{font-size:27px}}
</style>
'''

def head_of(raw):
    h = raw[:raw.index('<style')] if '<style' in raw else raw[:raw.index('</head>')]
    return h

def fix_counts(text, n):
    text = re.sub(r'無料\d+枚', f'無料{n}枚', text)
    text = re.sub(r'\d+枚以上', f'{n}枚', text)
    return text

for name, (ey, glink) in PAGES.items():
    raw = open(O + name + '.html', encoding='utf-8').read()
    F = json.loads(re.search(r'var F = (\{[^}]*\})', raw).group(1))
    n = count(F)
    head = fix_counts(head_of(raw), n)
    if '/analytics.js' not in head: head += '<script src="/analytics.js" defer></script>\n'
    head += '<script src="/frame.js?v=10"></script>\n' + FONTS + LP_CSS + '</head>\n'
    body = raw[raw.index('<body'):]
    h1 = re.search(r'<h1>(.*?)</h1>', body, re.S).group(1)
    crumb = re.search(r'<div class="crumb">(.*?)</div>', body, re.S).group(1)
    ps = re.findall(r'<p class="txt">(.*?)</p>', body, re.S)
    ps = [fix_counts(p, n) for p in ps if '一覧' not in p or '選んで' not in p]
    unit = '種類' if F.get('kind') == 'カレンダー' else '枚'
    kind = F.get('kind') or '塗り絵'
    pts = ['無料・登録不要・広告なし', 'A4サイズでそのまま印刷', '答えつき' if kind == '脳トレ' else ('色見本つき' if kind == '塗り絵' else '毎月の行事に合わせた絵柄')]
    themes = ''.join(f'<a href="{t}.html"{" aria-current=\"page\"" if t == name else ""}>{l}</a>' for t, l in THEMES)
    page = f'''{head}<body>
<div id="hd"></div>
<main class="lp">
<div class="crumb">{crumb}</div>
<section class="lph"><div><div class="ey">{ey}</div><h1>{h1}</h1>{''.join(f'<p>{p}</p>' for p in ps)}</div>
<div class="lpc"><div class="nm"><b id="lpn">{n}</b><span>{unit}を収録</span></div><ul class="pt">{''.join(f'<li>{x}</li>' for x in pts)}</ul><a class="btn p" href="{glink}">絞り込んで探す（一覧へ）→</a></div></section>
<section class="lps"><div class="h2"><h2>収録している素材</h2><span class="s">押すと大きく見られます。そのまま保存もできます</span></div><div class="lpgrid" id="lpgrid"></div><div class="lpmore"><a class="btn o" href="{glink}" id="lpmore">すべて見る →</a></div></section>
<section class="lps"><div class="h2"><h2>使い方</h2></div><ol class="lphow"><li><span>1</span><div>気になる素材を押して、大きく表示します</div></li><li><span>2</span><div>「保存する」を押すと、A4用の画像が保存されます</div></li><li><span>3</span><div>A4サイズで印刷して、そのままレクリエーションに</div></li></ol></section>
<section class="lps"><div class="h2"><h2>ほかのテーマもどうぞ</h2></div><div class="lpthemes">{themes}</div></section>
</main>
<div id="ft"></div>
<script src="/data.js"></script>
<script src="/rk.js?v={V}"></script>
<script>
(function(){{
  var F={json.dumps(F, ensure_ascii=False)},MAX=24;
  window.RK_SRC=window.RK_PAGE="lp";
  document.getElementById("hd").innerHTML=RK.header("lp");
  document.getElementById("ft").innerHTML=RK.footer(F.kind==="脳トレ"?"noutore":F.kind==="カレンダー"?"cal":"nurie");
  RK.updFavCount();
  var list=RK.LIST.filter(function(n){{var k=RK.kindOf(n);if(F.kind&&k!==F.kind)return false;if(F.season&&n.season!==F.season)return false;if(F.genre&&n.genre!==F.genre)return false;if(F.title_has&&String(n.title||"").indexOf(F.title_has)<0)return false;return true;}});
  document.getElementById("lpn").textContent=list.length;
  document.getElementById("lpgrid").innerHTML=list.slice(0,MAX).map(function(n){{return RK.card(n);}}).join("");
  var m=document.getElementById("lpmore");if(list.length<=MAX)m.parentNode.style.display="none";else m.textContent="残り"+(list.length-MAX)+"{unit}もすべて見る →";
}})();
</script>
{BEACON}
</body>
</html>
'''
    open(K + name + '.html', 'w', encoding='utf-8').write(page)
    print(name, n)

# ---- 規約・プライバシー
for name, ey in [('terms', 'TERMS'), ('privacy', 'PRIVACY')]:
    raw = open(O + name + '.html', encoding='utf-8').read()
    head = head_of(raw)
    if '/analytics.js' not in head: head += '<script src="/analytics.js" defer></script>\n'
    head += FONTS + LP_CSS + '</head>\n'
    body = raw[raw.index('<body'):]
    h1 = re.search(r'<h1>(.*?)</h1>', body, re.S).group(1)
    w = body[body.index('<div class="wrap">') + len('<div class="wrap">'):]
    w = re.split(r'<footer|<script', w)[0]
    w = w.strip()
    if w.endswith('</div>'): w = w[:-6]
    w = re.sub(r'^\s*<div class="card">', '', w).strip()
    if w.endswith('</div>'): w = w[:-6]
    page = f'''{head}<body>
<div id="hd"></div>
<main class="doc"><div class="ph1"><div class="ey">{ey}</div><h1>{h1}</h1></div><div class="body">
{w}
</div></main>
<div id="ft"></div>
<script src="/data.js"></script>
<script src="/rk.js?v={V}"></script>
<script>
document.getElementById("hd").innerHTML=RK.header("doc");
document.getElementById("ft").innerHTML=RK.footer("doc");
var q=document.querySelector(".req");if(q)q.remove();var f=document.querySelector(".ft");if(f)f.style.marginTop="64px";
</script>
{BEACON}
</body>
</html>
'''
    open(K + name + '.html', 'w', encoding='utf-8').write(page)
    print(name, 'ok', len(w))
