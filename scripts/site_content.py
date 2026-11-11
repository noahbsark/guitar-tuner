"""Shared static navigation and canonical URL rules for Pages and the publisher."""
from __future__ import annotations

import html
import re
from pathlib import Path
from urllib.parse import urlsplit

BASE_URL = 'https://onlineguitartuner.net'
UTILITY = {'index.html', '404.html', 'guides.html', 'about.html', 'contact.html', 'privacy.html', 'affiliate-disclosure.html'}
GROUPS = {
    'tuners': 'Tuners and tuning presets',
    'start': 'Start here: tuning basics',
    'troubleshooting': 'Fix a tuning or microphone problem',
    'strings': 'Strings, setup and maintenance',
    'music': 'Chords, styles and alternate tunings',
}


def public_path(filename: str) -> str:
    if filename in ('', '/', 'index.html'):
        return '/'
    return '/' + filename.removesuffix('.html').lstrip('/')


def public_url(filename: str) -> str:
    return BASE_URL + public_path(filename)


def normalize_links(content: str) -> str:
    def replace(match):
        value = match.group(1)
        parts = urlsplit(value)
        if parts.scheme or parts.netloc:
            if parts.scheme != 'https' or parts.netloc != 'onlineguitartuner.net':
                return match.group(0)
            prefix = BASE_URL
        else:
            prefix = ''
        path = parts.path.lstrip('/')
        if not path.endswith('.html'):
            return match.group(0)
        target = prefix + public_path(path)
        if parts.query:
            target += '?' + parts.query
        if parts.fragment:
            target += '#' + parts.fragment
        return 'href="' + target + '"'
    return re.sub(r'href="([^"]+)"', replace, content)


def category(filename: str) -> str:
    if any(word in filename for word in ('chord', 'capo', 'tunings-for', '-vs-', 'alternate', 'nashville', 'easiest')):
        return 'music'
    if any(word in filename for word in ('string-gauge', 'change-', 'stretch-', 'nut-', 'bridge', 'saddle', 'tremolo', 'floyd', 'humidity', 'locking', 'winding', 'wraps', 'neck-relief', 'pickup-height', 'intonation', 'old-guitar-strings')):
        return 'strings'
    if any(word in filename for word in ('wrong', 'working', 'jumps', 'noisy', 'troubleshoot', 'out-of-tune')):
        return 'troubleshooting'
    return 'start'


def normalize_page(content: str, filename: str) -> str:
    content = normalize_links(content)
    content = re.sub(r'href="/?styles\.css(?:\?[^"]*)?"', 'href="/styles.css?v=20261111-mobile"', content)
    # Keep the primary action above the changing pitch readout on small screens.
    action = re.search(r'<button id="toggleButton"[^>]*>.*?</button>', content, re.S)
    if action and content.index(action.group()) > content.index('id="statusPill"'):
        content = content.replace(action.group(), '', 1)
        content = content.replace('<div id="statusPill"', action.group() + '\n  <div id="statusPill"', 1)
    current = '/' if filename == 'index.html' or 'id="tuningSelect"' in content else '/guides' if filename not in UTILITY or filename == 'guides.html' else public_path(filename)
    nav = [('Tuner', '/'), ('Guides', '/guides'), ('About', '/about'), ('Contact', '/contact'), ('Privacy', '/privacy')]
    links = '\n'.join('        <a href="' + url + '"' + (' aria-current="page"' if url == current else '') + '>' + label + '</a>' for label, url in nav)
    content = re.sub(r'<div class="nav-links">.*?</div>', '<div class="nav-links">\n' + links + '\n      </div>', content, flags=re.S)
    compact = '<section class="content-card all-tunings-card" data-all-tunings><h2>Find your next step</h2><p><a href="/guides#tuners">Browse all tuning presets</a> · <a href="/guides">Explore the guitar guides</a> · <a href="/microphone-not-working-online-guitar-tuner">Microphone help</a></p></section>'
    content = re.sub(r'<section class="content-card all-tunings-card" data-all-tunings>.*?</section>', compact, content, flags=re.S)
    if filename not in UTILITY and 'class="editorial-note"' not in content:
        note = '<p class="editorial-note">Published by Online Guitar Tuner. <a href="/about#editorial">How our guides are maintained</a> · <a href="/contact">Report a correction</a></p>'
        content = re.sub(r'(<article\b[^>]*>)', lambda m: m.group(1) + '\n' + note, content, count=1)
    # Reading-only pages do not need microphone-tuner initialization.
    if 'id="tuningSelect"' not in content:
        content = re.sub(r'\s*<script src="tuner.js"></script>', '', content)
    if '<footer class="footer">' in content and 'class="support-link"' not in content:
        content = re.sub(r'(<footer class="footer">.*?)(</footer>)', lambda m: m.group(1) + '<p><a class="support-link" href="https://ko-fi.com/adragerty" target="_blank" rel="noopener noreferrer">Buy me a coffee <span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a></p>\n' + m.group(2), content, count=1, flags=re.S)
    return content


def rebuild_guides(site: Path) -> None:
    template = (site / 'index.html').read_text(encoding='utf-8')
    head = template.split('</head>', 1)[0]
    head = re.sub(r'<title>.*?</title>', '<title>Guitar Tuning Guides and Tuners | Online Guitar Tuner</title>', head, flags=re.S)
    head = re.sub(r'<meta name="description" content="[^"]*"\s*/?>', '<meta name="description" content="Find a tuning preset, learn the basics, troubleshoot microphone problems, or choose strings and setup guidance for your guitar.">', head)
    head = re.sub(r'<link rel="canonical"[^>]+>', '<link rel="canonical" href="' + public_url('guides.html') + '">', head)
    header = re.search(r'<header class="site-header">.*?</header>', template, re.S).group()
    footer = re.search(r'<footer class="footer">.*?</footer>', template, re.S).group()
    grouped = {key: [] for key in GROUPS}
    for page in sorted(site.glob('*.html')):
        if page.name in UTILITY:
            continue
        body = page.read_text(encoding='utf-8')
        match = re.search(r'<h1[^>]*>(.*?)</h1>', body, re.S)
        title = re.sub('<[^>]+>', '', match.group(1)) if match else page.stem.replace('-', ' ')
        group = 'tuners' if 'id="tuningSelect"' in body else category(page.name)
        grouped[group].append((html.unescape(title), public_path(page.name)))
    grouped['tuners'].insert(0, ('Standard guitar tuner — E A D G B E', '/'))
    jump = '<nav class="guide-categories" aria-label="Guide categories">' + ''.join('<a href="#' + key + '">' + label + '</a>' for key, label in GROUPS.items()) + '</nav>'
    sections = []
    for key, label in GROUPS.items():
        items = ''.join('<li><a href="' + url + '">' + html.escape(title) + '</a></li>' for title, url in grouped[key])
        sections.append('<section id="' + key + '" class="content-card guide-group"><h2>' + label + '</h2><ul class="guide-list">' + items + '</ul></section>')
    content = head + '</head><body><a class="skip-link" href="#main-content">Skip to main content</a>' + header + '<main id="main-content" class="page"><section class="hero"><h1>Guitar tuning guides</h1><p class="lede">Choose a tuning, learn the basics, or find a fix for the problem you are hearing.</p></section>' + jump + ''.join(sections) + '</main>' + footer + '</body></html>\n'
    (site / 'guides.html').write_text(normalize_page(content, 'guides.html'), encoding='utf-8')


def rebuild_sitemap(site: Path) -> None:
    pages = sorted(p.name for p in site.glob('*.html') if p.name != '404.html')
    text = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    text += ''.join('  <url><loc>' + html.escape(public_url(page)) + '</loc></url>\n' for page in pages)
    (site / 'sitemap.xml').write_text(text + '</urlset>\n', encoding='utf-8')
