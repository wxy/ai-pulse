#!/usr/bin/env python3
"""
Generate macOS 26 app icon: apply rounded-rect mask (185.4px radius on 1024px canvas)
to the square AIPulse.png, produce all 10 iconset sizes, and package into AIPulse.icns.

Usage:  python3 scripts/generate-icons.py
Output: Resources/AIPulse.iconset/  +  Resources/AIPulse.icns
"""

import os
import subprocess
from PIL import Image, ImageDraw

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RESOURCES = os.path.join(PROJECT_ROOT, "Resources")
SOURCE_PNG = os.path.join(RESOURCES, "AIPulse.png")
ICONSET = os.path.join(RESOURCES, "AIPulse.iconset")
ICNS = os.path.join(RESOURCES, "AIPulse.icns")

CANVAS = 1024
CORNER_RADIUS = 185.4  # macOS 26 official rounded-rect corner radius

# Standard macOS iconset sizes: (logical, scale, filename)
SIZES = [
    (16,  1, "icon_16x16.png"),
    (16,  2, "icon_16x16@2x.png"),
    (32,  1, "icon_32x32.png"),
    (32,  2, "icon_32x32@2x.png"),
    (128, 1, "icon_128x128.png"),
    (128, 2, "icon_128x128@2x.png"),
    (256, 1, "icon_256x256.png"),
    (256, 2, "icon_256x256@2x.png"),
    (512, 1, "icon_512x512.png"),
    (512, 2, "icon_512x512@2x.png"),
]


def rounded_rect_mask(size, radius):
    """Create an alpha mask: white rounded rect on transparent background."""
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([(0, 0), (size - 1, size - 1)], radius=radius, fill=255)
    return mask


def make_rounded_icon(source: Image.Image) -> Image.Image:
    """Apply the macOS-26 rounded-rect mask to a square source image."""
    # Scale radius proportionally if source isn't exactly CANVAS
    scale = source.width / CANVAS
    radius = CORNER_RADIUS * scale

    # Generate mask at source resolution
    mask = rounded_rect_mask(source.width, radius)

    # Apply mask to alpha channel
    result = source.copy()
    result.putalpha(mask)
    return result


def main():
    print(f"Loading source: {SOURCE_PNG}")
    source = Image.open(SOURCE_PNG).convert("RGBA")
    print(f"  Size: {source.size}, Mode: {source.mode}")

    # Apply rounded-rect mask at full resolution
    print(f"Applying rounded-rect mask (r={CORNER_RADIUS}px @ {CANVAS}x{CANVAS})...")
    rounded = make_rounded_icon(source)

    # Write iconset
    os.makedirs(ICONSET, exist_ok=True)
    for logical, scale, filename in SIZES:
        px = logical * scale
        img = rounded.resize((px, px), Image.LANCZOS)
        path = os.path.join(ICONSET, filename)
        img.save(path, "PNG")
        print(f"  {filename:24s}  {px}x{px}")

    # Generate .icns via iconutil
    print(f"\nGenerating .icns via iconutil...")
    subprocess.run(["iconutil", "-c", "icns", ICONSET], check=True)
    print(f"  → {ICNS}")
    print("Done.")


if __name__ == "__main__":
    main()
