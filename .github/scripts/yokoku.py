# 予告（作成中）の塗り絵の本物を扱う。
#  1. 鍵：秘密鍵は R2 の keys/ に置き（名前は推測できない）、公開鍵は yokoku/pub.pem としてリポジトリに置く。
#  2. yokoku/*.enc（公開鍵で暗号化した本物）を復号して、R2 の yokoku/<ランダム>/<ファイル名> に置く。
#     サイトの /api/pre が、アンケートに答えた人にだけここから本物を返す。
#  3. 公開日（data.js の open）を過ぎたものは、本物を images/ に入れて pre を外し、R2 にも上げる。
import base64
import hashlib
import hmac
import io
import os
import re
import secrets
import sys
from datetime import datetime, timedelta, timezone

import boto3
from botocore.config import Config
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

BUCKET = os.environ["R2_BUCKET"]
SECRET = os.environ["AWS_SECRET_ACCESS_KEY"]
s3 = boto3.client(
    "s3",
    endpoint_url=os.environ["R2_ENDPOINT"],
    aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
    aws_secret_access_key=SECRET,
    region_name="auto",
    config=Config(request_checksum_calculation="when_required", response_checksum_validation="when_required"),
)
TYPES = {"png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg"}
changed = []

# ---- 1. 鍵 ----
kname = "keys/" + hmac.new(SECRET.encode(), b"yokoku-private-key", hashlib.sha256).hexdigest()[:40] + ".pem"
try:
    priv = serialization.load_pem_private_key(s3.get_object(Bucket=BUCKET, Key=kname)["Body"].read(), password=None)
except Exception:
    priv = rsa.generate_private_key(public_exponent=65537, key_size=3072)
    s3.put_object(Bucket=BUCKET, Key=kname, ContentType="application/octet-stream", CacheControl="no-store",
                  Body=priv.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()))
    print("::notice::new key made")
pub = priv.public_key().public_bytes(serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo)
os.makedirs("yokoku", exist_ok=True)
if not os.path.exists("yokoku/pub.pem") or open("yokoku/pub.pem", "rb").read() != pub:
    open("yokoku/pub.pem", "wb").write(pub)
    changed.append("yokoku/pub.pem")


def decrypt(blob):
    assert blob[:4] == b"RKY1"
    n = int.from_bytes(blob[4:6], "big")
    key = priv.decrypt(blob[6:6 + n], padding.OAEP(mgf=padding.MGF1(hashes.SHA256()), algorithm=hashes.SHA256(), label=None))
    return AESGCM(key).decrypt(blob[6 + n:18 + n], blob[18 + n:], None)


# R2 上の予告の本物（yokoku/<ランダム>/<名前>）
have = {}
for page in s3.get_paginator("list_objects_v2").paginate(Bucket=BUCKET, Prefix="yokoku/"):
    for o in page.get("Contents", []):
        have[o["Key"].rsplit("/", 1)[-1]] = (o["Key"], o["Size"])

# ---- 3 の判定に使う data.js ----
src = open("data.js", encoding="utf-8").read()
today = (datetime.now(timezone.utc) + timedelta(hours=9)).strftime("%Y-%m-%d")
due = set()
for blk in re.findall(r"\{[^{}]*?\bpre: 1[^{}]*\}", src):
    op = re.search(r'open: "(\d{4}-\d{2}-\d{2})"', blk)
    if op and op.group(1) <= today:
        for k in ("file", "sample"):
            m = re.search(k + r': "([^"]+)"', blk)
            if m:
                due.add(m.group(1))

# ---- 2 と 3 ----
for fn in sorted(os.listdir("yokoku")):
    if not fn.endswith(".enc"):
        continue
    name = fn[:-4]
    real = decrypt(open("yokoku/" + fn, "rb").read())
    ct = TYPES.get(name.rsplit(".", 1)[-1].lower(), "application/octet-stream")
    if name in due:
        open("images/" + name, "wb").write(real)
        s3.put_object(Bucket=BUCKET, Key="images/" + name, Body=real, ContentType=ct, CacheControl="public, max-age=86400")
        if name in have:
            s3.delete_object(Bucket=BUCKET, Key=have[name][0])
        os.remove("yokoku/" + fn)
        changed += ["images/" + name, "yokoku/" + fn]
        print("::notice::released " + name)
        continue
    if name not in have or have[name][1] != len(real):
        if name in have:
            s3.delete_object(Bucket=BUCKET, Key=have[name][0])
        s3.put_object(Bucket=BUCKET, Key="yokoku/" + secrets.token_hex(16) + "/" + name, Body=real,
                      ContentType=ct, CacheControl="private, no-store")
        print("::notice::stored " + name)

# 公開した塗り絵は data.js の pre を外し、v を更新
if any(c.startswith("images/") for c in changed):
    v = str(int(datetime.now(timezone.utc).timestamp() * 1000))

    def fix(m):
        blk = m.group(0)
        f = re.search(r'file: "([^"]+)"', blk)
        if not f or f.group(1) not in due:
            return blk
        blk = re.sub(r",?\s*pre: 1", "", blk)
        return re.sub(r'v: "\d+"', 'v: "' + v + '"', blk)

    src2 = re.sub(r"\{[^{}]*?\bpre: 1[^{}]*\}", fix, src)
    if src2 != src:
        open("data.js", "w", encoding="utf-8").write(src2)
        changed.append("data.js")

open("yokoku_changed.txt", "w").write("\n".join(changed))
print("changed:", changed)
sys.exit(0)
