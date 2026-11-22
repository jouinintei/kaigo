# 「似た塗り絵」用に、図柄の近さ（CLIPの画像特徴）から各絵の近い絵を計算して R2 の search/sim.json に置く。
# 特徴量は search/sim_emb.npz にためておき、新しく増えた・差し替えた絵だけ計算する。
import io
import json
import os
import re
import sys

import boto3
import numpy as np
from botocore.config import Config
from PIL import Image

TOP = 30
BUCKET = os.environ["R2_BUCKET"]
s3 = boto3.client(
    "s3",
    endpoint_url=os.environ["R2_ENDPOINT"],
    aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
    aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    region_name="auto",
    config=Config(request_checksum_calculation="when_required", response_checksum_validation="when_required"),
)

src = open("data.js", encoding="utf-8").read()
items = []
for blk in re.findall(r"\{[^{}]*?file: \"[^\"]+\"[^{}]*\}", src):
    f = re.search(r'file: "([^"]+)"', blk).group(1)
    k = re.search(r'kind: "([^"]+)"', blk)
    items.append((f, k.group(1) if k else "塗り絵"))

# サムネイル（thumbs_s/）の更新時刻
mod = {}
for page in s3.get_paginator("list_objects_v2").paginate(Bucket=BUCKET, Prefix="thumbs_s/"):
    for o in page.get("Contents", []):
        mod[o["Key"][len("thumbs_s/"):-4]] = o["LastModified"].timestamp()

emb, stamp = {}, {}
try:
    z = np.load(io.BytesIO(s3.get_object(Bucket=BUCKET, Key="search/sim_emb.npz")["Body"].read()), allow_pickle=False)
    for f, t, v in zip(z["files"], z["stamps"], z["vecs"]):
        emb[str(f)], stamp[str(f)] = v, float(t)
except Exception as e:
    print("no cache:", e)

todo = [f for f, _ in items if f in mod and (f not in emb or stamp.get(f, 0) < mod[f])]
print(f"items {len(items)} / cached {len(emb)} / todo {len(todo)}")

if todo:
    try:
        import open_clip
        import torch
    except ImportError:
        print("need model packages")
        sys.exit(3)
    torch.set_num_threads(os.cpu_count() or 2)
    model, _, pre = open_clip.create_model_and_transforms("ViT-B-32", pretrained="laion2b_s34b_b79k")
    model.eval()
    B = 32
    for i in range(0, len(todo), B):
        batch, names = [], []
        for f in todo[i:i + B]:
            try:
                im = Image.open(io.BytesIO(s3.get_object(Bucket=BUCKET, Key="thumbs_s/" + f + ".jpg")["Body"].read())).convert("RGB")
                batch.append(pre(im)); names.append(f)
            except Exception as e:
                print("::warning::" + f + " " + str(e)[:200])
        if not batch:
            continue
        with torch.no_grad():
            v = model.encode_image(torch.stack(batch)).float()
            v = v / v.norm(dim=-1, keepdim=True)
        for f, x in zip(names, v.numpy()):
            emb[f], stamp[f] = x.astype(np.float16), mod[f]
        print(f"{min(i + B, len(todo))}/{len(todo)}", flush=True)
    keep = [f for f in emb if f in mod]
    b = io.BytesIO()
    np.savez_compressed(b, files=np.array(keep), stamps=np.array([stamp[f] for f in keep]),
                        vecs=np.stack([emb[f] for f in keep]).astype(np.float16))
    s3.put_object(Bucket=BUCKET, Key="search/sim_emb.npz", Body=b.getvalue(), ContentType="application/octet-stream")

out = {}
for kind in set(k for _, k in items):
    fs = [f for f, k in items if k == kind and f in emb]
    if len(fs) < 2:
        continue
    M = np.stack([emb[f] for f in fs]).astype(np.float32)
    S = M @ M.T
    np.fill_diagonal(S, -1)
    for i, f in enumerate(fs):
        idx = np.argsort(-S[i])[:TOP]
        out[f] = [fs[j] for j in idx]

body = json.dumps(out, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
s3.put_object(Bucket=BUCKET, Key="search/sim.json", Body=body,
              ContentType="application/json; charset=utf-8", CacheControl="public, max-age=300")
print(f"::notice::sim {len(out)} files, {len(body)} bytes, computed {len(todo)}")
sys.exit(0)
