#!/usr/bin/env python3
"""
Builds the static pages for gasis.ae.

    python3 build.py

Reads src/partials/*.html and src/pages/*.html, injects the shared header and
footer plus inline SVG icons, and writes the finished HTML files into the site
root (index.html, about-us/index.html, ...). Only the Python standard library is
used, so it runs anywhere Python 3 is installed.

Each page starts with a metadata comment, for example:
    <!-- meta: title=About Gasis – Gas Integrated Solutions | nav=about | path=/about-us/ | slug=about | desc=... -->

Icons: write {{icon:name}} anywhere in a page or partial. Names are looked up in
src/icons.json first (icons extracted from the original site) and then in
src/icons/<name>.svg (Font Awesome Free, CC BY 4.0).
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
SITE_URL = "https://gasis.ae"

NAV = [
    # key, label, href, children [(label, href), ...]
    ("home", "Home", "/", None),
    ("about", "About Us", "/about-us/", [
        ("About Gasis", "/about-us/"),
        ("Message from MD", "/message-from-management/"),
    ]),
    ("services", "Services", "/services/", None),
    ("contact", "Contact Us", "/contact-us/", None),
    ("brochure", "eBrochure", "/GIS%20Company%20Profile.pdf", None),
    ("portal", "Portal", "https://erp.gasis.ae/login#login", [
        ("Registration", "https://billing.gasis.ae/Account/SignUp"),
        ("Login", "https://billing.gasis.ae/Account/Login"),
    ]),
]

PAGES = {
    # source file            -> output path (relative to site root)
    "home.html": "index.html",
    "about-us.html": "about-us/index.html",
    "message-from-management.html": "message-from-management/index.html",
    "services.html": "services/index.html",
    "contact-us.html": "contact-us/index.html",
    "404.html": "404.html",
}

ICONS = json.loads((SRC / "icons.json").read_text(encoding="utf-8"))


def icon_svg(name: str) -> str:
    for prefix in ("e-fas-", "e-fab-", "e-far-"):
        data = ICONS.get(prefix + name)
        if data:
            return (f'<svg class="icon icon-{name}" viewBox="{data["viewBox"]}" aria-hidden="true" '
                    f'focusable="false"><path d="{data["d"]}"/></svg>')
    path = SRC / "icons" / f"{name}.svg"
    if path.exists():
        svg = re.sub(r"<!--.*?-->", "", path.read_text(encoding="utf-8"), flags=re.S)
        view_box = re.search(r'viewBox="([^"]+)"', svg).group(1)
        d = re.search(r'<path[^>]*\sd="([^"]+)"', svg).group(1)
        return (f'<svg class="icon icon-{name}" viewBox="{view_box}" aria-hidden="true" '
                f'focusable="false"><path d="{d}"/></svg>')
    sys.exit(f"build.py: unknown icon '{name}'")


def render_icons(html: str) -> str:
    return re.sub(r"\{\{icon:([a-z0-9-]+)\}\}", lambda m: icon_svg(m.group(1)), html)


def parse_meta(html: str):
    m = re.match(r"\s*<!--\s*meta:(.*?)-->", html, flags=re.S)
    if not m:
        sys.exit("build.py: page is missing the <!-- meta: ... --> comment")
    meta = {}
    for part in m.group(1).split("|"):
        if "=" in part:
            k, v = part.split("=", 1)
            meta[k.strip()] = v.strip()
    return meta, html[m.end():].strip()


def build_nav(active_key: str, active_sub: str) -> str:
    out = []
    for key, label, href, children in NAV:
        is_active = key == active_key
        li_cls = " has-children" if children else ""
        a_cls = "menu-link" + (" is-active" if is_active else "")
        caret = icon_svg("caret-down") if children else ""
        aria = ' aria-current="page"' if is_active and not children else ""
        out.append(f'        <li class="menu-item{li_cls}">')
        out.append(f'          <a class="{a_cls}" href="{href}"{aria}>{label}{caret}</a>')
        if children:
            out.append('          <ul class="sub-menu">')
            for c_label, c_href in children:
                c_cls = ' class="is-active" aria-current="page"' if c_href == active_sub else ""
                out.append(f'            <li><a href="{c_href}"{c_cls}>{c_label}</a></li>')
            out.append("          </ul>")
        out.append("        </li>")
    return "\n".join(out)


LAYOUT = """<!DOCTYPE html>
<html lang="en" class="no-js">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <meta name="description" content="{desc}">
  <link rel="canonical" href="{canonical}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Gas Integrated Solutions">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{desc}">
  <meta property="og:url" content="{canonical}">
  <meta property="og:image" content="{site_url}/assets/img/hero-team.jpg">
  <meta name="theme-color" content="#F26A2E">
  <link rel="icon" href="/assets/img/favicon.png" type="image/png">
  <link rel="apple-touch-icon" href="/assets/img/favicon.png">
  <link rel="preload" href="/assets/fonts/OpenSans-400-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/fonts/OpenSans-600-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/assets/fonts/OpenSans-700-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/assets/css/fonts.css">
  <link rel="stylesheet" href="/assets/css/style.css">
  <script>document.documentElement.className = document.documentElement.className.replace('no-js', 'js');</script>
</head>
<body class="page-{slug}">
{header}
<main id="main">
{content}
</main>
{footer}
<script src="/assets/js/config.js"></script>
<script src="/assets/js/main.js" defer></script>
</body>
</html>
"""


def main() -> None:
    header_tpl = (SRC / "partials" / "header.html").read_text(encoding="utf-8")
    footer_tpl = (SRC / "partials" / "footer.html").read_text(encoding="utf-8")

    for src_name, out_rel in PAGES.items():
        raw = (SRC / "pages" / src_name).read_text(encoding="utf-8")
        meta, content = parse_meta(raw)
        header = header_tpl.replace("{{NAV}}", build_nav(meta.get("nav", ""), meta.get("sub", "")))
        page = LAYOUT.format(
            title=meta["title"],
            desc=meta.get("desc", "").replace('"', "&quot;"),
            canonical=SITE_URL + meta.get("path", "/"),
            site_url=SITE_URL,
            slug=meta.get("slug", "page"),
            header=render_icons(header).rstrip(),
            content=render_icons(content),
            footer=render_icons(footer_tpl).rstrip(),
        )
        out_path = ROOT / out_rel
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(page, encoding="utf-8")
        print(f"wrote {out_rel} ({len(page)//1024} KB)")


if __name__ == "__main__":
    main()
