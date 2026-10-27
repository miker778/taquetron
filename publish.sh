#!/usr/bin/env bash
# Release the current index.html to dist/ (what game.nostris.tech serves), keeping the previous one.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p dist
[ -f dist/index.html ] && cp dist/index.html dist/.prev.html
cp index.html dist/index.html
echo "published $(git rev-parse --short HEAD) $(wc -c < dist/index.html) bytes"
