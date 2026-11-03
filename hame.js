(function () {
  if (!window.RK) return;
  const R = window.RK, esc = R.esc, ico = R.ico;
  const IMG = "https://img.rekupuri.com/images/";
  const TATE = new Set(["sarusuberi_chu.png","usagi_sho.png","usagi_chu.png","shibainu_neko_jo.png","fukurou_chu.png","inko_chu.png","savanna_jo.png","hamster_sho.png","doubutsuen_sho.png","doubutsuen_jo.png","umi_ikimono_sho_2.png","kuma_sho.png","inu_sho.png","inu_neko_chu.png","neko_sho.png","neko_jo.png","hitsuji_chu.png","cosmos2_sho.png","hakuro2_chu.png","higanbana_sho.png","shogatsu_chu.png","ajisai_kasa_chu.png","koinobori_sho.png","kotatsu_mikan_jo.png","tulip_tentomushi_chu.png","yukidaruma_sho.png","wreath_sho.png","hagoita_chu.png","ame_no_hi_chu.png","kikuningyo_jo.png","tanabata_chu.png","haru_inaka_jo.png","hatsumoude_jo.png","shogatsu_asobi_sho.png","setsubun_chu.png","danro_sho.png","tsuyu_jo.png","ajisai2_chu.png","ichigogari_chu.png","ohanami_jo.png","koinobori_jo.png","stew_sho.png","susuki_usagi_sho.png","snowdome_sho.png","tanpopo_chu.png","hinamatsuri2_sho.png","mogura_tsukushi_chu.png","ame_engawa_chu.png","natsu_basutei_jo.png","hanakanmuri_chu.png","kouyou_sho.png","nanohana_chu.png","shiwasu_chu.png","akinasu_sho.png","aki_kudamono_sho.png","haru_mikaku_sho.png","matsutake_sho.png","seijinshiki_chu.png","akatonbo_sho.png","yukidaruma_zukuri_sho.png","fuyu_engawa_jo.png","fuyu_kinkakuji_chu.png","tsuyu_gassho_sho.png","otsukimi_sho.png","cosmos_batake_jo.png","kodomonohi_chu.png","hiyoko_tanpopo_sho.png","kouyou_taki_chu.png","nanohana_chou_sho.png","sakura_kikagaku_sho.png","tanabata_neko_chu.png","orihime_hikoboshi_chu.png","ice_skate_chu.png","zenzai_sho.png","daruma_sho.png","muffler_amimono_sho.png","mikan_sho.png","kozuchi_chu.png","fuyu_ki_sho.png","tanabata_kazari_jo.png","amanogawa_tanabata_jo.png","ukiwa_koneko_chu.png","yadokari_jo.png","pineapple_chu.png","kamogawa_yuka_jo.png","natsumatsuri_yukata_jo.png","ice_cream_sho.png","bonodori_chu.png","oden2_sho.png","okonomiyaki_sho.png","kayabuki_sho.png","shishiodoshi_sho.png","shishiodoshi_chu.png","takoyaki_sho.png","donut_sho.png","nezumi_chu.png","banana_sho.png","mug_sho.png","retro_kissa_sho.png","natsuyasumi2_sho.png","natsu_yasai2_sho.png","kabuki_chu.png","umi_naka_jo.png","hoshigaki2_sho.png","kissaten_sho.png","sakura_ki2_sho.png","haru_sansai_sho.png","ikebana_sho.png","taisho_roman_chu.png","taisho_roman2_chu.png","tanjobi_sho.png","sado_sho.png","kimono_chu.png","chojugiga_jo.png","tsukemono_sho.png","tsuru_kame_chu.png","inaka_ajisai_jo.png","yatsuhashi_sho.png","bonsai_sho.png","mandala_sho.png","kakashi_tonbo_jo.png","hozuki_ichi_jo.png","fruits_bowl_sho.png","shichifukujin_jo.png","mangekyo_sho.png","wafu_mandala_sho.png","kissaten_pudding_chu.png","sushi_chu.png","origami_chu.png","mukashi_asobi_jo.png","mukashi_asobi_chu.png","katahane_chou_chu.png","neko_hanataba_sho.png","aki_kiyomizudera_jo.png","chikurin_jo.png","ironna_hana_chu.png","tora_jo.png","up_1786433365544_1.png","up_1786699872178_2.png","up_1786709449497_1.png","up_1786710655144_2.png","up_1787280884689_1.png","up_1787281255003_2.png","up_1787281927634_3.png","up_1787282123201_4.png","up_1787282410347_5.png","up_1787283008008_7.png","up_1787305433755_8.png","up_1787323089737_9.png","up_1787370039418_10.png","up_1787370204076_11.png","up_1787370358584_12.png","up_1787370474442_13.png","up_1787371128205_16.png","up_1787371221552_17.png","up_1787371298799_18.png","up_1787372326442_21.png","up_1787372518698_22.png","up_1787372679417_23.png","up_1787372902490_24.png","up_1788526131846_1.png","up_1788526135644_2.png","up_1788526140001_3.png","up_1788526143836_4.png","up_1788526148082_5.png","up_1788526151750_6.png","up_1788526844867_8.png","up_1788526848636_9.png","up_1788526852238_10.png","up_1788526855312_11.png","up_1788527653992_12.png","up_1788527657834_13.png","up_1788527661836_14.png","up_1788528030289_15.png","up_1788528061244_16.png","up_1789380324902_1.png","up_1789380461209_2.png","up_1789380723165_3.png","up_1789380883344_4.png","up_1789383772405_1.png","up_1789390681536_3.png","up_1790911505528_2.png","up_1790911747349_5.png","up_1790912747454_7.png","up_1790925839909_6.png","aki_no_taiboku.png","up_1792755702172_15.png","up_1792755706172_19.png","up_1793105407562_1.png","up_1793105408562_2.png","up_1793105409562_3.png","up_1793105411562_5.png","up_1793105412562_6.png","up_1793105419562_13.png","up_1793105423562_17.png","up_1793105425562_19.png","up_1793105428562_22.png","up_1793105434562_28.png","up_1793123177233_1.png","up_1793123179233_3.png","up_1793123182233_6.png","up_1793123183233_7.png","up_1793123187233_11.png","up_1793123188233_12.png","up_1793123193233_17.png","up_1793128266114_23.png","up_1793128267114_24.png","up_1793128268114_25.png","up_1793128270114_27.png","up_1793128272114_29.png","up_1793128273114_30.png","up_1793128274114_31.png","up_1793128275114_32.png","up_1793128279114_36.png","up_1793128282114_39.png","up_1793128285114_42.png","up_1793128244114_1.png","up_1793128245114_2.png","up_1793128246114_3.png","up_1793128248114_5.png","up_1793128250114_7.png","up_1793128251114_8.png","up_1793128252114_9.png","up_1793128257114_14.png","up_1793128261114_18.png","up_1793128269114_26.png","up_1793128283114_40.png","up_1793154419567_1.png","up_1793154421567_3.png","up_1793154422567_4.png","up_1793154423567_5.png","up_1793154424567_6.png","up_1793154425567_7.png","up_1793154426567_8.png","up_1793154427567_9.png","up_1793154428567_10.png","up_1793154430567_12.png","up_1793154431567_13.png","up_1793154432567_14.png","up_1793154433567_15.png","up_1793154434567_16.png","up_1793154435567_17.png","up_1793154436567_18.png","up_1793154439567_21.png","up_1793154441567_23.png","up_1793154444567_26.png","up_1793154445567_27.png","up_1793154446567_28.png","up_1793154449567_31.png","up_1793154450567_32.png","up_1793157557228_2.png","up_1793160001000_1.png","up_1793160002000_2.png","up_1793160003000_3.png","up_1793160004000_4.png","up_1793160005000_5.png","up_1793159476877_1.png","up_1793160392152_1.png","up_1793160393152_2.png","up_1793160971327_1.png","up_1793161611547_1.png","up_1793163269933_1.png","up_1793165067999_1.png","up_1793167964984_1.png","up_1793428359537_1.png","up_1793428359537_2.png","keiryu_zuri_chu.png","toudai_chu.png","kikyu_sho.png","soba_demae_chu.png","tougei_sho.png","shamisen_sho.png","hashiradokei_sho.png","posuto_sho.png","up_1793449171714_1.png","up_1793449171714_2.png","up_1793449171714_3.png","up_1793449171714_4.png","up_1793449171714_5.png","up_1793449171714_6.png","up_1793449171714_8.png","up_1793449171714_9.png","up_1793449171714_10.png","up_1793449171714_11.png","up_1793449171714_12.png","up_1793449171714_13.png","up_1793449171714_14.png","up_1793449171714_15.png","up_1793449171714_16.png","up_1793449171714_17.png","up_1793449171714_18.png","up_1793449171714_19.png","up_1793456809363_1.png","up_1793456809363_2.png","up_1793456809363_3.png","up_1793456809363_4.png","up_1793456809363_5.png","up_1793456809363_6.png","up_1793456809363_7.png","up_1793456809363_8.png","up_1793456845081_1.png","up_1793458817020_1.png","up_1793458817020_2.png"]);
  const isPaste = n => n && R.kindOf(n) === "カレンダー" && /貼り付け|blank/.test((n.title || "") + n.file);
  const comp = {}; let cur = null, busy = false;
  const css = document.createElement("style");
  css.textContent = `.hmn{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;font-size:14px;color:var(--sub)}
.hmn b{color:var(--ink)}.hmn button{border:0;background:none;color:var(--btn);text-decoration:underline;font:inherit;font-size:14px;cursor:pointer;padding:6px}
.btn.hmb{width:100%;height:54px;font-size:17px;background:#fff;color:var(--btn);border:2px solid var(--acc)}.btn.hmb:hover{background:var(--tint)}
.md .row2.r3{grid-template-columns:1fr 1fr 1fr}
.md .view.hmw::before{content:"はめ込み中…";position:absolute;inset:0;z-index:3;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.75);font-weight:700;font-size:18px;color:var(--btn)}
.hm{position:fixed;inset:0;z-index:70;background:rgba(43,38,34,.6);display:flex;align-items:center;justify-content:center;padding:12px}
.hm .hb{background:#fff;border-radius:14px;width:min(980px,100%);max-height:calc(100vh - 32px);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.25)}
.hm .ht{display:flex;align-items:center;gap:12px;padding:10px 10px 10px 20px;border-bottom:1px solid var(--line)}
.hm .ht h2{flex:1;margin:0;font-family:var(--mincho);font-size:22px}
.hm .ht small{display:block;font-family:var(--body);font-size:13px;color:var(--mute);font-weight:400}
.hm .hx{width:44px;height:44px;border-radius:999px;border:0;background:transparent;color:var(--sub);cursor:pointer;display:flex;align-items:center;justify-content:center}
.hm .hf{display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:10px 20px;border-bottom:1px solid var(--line2);background:var(--bg)}
.hm .hf input[type=search],.hm .hf select{height:42px;border:1px solid var(--line);border-radius:8px;padding:0 10px;font:inherit;font-size:15px;background:#fff;color:var(--ink)}
.hm .hf input[type=search]{flex:1;min-width:160px}
.hm .hf label{display:flex;align-items:center;gap:6px;font-size:15px;cursor:pointer}
.hm .hf .cnt{margin-left:auto;font-size:13px;color:var(--mute)}
.hm .hg{overflow:auto;padding:14px 20px 20px;display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:14px;align-content:start}
.hm .hg button.it{border:0;background:none;padding:0;text-align:left;font:inherit;font-size:13px;cursor:pointer;color:var(--ink)}
.hm .hg button.it img{width:100%;aspect-ratio:1.414;object-fit:contain;background:#fff;border:1px solid var(--line);border-radius:6px;display:block;margin-bottom:4px}
.hm .hg button.it:hover img{border-color:var(--acc);box-shadow:0 0 0 2px var(--acc)}
.hm .more{grid-column:1/-1;justify-self:center;margin-top:6px}
.hm .emp{grid-column:1/-1;text-align:center;color:var(--mute);padding:30px 0}
@media (max-width:640px){.hm{padding:0;align-items:flex-end}.hm .hb{border-radius:16px 16px 0 0;max-height:92vh}.hm .hg{grid-template-columns:repeat(2,minmax(0,1fr));padding:12px}.hm .hf{padding:10px 12px}.hm .ht h2{font-size:19px}}`;
  document.head.appendChild(css);

  async function blobOf(file, v) {
    let r = null;
    try { r = await fetch(IMG + file + (v ? "?v=" + encodeURIComponent(v) : ""), { mode: "cors" }); } catch (e) { r = null; }
    if (!r || !r.ok) { try { r = await fetch("/api/dl?f=" + encodeURIComponent(file), { cache: "no-store" }); } catch (e) { r = null; } }
    if (!r || !r.ok) throw new Error("load");
    return await createImageBitmap(await r.blob());
  }
  function gray(bmp, maxW) {
    const s = Math.min(1, maxW / bmp.width), w = Math.round(bmp.width * s), h = Math.round(bmp.height * s), c = document.createElement("canvas");
    c.width = w; c.height = h; const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, w, h); x.drawImage(bmp, 0, 0, w, h);
    const d = x.getImageData(0, 0, w, h).data, g = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) g[i] = (d[i * 4] * 3 + d[i * 4 + 1] * 6 + d[i * 4 + 2]) / 10;
    return { g, w, h, s };
  }
  function blankArea(bmp) {
    const { g, w, h, s } = gray(bmp, 620), x0 = Math.round(w * .03), x1 = Math.round(w * .97);
    let best = [0, 0], st = -1;
    const lim = Math.round(h * .8);
    for (let y = 0; y <= lim; y++) {
      let dark = 0; if (y < lim) for (let x = x0; x < x1; x++) if (g[y * w + x] < 170) dark++;
      if (y < lim && dark <= 1) { if (st < 0) st = y; }
      else if (st >= 0) { if (y - st > best[1] - best[0]) best = [st, y]; st = -1; }
    }
    if (best[1] - best[0] < h * .2) best = [Math.round(h * .03), Math.round(h * .46)];
    return { x: 0, y: best[0] / s, w: bmp.width, h: (best[1] - best[0]) / s };
  }
  function trim(bmp) {
    const { g, w, h, s } = gray(bmp, 900); let l = w, t = h, r = -1, b = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (g[y * w + x] < 200) { if (x < l) l = x; if (x > r) r = x; if (y < t) t = y; if (y > b) b = y; }
    if (r < 0) return { x: 0, y: 0, w: bmp.width, h: bmp.height };
    const p = 2; l = Math.max(0, l - p); t = Math.max(0, t - p); r = Math.min(w - 1, r + p); b = Math.min(h - 1, b + p);
    const ed = (x0, y0, x1, y1) => { let n = 0, k = 0; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { k++; if (g[y * w + x] < 140) n++; } return n / k; };
    const bd = Math.max(3, Math.round(Math.min(w, h) * .006));
    const own = [ed(l, t, r, t + bd), ed(l, b - bd, r, b), ed(l, t, l + bd, b), ed(r - bd, t, r, b)].filter(v => v > .6).length >= 3;
    return { x: l / s, y: t / s, w: (r - l + 1) / s, h: (b - t + 1) / s, own };
  }
  async function build(cal, nu) {
    const [cb, nb] = await Promise.all([blobOf(cal.file, cal.v), blobOf(nu.file, nu.v)]);
    if (nb.height >= nb.width) { TATE.add(nu.file); throw new Error("tate"); }
    const A = blankArea(cb), T = trim(nb), W = cb.width, H = cb.height;
    const px = W * .018, ptop = Math.min(W * .018, A.h * .03), pbot = Math.min(W * .014, A.h * .025);
    const bw = A.w - px * 2, bh = A.h - ptop - pbot;
    let sc = Math.min(bw / T.w, bh / T.h), cut = T.own ? 1 : 1.06;
    sc = Math.min(sc * cut, Math.max(bw / T.w, bh / T.h));
    const vw = Math.min(T.w, bw / sc), vh = Math.min(T.h, bh / sc);
    T.x += (T.w - vw) / 2; T.y += (T.h - vh) / 2; T.w = vw; T.h = vh;
    const dw = T.w * sc, dh = T.h * sc;
    const c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d");
    x.fillStyle = "#fff"; x.fillRect(0, 0, W, H); x.drawImage(cb, 0, 0);
    x.imageSmoothingQuality = "high";
    const ox = A.x + (A.w - dw) / 2, oy = A.y + ptop + (bh - dh) / 2;
    if (T.own) x.drawImage(nb, T.x, T.y, T.w, T.h, ox, oy, dw, dh);
    else {
      const lw = Math.round(W * .0056), rr = Math.round(W * .011), rect = () => { x.beginPath(); x.roundRect ? x.roundRect(ox, oy, dw, dh, rr) : x.rect(ox, oy, dw, dh); };
      x.save(); rect(); x.clip(); x.fillStyle = "#fff"; x.fillRect(ox, oy, dw, dh); x.drawImage(nb, T.x, T.y, T.w, T.h, ox, oy, dw, dh); x.restore();
      rect(); x.lineWidth = lw; x.strokeStyle = "#000"; x.stroke();
    }
    let blob = await new Promise(res => c.toBlob(res, "image/png"));
    const fb = await createImageBitmap(blob), j = document.createElement("canvas"); j.width = fb.width; j.height = fb.height;
    const jx = j.getContext("2d"); jx.fillStyle = "#fff"; jx.fillRect(0, 0, j.width, j.height); jx.drawImage(fb, 0, 0);
    return { blob, url: URL.createObjectURL(blob), nu, jpg: j.toDataURL("image/jpeg", .92) };
  }

  /* ---------- modal footer ---------- */
  window.RK_MDHOOK = function (n) {
    if (!isPaste(n)) return;
    cur = n;
    const box = document.querySelector(".md .box"); if (!box) return;
    const im = box.querySelector(".view img"), f = box.querySelector(".mdf"), c = comp[n.file];
    if (c) {
      if (im) { im.removeAttribute("data-full"); im.src = c.url; }
      f.innerHTML = `<p class="hmn">はめ込み中：<b>${esc(c.nu.title)}</b><button type="button" data-hoff>外して元に戻す</button></p>
<div class="row2${R.PT ? " r3" : ""}"><button class="btn o" data-hame>${ico("pen", 18)}別の塗り絵にする</button><button class="btn p" data-hsave>${ico("down", 19)}保存する</button>${R.PT ? `<button class="btn ptb" data-hprint>${ico("print", 17)}直接印刷する</button>` : ""}</div>`;
    } else {
      f.insertAdjacentHTML("afterbegin", `<button class="btn hmb" data-hame>${ico("pen", 19)}好きな塗り絵をはめ込む</button><p class="note">横向きの塗り絵を、上の空白にぴったり入れて保存・印刷できます</p>`);
    }
  };

  /* ---------- picker ---------- */
  let pk = null, shown = 40;
  const SEAS = ["春", "夏", "秋", "冬", "通年"];
  const pool = () => R.LIST.filter(x => R.kindOf(x) === "塗り絵" && !TATE.has(x.file));
  function list() {
    const q = (pk.querySelector("[name=q]").value || "").trim(), se = pk.querySelector("[name=se]").value, fv = pk.querySelector("[name=fv]").checked;
    return pool().filter(x => (!se || x.season === se) && (!fv || R.isFav(x.file)) && (!q || ((x.title || "") + " " + (x.genre || "")).indexOf(q) >= 0));
  }
  function draw() {
    const L = list(), g = pk.querySelector(".hg");
    pk.querySelector(".cnt").textContent = L.length + "枚";
    g.innerHTML = L.length ? L.slice(0, shown).map(x => `<button class="it" data-hpick="${esc(x.file)}"><img loading="lazy" alt="" src="${R.sthumb(x)}" onload="if(this.naturalHeight>=this.naturalWidth){this.parentNode.style.display='none';window.RK_HTATE&&RK_HTATE('${esc(x.file)}')}">${esc(x.title)}</button>`).join("") + (L.length > shown ? `<button class="btn g more" data-hmore>もっと見る（残り${L.length - shown}枚）</button>` : "")
      : `<p class="emp">見つかりませんでした</p>`;
  }
  window.RK_HTATE = f => TATE.add(f);
  function openPk() {
    if (pk) pk.remove();
    pk = document.createElement("div"); pk.className = "hm"; pk.setAttribute("role", "dialog"); pk.setAttribute("aria-label", "はめ込む塗り絵を選ぶ");
    pk.innerHTML = `<div class="hb"><div class="ht"><h2>はめ込む塗り絵を選ぶ<small>横向きの塗り絵だけを表示しています</small></h2><button class="hx" data-hclose aria-label="閉じる">${ico("x", 22)}</button></div>
<div class="hf"><input type="search" name="q" placeholder="塗り絵の名前で探す" enterkeyhint="search"><select name="se" aria-label="季節"><option value="">すべての季節</option>${SEAS.map(s => `<option>${s}</option>`).join("")}</select><label><input type="checkbox" name="fv">お気に入りだけ</label><span class="cnt"></span></div><div class="hg"></div></div>`;
    document.body.appendChild(pk); shown = 40; draw();
    pk.addEventListener("input", () => { shown = 40; draw(); pk.querySelector(".hg").scrollTop = 0; });
    pk.addEventListener("click", e => { if (e.target === pk) closePk(); });
  }
  function closePk() { if (pk) { pk.remove(); pk = null; } }

  async function pick(file) {
    const nu = R.LIST.find(x => x.file === file), cal = cur; if (!nu || !cal || busy) return;
    closePk(); busy = true;
    const v = document.querySelector(".md .view"); if (v) v.classList.add("hmw");
    try {
      const c = await build(cal, nu);
      if (comp[cal.file]) URL.revokeObjectURL(comp[cal.file].url);
      comp[cal.file] = c;
    } catch (e) {
      R.toast(e.message === "tate" ? "縦向きの塗り絵ははめ込めません" : "はめ込みに失敗しました", e.message === "tate" ? "横向きの塗り絵を選んでください" : "通信状況を確かめて、もう一度お試しください");
    }
    busy = false; if (v) v.classList.remove("hmw");
    if (cur === cal && document.querySelector(".md.on")) R.openMd(cal.file, "l", "hame");
  }
  function hsave() {
    const c = comp[cur.file]; if (!c) return;
    const a = document.createElement("a"); a.href = c.url; a.download = cur.title.replace(/[（(]貼り付け用[)）]/, "") + "（" + c.nu.title + "）.png"; document.body.appendChild(a); a.click(); a.remove();
    R.markUsed(cur.file); R.logSave(cur.file, "hame", null); R.logSave(c.nu.file, "hame", null); R.refreshCard(cur.file);
    R.toast(`「${c.nu.title}」入りのカレンダーを保存しました`, "A4サイズで印刷してお使いください");
  }
  async function hprint() {
    const c = comp[cur.file]; if (!c) return;
    const win = window.open("", "_blank"); if (win) win.document.write('<p style="font:16px sans-serif;padding:24px">印刷用のPDFを作成しています…</p>');
    try {
      const JsPDF = await R.loadPdf(), doc = new JsPDF({ orientation: "p", unit: "mm", format: "a4" });
      doc.addImage(c.jpg, "JPEG", 0, 0, 210, 297); doc.setProperties({ title: cur.title + "（" + c.nu.title + "）" }); doc.autoPrint();
      const url = URL.createObjectURL(doc.output("blob")); if (win) win.location.href = url; else window.open(url, "_blank");
      R.markPrinted(cur.file); R.logSave(cur.file, "hame", { pr: "1" }); R.logSave(c.nu.file, "hame", { pr: "1" }); R.refreshCard(cur.file);
      R.toast("印刷画面を開きました", "A4サイズで印刷してください");
    } catch (e) { if (win) win.close(); R.toast("印刷用PDFを作れませんでした", "保存してから印刷してください"); }
  }
  document.addEventListener("click", e => {
    const t = e.target.closest("button"); if (!t) return;
    const d = t.dataset;
    if (d.hame !== undefined) { e.stopPropagation(); openPk(); }
    else if (d.hclose !== undefined) closePk();
    else if (d.hmore !== undefined) { shown += 40; draw(); }
    else if (d.hpick) pick(d.hpick);
    else if (d.hsave !== undefined) hsave();
    else if (d.hprint !== undefined) hprint();
    else if (d.hoff !== undefined && cur) { const c = comp[cur.file]; if (c) URL.revokeObjectURL(c.url); delete comp[cur.file]; R.openMd(cur.file, "l", "hame"); }
  }, true);
  document.addEventListener("keydown", e => { if (e.key === "Escape" && pk) { e.stopImmediatePropagation(); closePk(); } }, true);
})();
