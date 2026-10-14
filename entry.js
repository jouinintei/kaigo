(function () {
  try {
    if (sessionStorage.getItem("rk_ent")) return;
    var r = document.referrer, h = "";
    try { h = r ? new URL(r).hostname.toLowerCase() : ""; } catch (e) {}
    if (h && h === location.hostname) return;
    var k = !h ? "direct"
      : /google/.test(h) ? "google"
      : /yahoo\./.test(h) ? "yahoo"
      : /bing\.com$/.test(h) ? "bing"
      : /(^|\.)note\.com$/.test(h) ? "note"
      : /(instagram|facebook|fb\.|^t\.co$|^x\.com$|twitter|line\.me)/.test(h) ? "sns"
      : /edgeone\./.test(h) ? "old"
      : "other";
    sessionStorage.setItem("rk_ent", JSON.stringify({ k: k, h: k === "other" ? h.slice(0, 40) : "" }));
  } catch (e) {}
})();
