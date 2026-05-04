from __future__ import annotations

from pathlib import Path


CANVAS_WIDTH = 647
CANVAS_HEIGHT = 759


CALLOUTS = [
    {
        "id": 1,
        "label_pos": (38, 724),
        "boxes": [(16, 640, 49, 86, 10)],
    },
    {
        "id": 2,
        "label_pos": (198, 691),
        "boxes": [(195, 643, 48, 82, 10)],
    },
    {
        "id": 3,
        "label_pos": (357, 582),
        "boxes": [(272, 574, 334, 153, 12)],
    },
    {
        "id": 4,
        "label_pos": (603, 548),
        "boxes": [(551, 430, 67, 236, 12)],
    },
    {
        "id": 5,
        "label_pos": (605, 393),
        "boxes": [(551, 273, 67, 131, 12)],
    },
    {
        "id": 6,
        "label_pos": (455, 470),
        "boxes": [(344, 455, 211, 74, 12)],
    },
    {
        "id": 7,
        "label_pos": (604, 305),
        "boxes": [(551, 186, 67, 131, 12)],
    },
    {
        "id": 8,
        "label_pos": (506, 216),
        "boxes": [(486, 139, 118, 114, 12)],
    },
    {
        "id": 9,
        "label_pos": (556, 112),
        "boxes": [(519, 62, 100, 63, 12)],
    },
    {
        "id": 10,
        "label_pos": (400, 190),
        "boxes": [(325, 17, 129, 129, 14)],
    },
    {
        "id": 11,
        "label_pos": (247, 132),
        "boxes": [(191, 12, 134, 153, 14)],
    },
    {
        "id": 12,
        "label_pos": (107, 82),
        "boxes": [(74, 13, 106, 64, 12)],
    },
    {
        "id": 13,
        "label_pos": (86, 189),
        "boxes": [(18, 81, 69, 183, 12)],
    },
    {
        "id": 14,
        "label_pos": (86, 331),
        "boxes": [(18, 266, 69, 182, 12)],
    },
    {
        "id": 15,
        "label_pos": (316, 404),
        "boxes": [(242, 341, 123, 111, 12)],
    },
    {
        "id": 16,
        "label_pos": (240, 253),
        "boxes": [(229, 217, 148, 95, 12)],
    },
]


SVG_HEADER = """<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#8d0000" flood-opacity="0.35"/>
    </filter>
    <style>
      .box {{
        fill: none;
        stroke: #ff2a2a;
        stroke-width: 6;
        filter: url(#shadow);
      }}
      .label {{
        fill: #ffd21a;
        font-family: Arial, Helvetica, sans-serif;
        font-weight: 700;
        font-size: 34px;
        paint-order: stroke;
        stroke: #9a4200;
        stroke-width: 3px;
        stroke-linejoin: round;
      }}
    </style>
  </defs>
  <image href="{base_name}" x="0" y="0" width="{width}" height="{height}" preserveAspectRatio="none" />
"""


def box_svg(x: int, y: int, width: int, height: int, radius: int) -> str:
    return (
        f'  <rect class="box" x="{x}" y="{y}" width="{width}" '
        f'height="{height}" rx="{radius}" ry="{radius}" />'
    )


def label_svg(callout_id: int, x: int, y: int) -> str:
    return f'  <text class="label" x="{x}" y="{y}">{callout_id}</text>'


def build_svg(base_name: str) -> str:
    lines: list[str] = [SVG_HEADER.format(width=CANVAS_WIDTH, height=CANVAS_HEIGHT, base_name=base_name)]
    for callout in CALLOUTS:
        for box in callout["boxes"]:
            lines.append(box_svg(*box))
        lines.append(label_svg(callout["id"], *callout["label_pos"]))
    lines.append("</svg>\n")
    return "\n".join(lines)


def render_svg_png(svg_path: Path, png_path: Path) -> bool:
    try:
        import cairosvg

        cairosvg.svg2png(
            url=str(svg_path),
            write_to=str(png_path),
            output_width=CANVAS_WIDTH,
            output_height=CANVAS_HEIGHT,
        )
        return True
    except Exception:
        return False


def render_composite(base_path: Path, png_path: Path) -> bool:
    try:
        from PIL import Image, ImageDraw, ImageFont

        image = Image.open(base_path).convert("RGBA").resize((CANVAS_WIDTH, CANVAS_HEIGHT))
        draw = ImageDraw.Draw(image)
        try:
            font = ImageFont.truetype("arial.ttf", 34)
        except Exception:
            font = ImageFont.load_default()

        for callout in CALLOUTS:
            for x, y, width, height, radius in callout["boxes"]:
                draw.rounded_rectangle(
                    (x, y, x + width, y + height),
                    radius=radius,
                    outline="#ff2a2a",
                    width=6,
                )
            draw.text(callout["label_pos"], str(callout["id"]), fill="#ffd21a", font=font, stroke_width=2, stroke_fill="#9a4200")

        image.save(png_path)
        return True
    except Exception:
        return False


def main() -> None:
    docs_dir = Path(__file__).resolve().parent
    base_path = docs_dir / "handysense-layout-base.png"
    svg_path = docs_dir / "handysense-layout-overlay.svg"
    overlay_png_path = docs_dir / "handysense-layout-overlay.png"
    composite_png_path = docs_dir / "handysense-layout-annotated.png"

    svg_path.write_text(build_svg(base_path.name), encoding="utf-8")

    if render_svg_png(svg_path, overlay_png_path):
        print(f"Wrote {svg_path.name} and {overlay_png_path.name}")
    else:
        print(f"Wrote {svg_path.name}")
        print("Overlay PNG export skipped because CairoSVG is unavailable.")

    if base_path.exists() and render_composite(base_path, composite_png_path):
        print(f"Wrote {composite_png_path.name}")
    else:
        print(f"Drop the layout screenshot at {base_path.name} to render a combined PNG.")


if __name__ == "__main__":
    main()
