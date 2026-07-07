#!/bin/bash
# Static-site verify: JS syntax + internal links/anchors + optional headless render.
# No dependencies — uses node, python3, and (if present) the pre-installed Chromium.
# Usage: scripts/verify.sh        (checks everything)
set -uo pipefail
cd "$(dirname "$0")/.." || exit 2

fail=0

echo "== JS syntax =="
for f in *.js; do
  [ -e "$f" ] || continue
  if node --check "$f"; then
    echo "  ok  $f"
  else
    echo "  FAIL $f"; fail=1
  fi
done

echo "== HTML internal links & anchors =="
python3 scripts/check_html.py || fail=1

# Optional: headless render smoke test (confirms each page loads in Chromium).
CHROMIUM="$(ls /opt/pw-browsers/chromium*/chrome-linux/chrome 2>/dev/null | head -1)"
if [ -n "${CHROMIUM:-}" ]; then
  echo "== Headless render smoke =="
  for page in index.html start.html privacy.html terms.html; do
    [ -e "$page" ] || continue
    if "$CHROMIUM" --headless --no-sandbox --disable-gpu --dump-dom \
        "file://$(pwd)/$page" >/dev/null 2>&1; then
      echo "  ok  $page"
    else
      echo "  FAIL $page"; fail=1
    fi
  done
else
  echo "== Headless render smoke == (skipped: chromium not found)"
fi

if [ "$fail" -eq 0 ]; then
  echo "ALL CHECKS PASSED"
else
  echo "SOME CHECKS FAILED"
fi
exit "$fail"
