"""Dựng bộ icon "cáo Hanni trên nền đỏ" từ mascot public/anhloading.png.

Favicon, icon PWA và icon iOS dùng MẶT cáo căn giữa (đầu cáo nghiêng, tai trái
thò xa sang trái — căn theo khung đầu thì mặt lệch hẳn sang phải), viền kem
kiểu sticker để cáo đỏ không chìm vào nền đỏ, phần cổ dán sát mép dưới để
không lộ đường cắt. Ở 16px vẫn nhận ra mặt cáo; nguyên con thì chỉ còn 1 chấm.
Logo chữ Hanni (public/brand/hanni.png) giữ nguyên cho thương hiệu trong trang.

Chạy (cần Pillow):  python3 scripts/make-icons.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
FOX = Image.open(ROOT / "public/anhloading.png").convert("RGBA")
# Đỏ của logo Hanni: sáng dần lên phía trên.
TOP, BOTTOM = (200, 24, 30), (140, 8, 14)
# Vùng đầu cáo trong ảnh gốc 1367x1150 và tâm mặt (giữa 2 mắt, trên mũi).
HEAD = (262, 30, 1000, 660)
FACE_X = 725
OUTLINE = 16


def background(size: int) -> Image.Image:
    bg = Image.new("RGBA", (size, size))
    draw = ImageDraw.Draw(bg)
    for y in range(size):
        t = y / max(1, size - 1)
        color = tuple(int(TOP[i] * (1 - t) + BOTTOM[i] * t) for i in range(3))
        draw.line([(0, y), (size, y)], fill=color + (255,))
    return bg


def sticker(img: Image.Image, width: int) -> Image.Image:
    """Viền kem quanh hình (dãn kênh alpha rồi tô màu)."""
    alpha = img.getchannel("A").point(lambda v: 255 if v > 60 else 0)
    ring = Image.new("RGBA", img.size, (255, 246, 232, 0))
    ring.putalpha(alpha.filter(ImageFilter.MaxFilter(width * 2 + 1)))
    out = Image.new("RGBA", img.size, (0, 0, 0, 0))
    out.alpha_composite(ring)
    out.alpha_composite(img)
    return out


def fox_icon(size: int, *, fill: float = 1.05, radius: float = 0.22) -> Image.Image:
    """`fill`: chiều cao đầu cáo so với cạnh icon; `radius`: bo góc (0 = vuông,
    để iOS/Android tự cắt theo khuôn của họ)."""
    part = FOX.crop(HEAD)
    pad = OUTLINE * 2
    padded = Image.new("RGBA", (part.width + pad * 2, part.height + pad), (0, 0, 0, 0))
    padded.paste(part, (pad, pad))
    part = sticker(padded, OUTLINE)
    scale = size * fill / part.height
    part = part.resize((max(1, round(part.width * scale)), max(1, round(part.height * scale))), Image.LANCZOS)
    face = (FACE_X - HEAD[0] + pad) * scale
    icon = background(size)
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    layer.paste(part, (round(size / 2 - face), size - part.height), part)
    icon.alpha_composite(layer)
    if radius:
        mask = Image.new("L", (size, size), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, size - 1, size - 1], radius=round(size * radius), fill=255)
        icon.putalpha(Image.composite(icon.getchannel("A"), Image.new("L", (size, size), 0), mask))
    return icon


def main() -> None:
    icons = ROOT / "public/icons"
    fox_icon(192).save(icons / "icon-192.png", optimize=True)
    fox_icon(512).save(icons / "icon-512.png", optimize=True)
    # iOS tự bo góc — góc trong suốt sẽ thành nền đen, nên để vuông kín nền.
    fox_icon(180, radius=0).save(icons / "apple-touch-icon.png", optimize=True)
    # Maskable: Android cắt theo khuôn (tròn/squircle), chỉ chắc chắn giữ vòng
    # tròn 80% ở giữa → thu nhỏ để mặt cáo nằm trọn trong vùng an toàn.
    fox_icon(512, radius=0, fill=0.9).save(icons / "icon-maskable-512.png", optimize=True)
    fox_icon(256).save(ROOT / "app/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    print("Đã dựng icon-192/512, apple-touch-icon, icon-maskable-512, app/favicon.ico")


if __name__ == "__main__":
    main()
