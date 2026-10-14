import io, json, os, re, sys
import boto3
from botocore.config import Config
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from audit_port import frame

s3 = boto3.client("s3", endpoint_url=os.environ["R2_ENDPOINT"],
                  aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
                  aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"], region_name="auto",
                  config=Config(request_checksum_calculation="when_required", response_checksum_validation="when_required"))
B = "rekupuri-img-apac"
src = open("data.js", encoding="utf-8").read()
items = []
for r in re.findall(r"\{([^{}]*)\}", src):
    k = re.search(r'kind: "([^"]+)"', r)
    if k and k.group(1) != "塗り絵":
        continue
    items.append((re.search(r'title: "([^"]+)"', r).group(1), re.search(r'file: "([^"]+)"', r).group(1)))
res = []
for t, f in items:
    if os.path.exists("images/" + f):
        continue
    try:
        data = s3.get_object(Bucket=B, Key="images/" + f)["Body"].read()
        out, meta = frame(Image.open(io.BytesIO(data)))
        out.thumbnail((700, 700))
        os.makedirs("audit_thumbs", exist_ok=True)
        out.save("audit_thumbs/" + f + ".jpg", quality=80)
        meta["title"], meta["file"] = t, f
        res.append(meta)
    except Exception as e:
        res.append({"file": f, "title": t, "error": str(e)[:200]})
os.makedirs("audit_out", exist_ok=True)
json.dump([r for r in res if "error" not in r], open("audit_out/meta.json", "w"), ensure_ascii=False, default=float)
json.dump([r for r in res if "error" in r], open("audit_out/errors.json", "w"), ensure_ascii=False)
print(f"::notice::audit {len(res)}")
