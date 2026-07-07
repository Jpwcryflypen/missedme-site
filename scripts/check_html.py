#!/usr/bin/env python3
"""Validate internal links, asset references, and anchor targets across the site.

Dependency-free (stdlib html.parser). Flags:
  - href/src pointing at a local file that doesn't exist
  - in-page #anchors whose target id is missing on that page
Ignores external URLs, mailto:, tel:, and query strings.
"""
import os
import sys
from html.parser import HTMLParser
from urllib.parse import urldefrag, urlparse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGES = [f for f in os.listdir(ROOT) if f.endswith(".html")]


class Collector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.refs = []  # (attr_value)

    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if "id" in d and d["id"]:
            self.ids.add(d["id"])
        for key in ("href", "src"):
            if key in d and d[key]:
                self.refs.append(d[key])


def is_external(ref: str) -> bool:
    p = urlparse(ref)
    return bool(p.scheme) or ref.startswith("//") or ref.startswith("mailto:") or ref.startswith("tel:")


problems = []
for page in sorted(PAGES):
    with open(os.path.join(ROOT, page), encoding="utf-8") as fh:
        c = Collector()
        c.feed(fh.read())

    for ref in c.refs:
        if is_external(ref):
            continue
        base, frag = urldefrag(ref)
        base = base.split("?")[0]
        # Pure in-page anchor.
        if not base or base == page:
            if frag and frag not in c.ids:
                problems.append(f"{page}: missing anchor #{frag}")
            continue
        # Local file reference (strip leading slash for root-relative).
        target = base[1:] if base.startswith("/") else base
        path = os.path.join(ROOT, target)
        if not os.path.exists(path) and not os.path.isdir(path):
            problems.append(f"{page}: broken reference -> {ref}")

if problems:
    for p in problems:
        print("  FAIL " + p)
    sys.exit(1)

print(f"  ok  {len(PAGES)} pages, all internal links/anchors resolve")
