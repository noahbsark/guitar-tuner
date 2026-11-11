#!/usr/bin/env python3
"""Publish due reviewed HTML from content-queue and refresh the static directory."""
from __future__ import annotations
import argparse
import html
import json
import re
import sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo
from site_content import BASE_URL, normalize_page, public_url, rebuild_guides, rebuild_sitemap

REQUIRED_SNIPPETS = ('rel="canonical"', 'G-61XFFV7JZT', 'ca-pub-6136525087204092', 'href="styles.css"')


def fail(message):
    print('ERROR: ' + message, file=sys.stderr)
    raise SystemExit(1)


def validate_internal_links(content, site, slug, source):
    for href in re.findall(r'<a\s+[^>]*href="([^"]+)"', content, re.I):
        if href.startswith(('http://', 'https://', 'mailto:', 'tel:', '#')):
            continue
        target = href.split('#', 1)[0].split('?', 1)[0].lstrip('/')
        if not target:
            target = 'index.html'
        elif not Path(target).suffix:
            target += '.html'
        if target == slug or target == 'guides.html':
            continue
        if not (site / target).is_file():
            fail(f'{source} links to an unpublished or missing page: {target}')


def refresh_tuning_choices(site, manifest, today):
    pattern = re.compile(r'(<select id="tuningSelect"[^>]*>)(.*?)(</select>)', re.S)
    for page in site.glob('*.html'):
        original = page.read_text(encoding='utf-8')
        content = original
        for entry in manifest.get('entries', []):
            tuning = entry.get('tuning')
            if not tuning or entry['date'] > today.isoformat() or not (site / entry['slug']).is_file():
                continue
            if f'value="{tuning["key"]}"' not in content:
                option = f'\n<option value="{html.escape(tuning["key"])}">{html.escape(tuning["optionLabel"])}</option>\n'
                content = pattern.sub(lambda m: m.group(1) + m.group(2) + option + m.group(3), content, count=1)
        content = normalize_page(content, page.name)
        if content != original:
            page.write_text(content, encoding='utf-8')


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--site', required=True, type=Path)
    parser.add_argument('--queue', required=True, type=Path)
    parser.add_argument('--date', help='Override publication date as YYYY-MM-DD for validation')
    args = parser.parse_args()
    site, queue = args.site.resolve(), args.queue.resolve()
    manifest_path = queue / 'publication-queue.json'
    if not manifest_path.is_file():
        fail(f'Missing queue manifest: {manifest_path}')
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    today = datetime.strptime(args.date, '%Y-%m-%d').date() if args.date else datetime.now(ZoneInfo(manifest.get('timezone', 'America/Chicago'))).date()
    published = []
    for entry in manifest.get('entries', []):
        if datetime.strptime(entry['date'], '%Y-%m-%d').date() > today:
            continue
        slug = entry['slug']
        destination, source = site / slug, queue / entry['source']
        if destination.exists():
            continue
        if not source.is_file():
            print(f'SKIP {slug}: scheduled source is not ready')
            continue
        content = normalize_page(source.read_text(encoding='utf-8'), slug)
        missing = [snippet for snippet in REQUIRED_SNIPPETS if snippet not in content]
        canonical = re.search(r'<link\s+rel="canonical"\s+href="([^"]+)"', content)
        if not canonical or canonical.group(1) != public_url(slug):
            missing.append('correct canonical URL: ' + public_url(slug))
        if '<title>' not in content or '<h1>' not in content:
            missing.append('title and h1')
        if missing:
            fail(f'{source} failed validation; missing: {", ".join(missing)}')
        validate_internal_links(content, site, slug, source)
        destination.write_text(content, encoding='utf-8')
        published.append(slug)
        print(f'PUBLISH {slug}')
    refresh_tuning_choices(site, manifest, today)
    rebuild_guides(site)
    rebuild_sitemap(site)
    urls = [public_url(slug) for slug in published]
    (site / '.published-files.txt').write_text(''.join(slug + '\n' for slug in published), encoding='utf-8')
    (site / '.published-urls.txt').write_text(''.join(url + '\n' for url in urls), encoding='utf-8')
    payload = {'host': 'onlineguitartuner.net', 'key': 'bf71bddc4fcdf5fa3ef27b1f62e4a112', 'keyLocation': BASE_URL + '/bf71bddc4fcdf5fa3ef27b1f62e4a112.txt', 'urlList': urls}
    (site / '.indexnow-payload.json').write_text(json.dumps(payload, separators=(',', ':')), encoding='utf-8')
    if not published:
        print('No completed articles are due.')


if __name__ == '__main__':
    main()
