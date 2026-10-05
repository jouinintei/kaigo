import os

import boto3
from botocore.config import Config

SRC = os.environ["SRC_BUCKET"]
DST = os.environ["DST_BUCKET"]

s3 = boto3.client(
    "s3",
    endpoint_url=os.environ["R2_ENDPOINT"],
    aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
    aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    region_name="auto",
    config=Config(request_checksum_calculation="when_required", response_checksum_validation="when_required"),
)


def listing(bucket):
    out = {}
    for page in s3.get_paginator("list_objects_v2").paginate(Bucket=bucket):
        for o in page.get("Contents", []):
            out[o["Key"]] = o["Size"]
    return out


src = listing(SRC)
dst = listing(DST)
todo = [k for k, sz in src.items() if dst.get(k) != sz]
print(f"src {len(src)} / dst {len(dst)} / todo {len(todo)}")
done = 0
fail = []
for k in todo:
    try:
        o = s3.get_object(Bucket=SRC, Key=k)
        s3.put_object(Bucket=DST, Key=k, Body=o["Body"].read(),
                      ContentType=o.get("ContentType") or "application/octet-stream",
                      CacheControl=o.get("CacheControl") or "public, max-age=3600")
        done += 1
    except Exception as e:
        fail.append(f"{k}: {e}")
print(f"::notice::copied {done}, failed {len(fail)}, dst now {len(listing(DST))}")
for f in fail[:10]:
    print("::warning::" + f[:300])
