const ACCOUNT_ID = "f2973a9b06bd5d30be681c629f19145e";
const BUCKET = "rekupuri-img-apac";
const PREFIX = "images/";
const ALLOWED_REPO = "jouinintei/kaigo";
const MAX_BYTES = 20 * 1024 * 1024;

const enc = new TextEncoder();

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" }
  });
}

function hex(buf) {
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}
async function sha256Hex(data) {
  return hex(await crypto.subtle.digest("SHA-256", data));
}
async function hmac(key, msg) {
  const k = await crypto.subtle.importKey("raw", typeof key === "string" ? enc.encode(key) : key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return await crypto.subtle.sign("HMAC", k, enc.encode(msg));
}
function s3Encode(s) {
  return encodeURIComponent(s).replace(/[!'()*]/g, c => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

async function r2Request(env, method, name, body, contentType) {
  const host = ACCOUNT_ID + ".r2.cloudflarestorage.com";
  const path = "/" + BUCKET + "/" + (PREFIX + name).split("/").map(s3Encode).join("/");
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const day = amzDate.slice(0, 8);
  const payloadHash = await sha256Hex(body || new Uint8Array(0));
  const headers = {
    "host": host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate
  };
  if (method === "PUT") {
    headers["content-type"] = contentType || "application/octet-stream";
    headers["cache-control"] = "public, max-age=3600";
  }
  const names = Object.keys(headers).sort();
  const canonicalHeaders = names.map(h => h + ":" + headers[h] + "\n").join("");
  const signedHeaders = names.join(";");
  const canonical = [method, path, "", canonicalHeaders, signedHeaders, payloadHash].join("\n");
  const scope = day + "/auto/s3/aws4_request";
  const toSign = ["AWS4-HMAC-SHA256", amzDate, scope, await sha256Hex(enc.encode(canonical))].join("\n");
  let key = await hmac("AWS4" + String(env.R2_SECRET_ACCESS_KEY).trim(), day);
  key = await hmac(key, "auto");
  key = await hmac(key, "s3");
  key = await hmac(key, "aws4_request");
  const sig = hex(await hmac(key, toSign));
  const auth = "AWS4-HMAC-SHA256 Credential=" + String(env.R2_ACCESS_KEY_ID).trim() + "/" + scope +
    ", SignedHeaders=" + signedHeaders + ", Signature=" + sig;
  const h = Object.assign({}, headers, { "Authorization": auth });
  delete h.host;
  return fetch("https://" + host + path, { method: method, headers: h, body: method === "PUT" ? body : undefined });
}

async function checkWriter(request) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  if (!token) return false;
  const res = await fetch("https://api.github.com/repos/" + ALLOWED_REPO, {
    headers: {
      "Authorization": "Bearer " + token,
      "Accept": "application/vnd.github+json",
      "User-Agent": "rekupuri-r2-upload",
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });
  if (!res.ok) return false;
  const r = await res.json();
  return !!(r && r.full_name && r.full_name.toLowerCase() === ALLOWED_REPO && r.permissions && r.permissions.push);
}

function validName(name) {
  return typeof name === "string" && name.length > 0 && name.length <= 200 &&
    !name.includes("/") && !name.includes("\\") && !name.startsWith(".") &&
    /\.(png|jpe?g|webp|gif)$/i.test(name);
}

export async function onRequest(context) {
  const { request, env } = context;
  if (!env || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
    return json({ ok: false, error: "R2の設定(環境変数)がありません" }, 500);
  }
  const url = new URL(request.url);
  const name = url.searchParams.get("name") || "";
  if (!validName(name)) return json({ ok: false, error: "ファイル名が正しくありません" }, 400);
  if (!(await checkWriter(request))) return json({ ok: false, error: "権限がありません" }, 403);

  if (request.method === "GET" || request.method === "HEAD") {
    const r = await r2Request(env, "HEAD", name, null);
    if (r.status === 200) return json({ ok: true, exists: true });
    if (r.status === 404) return json({ ok: true, exists: false });
    return json({ ok: false, error: "R2 " + r.status }, 502);
  }
  if (request.method === "PUT" || request.method === "POST") {
    const buf = new Uint8Array(await request.arrayBuffer());
    if (!buf.length) return json({ ok: false, error: "画像が空です" }, 400);
    if (buf.length > MAX_BYTES) return json({ ok: false, error: "画像が大きすぎます" }, 413);
    const type = request.headers.get("Content-Type") || "application/octet-stream";
    const r = await r2Request(env, "PUT", name, buf, type);
    if (!r.ok) {
      const t = await r.text();
      return json({ ok: false, error: "R2 " + r.status + " " + t.slice(0, 200) }, 502);
    }
    return json({ ok: true, name: name, url: "https://img.rekupuri.com/" + PREFIX + name });
  }
  return json({ ok: false, error: "method" }, 405);
}
