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
    'gear': 'Gear and buying guides',
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
    if filename in {'guitar-tuning-gear-guide.html', 'clip-on-vs-online-guitar-tuner.html', 'best-string-gauges-for-drop-tunings.html', 'guitar-string-gauge-guide.html', 'guitar-string-tension-calculator.html'}:
        return 'gear'
    if any(word in filename for word in ('chord', 'capo', 'tunings-for', '-vs-', 'alternate', 'nashville', 'easiest')):
        return 'music'
    if any(word in filename for word in ('string-gauge', 'change-', 'stretch-', 'nut-', 'bridge', 'saddle', 'tremolo', 'floyd', 'humidity', 'locking', 'winding', 'wraps', 'neck-relief', 'pickup-height', 'intonation', 'old-guitar-strings')):
        return 'strings'
    if any(word in filename for word in ('wrong', 'working', 'jumps', 'noisy', 'troubleshoot', 'out-of-tune')):
        return 'troubleshooting'
    return 'start'


def normalize_page(content: str, filename: str) -> str:
    content = normalize_links(content)
    content = content.replace('class="logo" href="/">Simple Guitar Tuner</a>',
                              'class="logo" href="/">Online Guitar Tuner</a>')
    content = re.sub(r'href="/?styles\.css(?:\?[^"]*)?"', 'href="/styles.css?v=20261118f"', content)
    # Keep the primary action above the changing pitch readout on small screens.
    action = re.search(r'<button id="toggleButton"[^>]*>.*?</button>', content, re.S)
    if action and content.index(action.group()) > content.index('id="statusPill"'):
        content = content.replace(action.group(), '', 1)
        content = content.replace('<div id="statusPill"', action.group() + '\n  <div id="statusPill"', 1)
    current = public_path(filename)
    nav = [('Tuner', '/'), ('Guides', '/guides'), ('About', '/about'), ('Contact', '/contact'), ('Privacy', '/privacy')]
    links = '\n'.join('        <a href="' + url + '"' + (' aria-current="page"' if url == current else '') + '>' + label + '</a>' for label, url in nav)
    content = re.sub(r'<div class="nav-links">.*?</div>', '<div class="nav-links">\n' + links + '\n      </div>', content, flags=re.S)
    group = category(filename)
    if 'id="tuningSelect"' in content:
        heading = 'Keep tuning'
        links = [('Try another preset', '/guides#tuners'), ('Diagnose a tuning problem', '/guitar-tuning-troubleshooter'), ('Fix microphone access', '/microphone-not-working-online-guitar-tuner')]
    elif group == 'gear':
        heading = 'Compare your options'
        links = [('Tuning gear by problem', '/guitar-tuning-gear-guide'), ('Try the free tuner', '/')]
    elif group == 'strings':
        heading = 'Check tuning after setup'
        links = [('Open the tuner', '/'), ('More setup and string guides', '/guides#strings')]
    elif group == 'troubleshooting':
        heading = 'Narrow down the problem'
        links = [('Diagnose a tuning problem', '/guitar-tuning-troubleshooter'), ('More tuning fixes', '/guides#troubleshooting'), ('Try the tuner again', '/')]
    elif group == 'music':
        heading = 'Try the tuning on your guitar'
        links = [('Choose a tuning preset', '/guides#tuners'), ('More chord and tuning guides', '/guides#music')]
    else:
        heading = 'Practice on your guitar'
        links = [('Open the tuner', '/'), ('More tuning basics', '/guides#start')]
    items = ' · '.join('<a href="' + url + '">' + label + '</a>' for label, url in links if url != public_path(filename))
    compact = '<section class="content-card all-tunings-card" data-all-tunings><h2>' + heading + '</h2><p>' + items + '</p></section>'
    content = re.sub(r'<section class="content-card all-tunings-card" data-all-tunings>.*?</section>', compact, content, flags=re.S)
    if filename not in UTILITY and 'class="editorial-note"' not in content:
        note = '<p class="editorial-note">Published by Online Guitar Tuner. <a href="/about#editorial">How our guides are maintained</a> · <a href="/contact">Report a correction</a></p>'
        content = re.sub(r'(<article\b[^>]*>)', lambda m: m.group(1) + '\n' + note, content, count=1)
    # Keep ad loading on editorial guides without a competing shopping decision.
    ad_script = r'<script\b[^>]*src="https://pagead2\.googlesyndication\.com/pagead/js/adsbygoogle\.js[^"]*"[^>]*></script>'
    utility_page = filename in UTILITY or 'id="tuningSelect"' in content
    interactive_guide = filename in {'guitar-string-tension-calculator.html', 'guitar-tuning-troubleshooter.html', 'guitar-retuning-planner.html', 'how-to-tune-a-guitar-by-ear.html'}
    affiliate_page = re.search(r'<a\b[^>]*href="https://www\.amazon\.com/', content) is not None
    if utility_page or interactive_guide or affiliate_page:
        ad = re.search(ad_script, content)
        if filename == 'index.html' and ad:
            publisher = re.search(r'client=(ca-pub-\d+)', ad.group())
            if publisher and 'name="google-adsense-account"' not in content:
                content = content.replace('</head>', '  <meta name="google-adsense-account" content="' + publisher.group(1) + '">\n</head>', 1)
        content = re.sub(ad_script, '', content)
    if 'id="tuningSelect"' in content:
        content = re.sub(r'(<section class="readout") aria-live="polite"', r'\1', content)
        if 'id="pitchAnnouncement"' not in content:
            content = re.sub(r'(<section class="readout")', r'<p id="pitchAnnouncement" class="sr-only" role="status" aria-atomic="true"></p>\n        \1', content, count=1)
    if 'id="tuningSelect"' in content and 'data-tuning="chromatic"' not in content and 'id="selectedPreset"' not in content:
        content = re.sub(r'(</select>\s*</div>)', r'\1\n        <p id="selectedPreset" role="status"></p>', content, count=1)
    tuner_script = r'<script src="/?tuner\.js(?:\?[^"]*)?"></script>'
    if 'id="tuningSelect"' in content or 'id="frequencyLookup"' in content or 'id="tensionComparison"' in content or 'id="retuningPlanner"' in content or 'id="standardReferenceNotes"' in content:
        content = re.sub(tuner_script, '<script src="/tuner.js?v=20261118n"></script>', content)
    else:
        content = re.sub(tuner_script, '', content)
    if '<footer class="footer">' in content and 'class="support-link"' not in content:
        content = re.sub(r'(<footer class="footer">.*?)(</footer>)', lambda m: m.group(1) + '<p><a class="support-link" href="https://ko-fi.com/adragerty" target="_blank" rel="noopener noreferrer">Buy me a coffee <span aria-hidden="true">↗</span><span class="sr-only"> (opens in a new tab)</span></a></p>\n' + m.group(2), content, count=1, flags=re.S)
    content = re.sub(r'\s*<script src="/?support\.js(?:\?[^"]*)?"[^>]*></script>', '', content)
    return content


def rebuild_guides(site: Path) -> None:
    template = (site / 'index.html').read_text(encoding='utf-8')
    head = template.split('</head>', 1)[0]
    head = re.sub(r'<title>.*?</title>', '<title>Guitar Tuning Guides and Tuners | Online Guitar Tuner</title>', head, flags=re.S)
    head = re.sub(r'<meta name="description" content="[^"]*"\s*/?>', '<meta name="description" content="Find a tuning preset, learn the basics, troubleshoot microphone problems, or choose strings and setup guidance for your guitar.">', head)
    head = re.sub(r'<link rel="canonical"[^>]+>', '<link rel="canonical" href="' + public_url('guides.html') + '">', head)
    head = re.sub(r'^ *<meta name="google-adsense-account"[^>]*>\n?', '', head, flags=re.M)
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
    grouped['troubleshooting'].sort(key=lambda page: page[1] != '/guitar-tuning-troubleshooter')
    grouped['tuners'].insert(0, ('Standard guitar tuner — E A D G B E', '/'))
    jump_labels = {
        'tuners': 'Tune now',
        'start': 'Learn to tune',
        'troubleshooting': 'Fix a problem',
    }
    jump = '<nav class="guide-categories" aria-label="Guide categories">' + ''.join('<a href="#' + key + '">' + jump_labels.get(key, label) + '</a>' for key, label in GROUPS.items()) + '</nav>'
    sections = []
    for key, label in GROUPS.items():
        families = {}
        for title, url in grouped[key]:
            family = None
            if key == 'tuners':
                if url == '/7-string-guitar-tuner':
                    family = 'Seven-string guitars'
                elif url == '/bass-guitar-tuner':
                    family = 'Bass guitars'
                elif url == '/12-string-guitar-tuner':
                    family = '12-string guitars'
                elif url == '/custom-guitar-tuner':
                    family = 'Custom tunings'
                elif url == '/guitar-intonation-checker':
                    family = 'Intonation checks'
                elif url == '/chromatic-guitar-tuner':
                    family = 'Chromatic'
                elif 'drop' in url:
                    family = 'Drop tunings'
                elif '/open-' in url:
                    family = 'Open tunings'
                elif url == '/dadgad-guitar-tuner':
                    family = 'DADGAD'
                else:
                    family = 'Standard, down-tuned and reference pitch presets'
            families.setdefault(family, []).append((title, url))
        groups = []
        for family, pages in families.items():
            subheading = '<h3>' + family + '</h3>' if family else ''
            items = ''.join('<li><a href="' + url + '">' + html.escape(title) + '</a></li>' for title, url in pages)
            groups.append(subheading + '<ul class="guide-list">' + items + '</ul>')
        sections.append('<section id="' + key + '" class="content-card guide-group"><h2>' + label + '</h2>' + ''.join(groups) + '</section>')
    search = '<form class="content-card" role="search" hidden><div class="tuning-control"><label for="guideSearch">Find a tuner or guide</label><input id="guideSearch" type="search" placeholder="Try Drop D, mic permission or capo"></div><p id="guideResults" role="status"></p></form>'
    content = head + '</head><body><a class="skip-link" href="#main-content">Skip to main content</a>' + header + '<main id="main-content" class="page"><section class="hero"><h1>Guitar tuning guides</h1><p class="lede">Choose a tuning, learn the basics, or find a fix for the problem you are hearing.</p></section>' + search + jump + ''.join(sections) + '</main>' + footer + '<script src="/guide-search.js?v=20261118b" defer></script></body></html>\n'
    (site / 'guides.html').write_text(normalize_page(content, 'guides.html'), encoding='utf-8')


def rebuild_sitemap(site: Path) -> None:
    pages = sorted(p.name for p in site.glob('*.html') if p.name != '404.html')
    text = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    text += ''.join('  <url><loc>' + html.escape(public_url(page)) + '</loc></url>\n' for page in pages)
    (site / 'sitemap.xml').write_text(text + '</urlset>\n', encoding='utf-8')
