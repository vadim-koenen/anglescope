#!/usr/bin/env python3
"""Render AngleScope walkthrough slides as PNG frames."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


W, H = 1280, 720


SLIDES = [
    {
        "kicker": "AngleScope demo",
        "title": "Creative intelligence for ad-angle discovery",
        "body": "Turn public ad examples into ranked winning angles and new creative briefs.",
        "badge": "Full server demo: TikTok + OpenAI",
        "visual": "dashboard",
    },
    {
        "kicker": "Step 1",
        "title": "Enter a vertical and keyword",
        "body": "Use a buyer-style search like weight loss supplement plus shilajit, then enable AI vision.",
        "badge": "Input intent",
        "visual": "input",
    },
    {
        "kicker": "Step 2",
        "title": "Pull live public ad examples",
        "body": "AngleScope combines seed examples with best-effort TikTok Creative Center Top Ads results.",
        "badge": "TikTok live source",
        "visual": "ads",
    },
    {
        "kicker": "Step 3",
        "title": "Deconstruct hooks and offers",
        "body": "OpenAI classifies hook, emotional angle, format, offer mechanic, CTA, claims, and compliance risk.",
        "badge": "Structured AI analysis",
        "visual": "analysis",
    },
    {
        "kicker": "Step 4",
        "title": "Rank recurring winning angles",
        "body": "The strongest patterns rise to the top with supporting hooks and source-ad evidence.",
        "badge": "Evidence-backed clusters",
        "visual": "clusters",
    },
    {
        "kicker": "Step 5",
        "title": "Generate new creative concepts",
        "body": "Pick an angle, enter offer details, and generate platform-specific briefs with copy and image direction.",
        "badge": "Creative briefs",
        "visual": "concepts",
    },
    {
        "kicker": "Why this matters",
        "title": "Built for the real media-buyer workflow",
        "body": "No fake spend dashboard. AngleScope focuses on the leverage point: finding angles worth testing.",
        "badge": "Marketing judgment + AI implementation",
        "visual": "summary",
    },
]


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial Bold.ttf" if bold else "/Library/Fonts/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Helvetica Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Helvetica.ttf",
    ]

    for candidate in candidates:
        path = Path(candidate)
        if path.exists():
            return ImageFont.truetype(str(path), size=size)

    return ImageFont.load_default()


FONTS = {
    "kicker": font(15, True),
    "title": font(48, True),
    "body": font(24),
    "badge": font(17, True),
    "nav": font(13, True),
    "logo": font(24, True),
    "small": font(13, True),
    "mid": font(17, True),
    "copy": font(15, True),
    "panel": font(22, True),
}


def wrap(text: str, max_chars: int) -> list[str]:
    lines: list[str] = []
    line = ""
    for word in text.split():
        candidate = f"{line} {word}".strip()
        if len(candidate) > max_chars and line:
            lines.append(line)
            line = word
        else:
            line = candidate
    if line:
        lines.append(line)
    return lines


def draw_text(draw: ImageDraw.ImageDraw, lines: str | list[str], xy: tuple[int, int], fill: str, kind: str, line_height: int | None = None) -> None:
    x, y = xy
    chosen = FONTS[kind]
    if isinstance(lines, str):
        lines = [lines]
    for line in lines:
        draw.text((x, y), line, fill=fill, font=chosen)
        y += line_height or int(chosen.size * 1.28)


def round_rect(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], fill: str, outline: str | None = None, radius: int = 10, width: int = 1) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def draw_top_bar(draw: ImageDraw.ImageDraw) -> None:
    round_rect(draw, (64, 44, 1216, 102), "#ffffff", "#d8e0ea", 10)
    draw_text(draw, "AngleScope", (88, 61), "#172033", "logo")

    x = 708
    badges = ["Analyze wired", "Generate wired", "TikTok live source", "OpenAI ready"]
    for badge in badges:
        bbox = draw.textbbox((0, 0), badge, font=FONTS["nav"])
        width = bbox[2] - bbox[0] + 28
        is_tiktok = "TikTok" in badge
        round_rect(draw, (x, 59, x + width, 87), "#e9f8f2" if is_tiktok else "#fff4df", "#e5dfd5", 6)
        draw_text(draw, badge, (x + 14, 65), "#146b50" if is_tiktok else "#72430d", "nav")
        x += width + 10


def draw_mini_app(draw: ImageDraw.ImageDraw, visual: str) -> None:
    round_rect(draw, (690, 136, 1184, 574), "#ffffff", "#d8e0ea", 14)
    round_rect(draw, (718, 166, 928, 212), "#f8fafc", "#d5dde8", 8)
    round_rect(draw, (944, 166, 1094, 212), "#f8fafc", "#d5dde8", 8)
    round_rect(draw, (1110, 166, 1156, 212), "#14795d", None, 8)
    draw_text(draw, "weight loss supplement", (734, 181), "#172033", "copy")
    draw_text(draw, "shilajit", (960, 181), "#172033", "copy")
    draw_text(draw, "Analyze", (1049, 179), "#14795d", "copy")

    if visual == "input":
        round_rect(draw, (718, 250, 1138, 336), "#eefaf4", "#a8d9c6", 10)
        draw_text(draw, "1. Search a vertical", (740, 270), "#126046", "panel")
        draw_text(draw, "Enable AI vision for stronger deconstruction.", (740, 304), "#4b6472", "copy")
        return

    if visual == "ads":
        for i, label in enumerate(["TikTok", "Seed", "Seed"]):
            x = 724 + i * 142
            round_rect(draw, (x, 248, x + 120, 418), "#f4f7fb", "#d8e0ea", 10)
            round_rect(draw, (x + 17, 268, x + 103, 344), "#dff5ec" if i == 0 else "#dce4eb", None, 8)
            draw_text(draw, label, (x + 26, 362), "#172033", "mid")
            draw_text(draw, f"{68 + i * 7} strength", (x + 25, 392), "#8a5a10", "small")
        return

    if visual == "analysis":
        rows = ["Hook", "Angle", "Offer mechanic", "CTA", "Compliance"]
        values = ["Father's Day offer", "Value incentive", "Classified", "Classified", "Medium"]
        for i, row in enumerate(rows):
            y = 248 + i * 48
            round_rect(draw, (724, y, 1124, y + 34), "#ffffff" if i % 2 else "#f8fafc", "#e0e7ef", 6)
            draw_text(draw, row, (742, y + 8), "#526273", "copy")
            draw_text(draw, values[i], (892, y + 8), "#172033", "copy")
        return

    if visual in {"clusters", "summary"}:
        rows = ["Personalized quiz diagnosis", "Before-after transformation", "Value incentive offer"]
        for i, row in enumerate(rows):
            y = 248 + i * 76
            selected = i == 0
            round_rect(draw, (724, y, 1129, y + 58), "#f1fbf7" if selected else "#ffffff", "#14795d" if selected else "#d8e0ea", 10)
            draw_text(draw, f"#{i + 1}", (742, y + 15), "#8a5a10", "small")
            draw_text(draw, row, (784, y + 12), "#172033", "mid")
            draw_text(draw, f"{62 - i * 5} avg strength", (986, y + 37), "#526273", "small")
        return

    if visual == "concepts":
        rows = ["Meta carousel", "TikTok UGC", "Taboola advertorial"]
        for i, row in enumerate(rows):
            y = 244 + i * 74
            round_rect(draw, (724, y, 1129, y + 58), "#ffffff", "#d8e0ea", 10)
            round_rect(draw, (742, y + 17, 812, y + 41), "#fff4df", None, 5)
            draw_text(draw, f"#{i + 1}", (762, y + 22), "#8a5a10", "small")
            draw_text(draw, row, (832, y + 14), "#172033", "mid")
            draw_text(draw, "Copy + visual direction + CTA", (832, y + 38), "#526273", "small")
        return

    round_rect(draw, (724, 246, 1128, 434), "#f8fafc", "#d8e0ea", 12)
    draw_text(draw, "Search -> Analyze -> Cluster -> Generate", (752, 278), "#172033", "panel")
    draw_text(draw, ["Public data boundaries stay explicit.", "Output stays schema-validated."], (752, 326), "#526273", "mid", 28)


def draw_slide(slide: dict[str, str]) -> Image.Image:
    image = Image.new("RGB", (W, H), "#f8fafc")
    draw = ImageDraw.Draw(image)
    for y in range(H):
        ratio = y / H
        r = int(248 * (1 - ratio) + 238 * ratio)
        g = int(250 * (1 - ratio) + 247 * ratio)
        b = int(252 * (1 - ratio) + 242 * ratio)
        draw.line((0, y, W, y), fill=(r, g, b))

    draw_top_bar(draw)
    round_rect(draw, (92, 150, 282, 184), "#fff4df", None, 7)
    draw_text(draw, slide["kicker"], (111, 158), "#72430d", "kicker")
    draw_text(draw, wrap(slide["title"], 24), (92, 212), "#101827", "title", 58)
    draw_text(draw, wrap(slide["body"], 46), (96, 378), "#4b5968", "body", 34)

    badge_width = min(510, len(slide["badge"]) * 11 + 42)
    round_rect(draw, (96, 520, 96 + badge_width, 562), "#14795d", None, 8)
    draw_text(draw, slide["badge"], (118, 531), "#ffffff", "badge")
    draw_mini_app(draw, slide["visual"])
    draw_text(draw, "anglescope-wuov.onrender.com", (94, 632), "#14795d", "mid")
    draw_text(draw, "Built by Vadim Koenen", (968, 632), "#526273", "mid")
    return image


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--frames-dir", required=True)
    parser.add_argument("--poster", required=True)
    args = parser.parse_args()

    frames_dir = Path(args.frames_dir)
    frames_dir.mkdir(parents=True, exist_ok=True)

    for index, slide in enumerate(SLIDES, start=1):
        image = draw_slide(slide)
        image.save(frames_dir / f"slide_{index:02d}.png")
        if index == 1:
            image.save(args.poster)


if __name__ == "__main__":
    main()
