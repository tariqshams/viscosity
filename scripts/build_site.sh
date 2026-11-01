#!/usr/bin/env bash
# Builds viscosity.dev as one static site: the docs (website/) at / and the
# book (book/) at /book/.
#
# Any static host can deploy it:
#   build command:     bash scripts/build_site.sh
#   output directory:  website/dist
#
# Search: Starlight's Pagefind index is website/dist/pagefind/ (served at
# /pagefind/); the book's own index is built into book/dist/pagefind/ and ends
# up at website/dist/book/pagefind/ (/book/pagefind/), so the two never collide.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"

# 1. Dependencies, only where node_modules is missing.
for dir in book website; do
  if [ ! -d "$dir/node_modules" ]; then
    echo "==> installing $dir dependencies"
    if [ -f "$dir/package-lock.json" ]; then
      (cd "$dir" && npm ci)
    else
      (cd "$dir" && npm install)
    fi
  fi
done

# 2. The book's merged references, which its build needs.
echo "==> merging book references"
node book/scripts/merge_refs.mjs --all

# 3. Build the book (astro build + pagefind) and the docs.
echo "==> building book"
(cd book && npm run build)
echo "==> building website"
(cd website && npm run build)

# 4. Put the book under the docs at /book/.
echo "==> copying book/dist into website/dist/book"
if [ ! -f book/dist/index.html ]; then
  echo "book/dist/index.html is missing: the book build produced no site" >&2
  exit 1
fi
rm -rf website/dist/book
mkdir -p website/dist/book
cp -R book/dist/. website/dist/book/

echo "==> done: website/dist (docs at /, book at /book/)"
