import sys, json, glob, os
from PIL import Image, ImageDraw
outdir, prefix = sys.argv[1], sys.argv[2]
meta = json.load(open(sys.argv[3]))
files = [m['file'] for m in meta]
per = 30; cols = 6; cw, ch = 260, 200
for k in range(0, len(files), per):
    chunk = files[k:k+per]
    rows = (len(chunk)+cols-1)//cols
    S = Image.new('L', (cols*cw, rows*ch), 140); d = ImageDraw.Draw(S)
    for i, f in enumerate(chunk):
        im = Image.open(os.path.join(outdir, f + '.jpg')); im.thumbnail((cw-8, ch-20))
        x, y = (i%cols)*cw, (i//cols)*ch
        S.paste(im, (x+4, y+16)); d.text((x+4, y+2), f"{k+i}:{f[:30]}", fill=0)
    S.save(f'audit_out/{prefix}_{k//per:02d}.jpg', quality=82)
print((len(files)+per-1)//per)
