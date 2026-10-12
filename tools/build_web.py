#!/usr/bin/env python3
"""Builds the site (docs/) and a design-only preview (web/preview.html) from web/parts.
Run from the repo root: python3 tools/build_web.py"""
import json, os, time
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = lambda *a: os.path.join(R, *a)
read = lambda *a: open(P(*a), encoding='utf8').read()
SITE = 'https://smkrot3-sudo.github.io/cartsync/'
BUILD = int(time.time() * 1000)
css = read('web/parts/base.css') + read('web/parts/extra.css')
body = read('web/parts/body.html')
i18n = read('web/parts/i18n.js')
app = read('web/parts/app.js')
local_fonts = '''<style>
@font-face{font-family:"Varela Round";src:url(fonts/varela-round-hebrew-400-normal.woff2) format("woff2");unicode-range:U+0590-05FF,U+200C-2010,U+20AA,U+25CC,U+FB1D-FB4F;font-display:swap}
@font-face{font-family:"Varela Round";src:url(fonts/varela-round-latin-400-normal.woff2) format("woff2");font-display:swap}
@font-face{font-family:"Suez One";src:url(fonts/suez-one-hebrew-400-normal.woff2) format("woff2");unicode-range:U+0590-05FF,U+200C-2010,U+20AA,U+25CC,U+FB1D-FB4F;font-display:swap}
@font-face{font-family:"Suez One";src:url(fonts/suez-one-latin-400-normal.woff2) format("woff2");font-display:swap}
@font-face{font-family:"Rubik Wet Paint";src:url(fonts/rubik-wetpaint-hebrew.woff2) format("woff2");unicode-range:U+0307-0308,U+0590-05FF,U+200C-2010,U+20AA,U+25CC,U+FB1D-FB4F;font-display:swap}
@font-face{font-family:"Rubik Wet Paint";src:url(fonts/rubik-wetpaint-latin.woff2) format("woff2");font-display:swap}
</style>'''

# 1. design-only preview (no cloud, no service worker) — fast to open while iterating on layout
google_fonts = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Suez+One&family=Varela+Round&display=swap">'
open(P('web/preview.html'), 'w', encoding='utf8').write(
    f'<title>קניות ביחד</title>\n{google_fonts}\n<style>\n{css}</style>\n{body}<script>\n{i18n}</script>\n<script>\n{app}</script>\n')

# 2. the site
def page():
    return f'''<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>קניות ביחד · CartSync</title>
<meta name="description" content="רשימת קניות אחת, לכל המשפחה, בזמן אמת.">
<meta name="theme-color" content="#F2F4FB" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0A1026" media="(prefers-color-scheme: dark)">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="קניות ביחד">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta property="og:title" content="קניות ביחד"><meta property="og:description" content="רשימת קניות אחת, לכל המשפחה 🛒"><meta property="og:image" content="{SITE}icons/icon-512.png">
{local_fonts}
<style>
{css}</style>
</head>
<body>
{body}<script>window.CS_SITE={json.dumps(SITE)};window.CS_BUILD={BUILD};</script>
<script>
{i18n}</script>
<script>
{app}</script>
<script src="vendor/supabase.js"></script>
<script>
{read('web/parts/cloud.js')}</script>
<script>
{read('web/parts/update.js')}</script>
<script>
if('serviceWorker' in navigator&&location.protocol==='https:')addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{{}}));
</script>
</body>
</html>
'''
open(P('docs/index.html'), 'w', encoding='utf8').write(page())
sw = read('web/sw.js').replace('__BUILD__', str(BUILD))
open(P('docs/sw.js'), 'w', encoding='utf8').write(sw)

# app-version.json: this build's web timestamp, keeping whatever the Android CI last published
vpath = P('docs/app-version.json')
vdata = {}
if os.path.exists(vpath):
    try: vdata = json.load(open(vpath, encoding='utf8'))
    except Exception: vdata = {}
vdata['build'] = BUILD
json.dump(vdata, open(vpath, 'w', encoding='utf8'), ensure_ascii=False, indent=2)

print('built', BUILD)
