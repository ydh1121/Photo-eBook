#!/usr/bin/env python3
"""Deterministically convert an approved PNG master to a WebP delivery asset."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path, help="Approved PNG source")
    parser.add_argument("output", type=Path, help="Destination .webp path")
    parser.add_argument("--quality", type=int, default=88)
    args = parser.parse_args()

    if not 1 <= args.quality <= 100:
        parser.error("--quality must be between 1 and 100")
    if args.input.suffix.lower() != ".png":
        parser.error("input must be a PNG")
    if args.output.suffix.lower() != ".webp":
        parser.error("output must end in .webp")

    with Image.open(args.input) as source:
        source.load()
        width, height = source.size
        if source.mode in {"RGBA", "LA"} or "transparency" in source.info:
            converted = source.convert("RGBA")
        else:
            converted = source.convert("RGB")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    converted.save(
        args.output,
        format="WEBP",
        quality=args.quality,
        method=6,
        lossless=False,
        exif=b"",
    )

    head = args.output.read_bytes()[:12]
    if len(head) < 12 or head[:4] != b"RIFF" or head[8:12] != b"WEBP":
        raise SystemExit("output is not a RIFF/WEBP asset")

    with Image.open(args.output) as verified:
        verified.load()
        if verified.size != (width, height):
            raise SystemExit(
                f"dimension mismatch: source={(width, height)} output={verified.size}"
            )

    print(
        json.dumps(
            {
                "input": str(args.input),
                "output": str(args.output),
                "width": width,
                "height": height,
                "bytes": args.output.stat().st_size,
                "sha256": sha256(args.output),
                "quality": args.quality,
            },
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
