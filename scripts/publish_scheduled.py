#!/usr/bin/env python3
"""Publish due HTML files from the content-queue branch checkout."""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

BASE_URL = "https://onlineguitartuner.net"
HOME_MARKER = "          <!-- AUTO-PUBLISHED-GUIDES -->"
REQUIRED_SNIPPETS = (
    'rel="canonical"',
    "G-61XFFV7JZT",
    "ca-pub-6136525087204092",
    'href="styles.css"',
)


ALL_TUNINGS_SECTION = """
    <section class="content-card all-tunings-card" data-all-tunings>
      <h2>All guitar tunings</h2>
      <div class="grid-links">
        <a href="index.html">Standard — E A D G B E</a>
        <a href="432-hz-guitar-tuner.html">432 Hz Standard</a>
        <a href="528-hz-guitar-tuner.html">528 Hz (C5) Standard</a>
        <a href="half-step-down-guitar-tuner.html">Half Step Down — Eb Ab Db Gb Bb Eb</a>
        <a href="whole-step-down-guitar-tuner.html">Whole Step Down — D G C F A D</a>
        <a href="drop-d-guitar-tuner.html">Drop D — D A D G B E</a>
        <a href="double-drop-d-guitar-tuner.html">Double Drop D — D A D G B D</a>
        <a href="drop-c-guitar-tuner.html">Drop C — C G C F A D</a>
        <a href="dadgad-guitar-tuner.html">DADGAD — D A D G A D</a>
        <a href="open-g-guitar-tuner.html">Open G — D G D G B D</a>
        <a href="open-d-guitar-tuner.html">Open D — D A D F# A D</a>
        <a href="open-e-guitar-tuner.html">Open E — E B E G# B E</a>
        <a href="open-c-guitar-tuner.html">Open C — C G C G C E</a>
      </div>
    </section>
"""


def refresh_tuning_navigation(site: Path, manifest: dict, today) -> None:
    """Add every published queued tuning to tuner menus and tuning directories."""
    tuning_entries = []
    for entry in manifest.get("entries", []):
        tuning = entry.get("tuning")
        if not tuning:
            continue
        publish_date = datetime.strptime(entry["date"], "%Y-%m-%d").date()
        if publish_date <= today and (site / entry["slug"]).is_file():
            tuning_entries.append((entry, tuning))

    if not tuning_entries:
        return

    section_pattern = re.compile(
        r'(<section class="content-card all-tunings-card" data-all-tunings>.*?'
        r'<div class="grid-links">)(.*?)(</div>\s*</section>)',
        re.DOTALL,
    )
    select_pattern = re.compile(
        r'(<select id="tuningSelect"[^>]*>)(.*?)(</select>)',
        re.DOTALL,
    )

    for page_path in site.glob("*.html"):
        content = page_path.read_text(encoding="utf-8")
        original = content
        for entry, tuning in tuning_entries:
            slug = entry["slug"]
            key = tuning["key"]
            if f'href="{slug}"' not in content and section_pattern.search(content):
                link = (
                    f'\n        <a href="{html.escape(slug)}">'
                    f'{html.escape(tuning["directoryLabel"])}</a>'
                )
                content = section_pattern.sub(
                    lambda match: match.group(1) + match.group(2) + link + match.group(3),
                    content,
                    count=1,
                )
            if f'value="{key}"' not in content and select_pattern.search(content):
                option = (
                    f'\n            <option value="{html.escape(key)}">'
                    f'{html.escape(tuning["optionLabel"])}</option>'
                )
                content = select_pattern.sub(
                    lambda match: match.group(1) + match.group(2) + option + "\n          " + match.group(3),
                    content,
                    count=1,
                )
        if content != original:
            page_path.write_text(content, encoding="utf-8")


def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--site", required=True, type=Path)
    parser.add_argument("--queue", required=True, type=Path)
    args = parser.parse_args()

    site = args.site.resolve()
    queue = args.queue.resolve()
    manifest_path = queue / "publication-queue.json"
    if not manifest_path.is_file():
        fail(f"Missing queue manifest: {manifest_path}")

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    timezone = ZoneInfo(manifest.get("timezone", "America/Chicago"))
    today = datetime.now(timezone).date()

    index_path = site / "index.html"
    sitemap_path = site / "sitemap.xml"
    index = index_path.read_text(encoding="utf-8")
    sitemap = sitemap_path.read_text(encoding="utf-8")
    if HOME_MARKER not in index:
        fail("Homepage publication marker is missing")
    if "</urlset>" not in sitemap:
        fail("sitemap.xml is not a valid URL set")

    published: list[tuple[str, str, str]] = []
    for entry in manifest.get("entries", []):
        publish_date = datetime.strptime(entry["date"], "%Y-%m-%d").date()
        if publish_date > today:
            continue

        slug = entry["slug"]
        title = entry["title"]
        source = queue / entry["source"]
        destination = site / slug

        if destination.exists():
            continue
        if not source.is_file():
            print(f"SKIP {slug}: scheduled source is not ready")
            continue

        content = source.read_text(encoding="utf-8")
        expected_canonical = f'{BASE_URL}/{slug}'
        missing = [item for item in REQUIRED_SNIPPETS if item not in content]
        if expected_canonical not in content:
            missing.append(expected_canonical)
        if "<title>" not in content or "<h1>" not in content:
            missing.append("title and h1")
        if missing:
            fail(f"{source} failed validation; missing: {', '.join(missing)}")

        if "data-all-tunings" not in content:
            content = content.replace("</main>", ALL_TUNINGS_SECTION + "  </main>")
        destination.write_text(content, encoding="utf-8")
        url = f"{BASE_URL}/{slug}"

        if url not in sitemap:
            sitemap_line = f"  <url><loc>{html.escape(url)}</loc></url>\n"
            sitemap = sitemap.replace("</urlset>", sitemap_line + "</urlset>")

        link = f'          <a href="{html.escape(slug)}">{html.escape(title)}</a>\n'
        if f'href="{slug}"' not in index:
            index = index.replace(HOME_MARKER, link + HOME_MARKER)

        published.append((slug, title, url))
        print(f"PUBLISH {slug}")

    if not published:
        print("No completed articles are due.")
        return

    index_path.write_text(index, encoding="utf-8")
    sitemap_path.write_text(sitemap, encoding="utf-8")
    refresh_tuning_navigation(site, manifest, today)

    (site / ".published-files.txt").write_text(
        "".join(f"{slug}\n" for slug, _, _ in published), encoding="utf-8"
    )
    urls = [url for _, _, url in published]
    (site / ".published-urls.txt").write_text(
        "".join(f"{url}\n" for url in urls), encoding="utf-8"
    )
    payload = {
        "host": "onlineguitartuner.net",
        "key": "bf71bddc4fcdf5fa3ef27b1f62e4a112",
        "keyLocation": f"{BASE_URL}/bf71bddc4fcdf5fa3ef27b1f62e4a112.txt",
        "urlList": urls,
    }
    (site / ".indexnow-payload.json").write_text(
        json.dumps(payload, separators=(",", ":")), encoding="utf-8"
    )


if __name__ == "__main__":
    main()
