"""Builds dist/my-workout-plan.html: one self-contained file with the photos and animation code inlined."""
import base64, io, json, os, re
from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__))
P = lambda *a: os.path.join(ROOT, *a)

def jpeg_uri(path, size):
    im = Image.open(path).convert("RGB")
    im.thumbnail((size, size))
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=74, optimize=True)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()

tpl = open(P("src", "template.html"), encoding="utf-8").read()
ids = sorted(set(re.findall(r'img:"([^"]+)"', tpl)))
photos = {i: [jpeg_uri(P("assets", "photos", i, f"{k}.jpg"), 520) for k in (0, 1)] for i in ids}
fig = open(P("src", "figures.js"), encoding="utf-8").read()

out = (tpl.replace("/*IMG_DATA*/", "const IMG = " + json.dumps(photos) + ";")
          .replace("/*FIG_JS*/", fig)
          .replace("BOARD_IMG_URI", jpeg_uri(P("assets", "band-platform.png"), 640)))
os.makedirs(P("dist"), exist_ok=True)
open(P("dist", "my-workout-plan.html"), "w", encoding="utf-8").write(out)
print(f"{len(ids)} photo sets, {len(out) / 1e6:.2f} MB -> dist/my-workout-plan.html")
