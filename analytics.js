// 介護のレクプリ アクセス解析 (Google アナリティクス GA4)
// 各ページの <head> で <script src="/analytics.js" defer></script> として読み込みます。
// 設定を変えたいときは、このファイルだけ直せば全ページに反映されます。
(function () {
  "use strict";

  var ID = "G-7E6G8C2FZR";

  // 管理ページは集計しない
  var p = location.pathname.toLowerCase();
  if (p.indexOf("admin") >= 0) return;

  // 自分のアクセスを数えたくないときは、ブラウザのアドレス欄で
  //   https://rekupuri.com/?noga=1
  // を一度開いてください。その端末のそのブラウザでは以後カウントされなくなります。
  // 解除は ?noga=0 です。
  try {
    var q = new URLSearchParams(location.search).get("noga");
    if (q === "1") localStorage.setItem("nurie_noga", "1");
    if (q === "0") localStorage.removeItem("nurie_noga");
    if (localStorage.getItem("nurie_noga") === "1") return;
  } catch (e) {}

  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + ID;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", ID);
})();
