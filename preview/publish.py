# preview/ の新デザインを本番（/index.html, /gallery.html）に書き出す
import re,shutil,time,os
K='/home/claude/kaigo/'; P=K+'preview/'
V=str(int(time.time()))
shutil.copy(P+'style.css',K+'rk.css'); shutil.copy(P+'app.js',K+'rk.js')
def head_of(f):
    s=open(K+f).read(); return s
def body_part(src):
    return src[src.index('<body>'):]
def build(prev,old,out,keep_extra):
    p=open(P+prev).read(); o=open('/home/claude/aud/'+old+'.bak' if os.path.exists('/home/claude/aud/'+old+'.bak') else K+old).read()
    oh=o[o.index('<head>')+6:o.index('<style')] if '<style' in o[:o.index('</head>')] else o[o.index('<head>')+6:o.index('</head>')]
    # drop old inline style/scripts we don't need, keep meta/ld+json/entry/analytics/frame
    ph=p[p.index('<head>')+6:p.index('</head>')]
    ph=re.sub(r'<meta charset="utf-8">\s*','',ph)
    ph=re.sub(r'<meta name="viewport"[^>]*>\s*','',ph)
    ph=re.sub(r'<meta name="robots"[^>]*>\s*','',ph)
    ph=re.sub(r'<title>.*?</title>\s*','',ph)
    ph=ph.replace('href="style.css?v=','href="/rk.css?v=')
    ph=re.sub(r'/rk.css\?v=\d+','/rk.css?v='+V,ph)
    b=body_part(p)
    b=b.replace('src="../data.js"','src="/data.js"')
    b=re.sub(r'src="app.js\?v=\d+"','src="/rk.js?v='+V+'"',b)
    b=b.replace('</body>',keep_extra+'</body>')
    html='<!DOCTYPE html>\n<html lang="ja">\n<head>\n'+oh.strip()+'\n'+ph.strip()+'\n</head>\n'+b
    open(K+out,'w').write(html)
CF="<!-- Cloudflare Web Analytics --><script type='module' src='https://static.cloudflareinsights.com/beacon.min.js' data-cf-beacon='{\"token\": \"a9863d837944405fb5b7d52eafc53b9e\"}'></script><!-- End Cloudflare Web Analytics -->\n"
build('index.html','index.html','index.html',CF)
build('list.html','gallery.html','gallery.html',CF)
print('ok',V)
