import io
import os
import sys

import boto3
from botocore.config import Config
from PIL import Image

BUCKET = os.environ["R2_BUCKET"]
SRC = "images/"
DST = "thumbs/"
MAX_SIDE = 1000
QUALITY = 82
# 一覧のカード用の小さいサムネイル（軽量）
DST_S = "thumbs_s/"
MAX_SIDE_S = 600
QUALITY_S = 74

s3 = boto3.client(
    "s3",
    endpoint_url=os.environ["R2_ENDPOINT"],
    aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
    aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    region_name="auto",
    config=Config(request_checksum_calculation="when_required", response_checksum_validation="when_required"),
)


def listing(prefix):
    out = {}
    for page in s3.get_paginator("list_objects_v2").paginate(Bucket=BUCKET, Prefix=prefix):
        for o in page.get("Contents", []):
            out[o["Key"][len(prefix):]] = o["LastModified"]
    return out


def make(data, side=MAX_SIDE, q=QUALITY):
    im = Image.open(io.BytesIO(data))
    im.load()
    if im.mode in ("1", "L", "LA", "I;16", "I"):
        im = im.convert("L")
    else:
        rgba = im.convert("RGBA")
        bg = Image.new("RGB", rgba.size, (255, 255, 255))
        bg.paste(rgba, mask=rgba.split()[3])
        im = bg
    im.thumbnail((side, side), Image.LANCZOS)
    b = io.BytesIO()
    im.save(b, "JPEG", quality=q, optimize=True, progressive=True)
    return b.getvalue()


src = listing(SRC)
dst = listing(DST)
dst_s = listing(DST_S)
need = lambda d, k, t: k + ".jpg" not in d or d[k + ".jpg"] < t
todo = [k for k, t in src.items() if k and (need(dst, k, t) or need(dst_s, k, t))]
print(f"images {len(src)} / thumbs {len(dst)} / small {len(dst_s)} / todo {len(todo)}")
done = 0
fail = []
for k in todo:
    try:
        data = s3.get_object(Bucket=BUCKET, Key=SRC + k)["Body"].read()
        t = src[k]
        if need(dst, k, t):
            s3.put_object(Bucket=BUCKET, Key=DST + k + ".jpg", Body=make(data),
                          ContentType="image/jpeg", CacheControl="public, max-age=3600")
        if need(dst_s, k, t):
            s3.put_object(Bucket=BUCKET, Key=DST_S + k + ".jpg", Body=make(data, MAX_SIDE_S, QUALITY_S),
                          ContentType="image/jpeg", CacheControl="public, max-age=86400")
        done += 1
    except Exception as e:
        fail.append(f"{k}: {e}")
print(f"::notice::thumbs made {done}, failed {len(fail)}")
for f in fail[:10]:
    print("::warning::" + f[:300])
sys.exit(0)
