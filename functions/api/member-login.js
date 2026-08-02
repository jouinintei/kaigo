// 照合係: 会員パスワードをサーバー側で確認し、合っていれば署名付きの通行証(クッキー)を発行する
// 必要な環境変数: MEMBER_PASSWORD, MEMBER_SECRET

async function hmacHex(message, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function onRequest(context) {
  const { request, env } = context;
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });

  if (!env || !env.MEMBER_PASSWORD || !env.MEMBER_SECRET) {
    return new Response(JSON.stringify({ ok: false, error: "server_not_configured" }),
      { status: 500, headers });
  }

  const url = new URL(request.url);
  const pw = (url.searchParams.get("pw") || "").trim();

  if (pw !== env.MEMBER_PASSWORD) {
    return new Response(JSON.stringify({ ok: false }), { status: 401, headers });
  }

  // 通行証はパスワードにも紐づける(パスワードを変えると古い通行証は全部無効になる)
  const token = await hmacHex("member|" + env.MEMBER_PASSWORD, env.MEMBER_SECRET);
  headers.append(
    "Set-Cookie",
    "rk_member=" + token + "; Path=/; Max-Age=15552000; SameSite=Lax; Secure"
  );
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
}
