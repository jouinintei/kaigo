import json
import os
import re

import boto3
import pykakasi
from botocore.config import Config

KANJI = re.compile(r"[一-龯々〆ヵヶ]")

src = open("data.js", encoding="utf-8").read()
items = re.findall(r'\{[^{}]*?title: "((?:[^"\\]|\\.)*)"[^{}]*?file: "((?:[^"\\]|\\.)*)"', src)
genres = set(re.findall(r'genre: "((?:[^"\\]|\\.)*)"', src))

kks = pykakasi.kakasi()
words = {}


def yomi(text):
    out = []
    for it in kks.convert(text):
        o, h = it["orig"], it["hira"]
        if KANJI.search(o) and o != h:
            words.setdefault(o, h)
        out.append(h)
    return "".join(out)


titles = {}
for title, file in items:
    t = title.replace('\\"', '"').replace("\\\\", "\\")
    y = yomi(t)
    if y and y != t:
        titles[file] = y
for g in genres:
    yomi(g)

body = json.dumps({"t": titles, "w": words}, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
print(f"titles {len(titles)} / words {len(words)} / {len(body)} bytes")

s3 = boto3.client(
    "s3",
    endpoint_url=os.environ["R2_ENDPOINT"],
    aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
    aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    region_name="auto",
    config=Config(request_checksum_calculation="when_required", response_checksum_validation="when_required"),
)
s3.put_object(Bucket=os.environ["R2_BUCKET"], Key="search/yomi.json", Body=body,
              ContentType="application/json; charset=utf-8", CacheControl="public, max-age=300")
print(f"::notice::yomi {len(titles)} titles, {len(words)} words")
