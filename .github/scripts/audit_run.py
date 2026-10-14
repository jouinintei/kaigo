import io, json, os, re, sys
import boto3
from botocore.config import Config
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(__file__))
from audit_port import frame
s3 = boto3.client("s3", endpoint_url=os.environ["R2_ENDPOINT"], aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
                  aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"], region_name="auto",
                  config=Config(request_checksum_calculation="when_required", response_checksum_validation="when_required"))
src = open("data.js", encoding="utf-8").read()
items = []
for r in re.findall(r"\{([^{}]*)\}", src):
    k = re.search(r'kind: "([^"]+)"', r)
    if k and k.group(1) != "塗り絵":
        continue
    items.append((re.search(r'title: "([^"]+)"', r).group(1), re.search(r'file: "([^"]+)"', r).group(1)))
os.makedirs("audit_out", exist_ok=True)
res, crops = [], []
for t, f in items:
    if os.path.exists("images/" + f):
        continue
    data = s3.get_object(Bucket="rekupuri-img-apac", Key="images/" + f)["Body"].read()
    out, meta = frame(Image.open(io.BytesIO(data)))
    ctx = meta.pop("_ctx")
    meta["file"], meta["title"] = f, t
    res.append(meta)
    if meta["under"] > 0.05:
        crops.append((f, ctx))
json.dump(res, open("audit_out/meta.json", "w"), ensure_ascii=False, default=float)
cw, chh, cols, per = 520, 250, 3, 18
for k in range(0, len(crops), per):
    ch = crops[k:k + per]
    rows = (len(ch) + cols - 1) // cols
    S = Image.new("RGB", (cols * cw, rows * chh), (150, 150, 150)); d = ImageDraw.Draw(S)
    for i, (f, im) in enumerate(ch):
        im.thumbnail((cw - 8, chh - 20)); x, y = (i % cols) * cw, (i // cols) * chh
        S.paste(im, (x + 4, y + 18)); d.text((x + 4, y + 3), f"{k+i}:{f}", fill=(0, 0, 0))
    S.save(f"audit_out/c_{k//per}.jpg", quality=85)
print(f"::notice::audit {len(res)} crops {len(crops)}")
