#!/usr/bin/env bash
# Build and test exactly what is committed: check out HEAD into a clean
# worktree (so half-written, uncommitted chapters can't affect it), then run
# the chapter rules, the production build, the link check and the smoke test.
# Usage: book/scripts/clean_check.sh [worktree-dir]
set -euo pipefail
repo="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
wt="${1:-/tmp/viscosity-clean}"
if [ ! -d "$wt/.git" ] && [ ! -f "$wt/.git" ]; then
  git -C "$repo" worktree add -q --detach "$wt" HEAD
fi
git -C "$wt" reset -q --hard
git -C "$wt" checkout -q --detach "$(git -C "$repo" rev-parse HEAD)"
ln -sfn "$repo/book/node_modules" "$wt/book/node_modules"
ln -sfn "$repo/book/companion/ts/node_modules" "$wt/book/companion/ts/node_modules"
cd "$wt/book"
node scripts/check_chapters.mjs | tail -1
node scripts/merge_refs.mjs --all | tail -1   # what the Vercel prebuild does
npm run build > /tmp/clean-build.log 2>&1 || { tail -30 /tmp/clean-build.log; exit 1; }
node scripts/check_site.mjs
node scripts/smoke.mjs | grep -E "✗|smoke:"
