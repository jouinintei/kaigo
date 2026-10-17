(function () {
  try {
    if (sessionStorage.getItem("rk_ent")) return;
    var r = document.referrer, h = "";
    try { h = r ? new URL(r).hostname.toLowerCase() : ""; } catch (e) {}
    if (h && h === location.hostname) return;
    var q = "";
    try {
      var sp = new URLSearchParams(location.search);
      q = String(sp.get("src") || sp.get("utm_source") || "").toLowerCase();
    } catch (e) {}
    var ua = navigator.userAgent || "";
    var k = "";
    if (/chatgpt|openai/.test(q) || /(chatgpt\.com|openai\.com)$/.test(h)) k = "chatgpt";
    else if (/copilot/.test(q) || /copilot/.test(h)) k = "copilot";
    else if (/perplexity/.test(q) || /perplexity/.test(h)) k = "perplexity";
    else if (/gemini/.test(q) || /gemini\.google/.test(h)) k = "gemini";
    else if (q === "qr") k = "qr";
    else if (q === "line" || / Line\//.test(ua)) k = "line";
    else if (/instagram/.test(q) || /Instagram/.test(ua)) k = "insta";
    else if (/facebook|^fb$/.test(q) || /FBAN|FBAV|FB_IAB/.test(ua)) k = "fb";
    else if (h) {
      k = /google/.test(h) ? "google"
        : /yahoo\./.test(h) ? "yahoo"
        : /bing\.com$/.test(h) ? "bing"
        : /(^|\.)note\.com$/.test(h) ? "note"
        : /(instagram|facebook|fb\.|^t\.co$|^x\.com$|twitter|line\.me)/.test(h) ? "sns"
        : /edgeone\./.test(h) ? "old"
        : "other";
    }
    else if (/YJApp/.test(ua)) k = "yjapp";
    else if (/ GSA\//.test(ua)) k = "gapp";
    else k = "direct";
    sessionStorage.setItem("rk_ent", JSON.stringify({ k: k, h: k === "other" ? h.slice(0, 40) : "" }));
  } catch (e) {}
})();
