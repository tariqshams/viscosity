#!/usr/bin/env bash
# Publish Viscosity: the six Rust crates to crates.io, then @viscosity/cli
# and @viscosity/wasm to npm.
#
#   scripts/release.sh            publish for real (needs NPM_TOKEN and
#                                 CARGO_REGISTRY_TOKEN, and a clean git tree)
#   scripts/release.sh --dry-run  package and verify everything, upload nothing
#                                 (no tokens, no git check)
#   scripts/release.sh --npm-only publish only @viscosity/cli and @viscosity/wasm
#                                 (needs NPM_TOKEN only; crates are skipped)
#
# NPM_TOKEN may also be provided as an environment variable named
# npm-publish (not a valid shell name, so it is read with printenv).
#
# Crates go out in dependency order. A crate whose version is already on
# crates.io is skipped, so the script can be re-run after a failure partway.
# cargo publish (1.66+) waits for each crate to appear in the index before it
# returns; the script also polls the sparse index itself, because cargo's own
# wait gives up after 60 s and the next crate would then fail to resolve.
#
# The npm token is never written to disk: a temporary npmrc, selected with
# NPM_CONFIG_USERCONFIG, holds the literal text ${NPM_TOKEN}, which npm
# expands from the environment.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TS="$ROOT/engine/ts"
RUST="$ROOT/engine/rust"
CRATES=(viscosity-vir viscosity-core viscosity-frontend-js viscosity-frontend-python viscosity-cli viscosity-wasm)
UA="viscosity-release (https://github.com/tariqshams/viscosity)"

DRY_RUN=0
NPM_ONLY=0
for arg in "$@"; do
  case "$arg" in
    --dry-run|-n) DRY_RUN=1 ;;
    --npm-only) NPM_ONLY=1 ;;
    -h|--help) sed -n '2,24p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "release.sh: unknown argument: $arg (try --help)" >&2; exit 2 ;;
  esac
done

step() { printf '\n==> %s\n' "$*"; }
die() { printf 'release.sh: %s\n' "$*" >&2; exit 1; }

# --- 1. Preconditions ---------------------------------------------------------
if [[ -z "${NPM_TOKEN:-}" ]] && printenv npm-publish >/dev/null 2>&1; then
  NPM_TOKEN="$(printenv npm-publish)"
  export NPM_TOKEN
fi
if [[ $DRY_RUN -eq 0 ]]; then
  missing=()
  [[ -n "${NPM_TOKEN:-}" ]] || missing+=(NPM_TOKEN)
  [[ $NPM_ONLY -eq 1 || -n "${CARGO_REGISTRY_TOKEN:-}" ]] || missing+=(CARGO_REGISTRY_TOKEN)
  if [[ ${#missing[@]} -gt 0 ]]; then
    die "missing ${missing[*]}. Set NPM_TOKEN (an npm access token that can publish to the \"viscosity\" org) and CARGO_REGISTRY_TOKEN (a crates.io API token with publish-new and publish-update scopes), or run with --dry-run."
  fi
  git -C "$ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1 || die "$ROOT is not a git checkout"
  if [[ -n "$(git -C "$ROOT" status --porcelain)" ]]; then
    git -C "$ROOT" status --short >&2
    die "the git tree is not clean; commit or stash first"
  fi
fi
for tool in cargo node npm curl; do
  command -v "$tool" >/dev/null || die "$tool not found on PATH"
done

# All six crates share the workspace version; the npm packages must match it.
VERSION="$(cd "$RUST" && cargo metadata --no-deps --format-version 1 \
  | node -e 'const m=JSON.parse(require("fs").readFileSync(0,"utf8"));const v=[...new Set(m.packages.map(p=>p.version))];if(v.length!==1){console.error("crate versions differ: "+v.join(", "));process.exit(1)}console.log(v[0])')"
for pkg in "$TS/packages/cli" "$RUST/packages/wasm"; do
  v="$(node -p "require('$pkg/package.json').version")"
  [[ "$v" == "$VERSION" ]] || die "$pkg/package.json is $v but the crates are $VERSION"
done
step "Releasing Viscosity $VERSION$([[ $DRY_RUN -eq 1 ]] && echo ' (dry run)')"

# The publish order must list every internal (non-dev) dependency first.
(cd "$RUST" && cargo metadata --no-deps --format-version 1) | node -e '
  const order = process.argv.slice(1);
  const m = JSON.parse(require("fs").readFileSync(0, "utf8"));
  const names = new Set(m.packages.map(p => p.name));
  for (const p of m.packages) {
    if (!order.includes(p.name)) { console.error(`${p.name} is not in the publish order`); process.exit(1); }
    for (const d of p.dependencies) {
      if (d.kind === "dev" || !names.has(d.name)) continue;
      if (order.indexOf(d.name) > order.indexOf(p.name)) {
        console.error(`${p.name} depends on ${d.name}, which is published after it`); process.exit(1);
      }
    }
  }' "${CRATES[@]}"

# --- 2. Tests -----------------------------------------------------------------
step "TypeScript engine tests"
(cd "$TS" && npx vitest run)
step "Rust engine tests"
(cd "$RUST" && cargo test --workspace)

# --- 3. crates.io -------------------------------------------------------------
# 200: this version exists. 404: it does not (or the crate does not exist).
crate_published() {
  local code
  code="$(curl -sS -o /dev/null -w '%{http_code}' -A "$UA" "https://crates.io/api/v1/crates/$1/$VERSION")" \
    || die "could not reach crates.io"
  case "$code" in
    200) return 0 ;;
    404) return 1 ;;
    *) die "crates.io answered HTTP $code for $1 $VERSION" ;;
  esac
}

# Sparse-index path: 1/{n}, 2/{n}, 3/{first char}/{n}, else {n[0..2]}/{n[2..4]}/{n}.
index_url() {
  local n="$1"
  case ${#n} in
    1) echo "https://index.crates.io/1/$n" ;;
    2) echo "https://index.crates.io/2/$n" ;;
    3) echo "https://index.crates.io/3/${n:0:1}/$n" ;;
    *) echo "https://index.crates.io/${n:0:2}/${n:2:2}/$n" ;;
  esac
}

wait_for_index() {
  local url deadline
  url="$(index_url "$1")"
  deadline=$((SECONDS + 600))
  until curl -sSf -A "$UA" "$url" 2>/dev/null | grep -q "\"vers\":\"$VERSION\""; do
    ((SECONDS < deadline)) || die "$1 $VERSION did not appear in the index within 10 minutes"
    echo "    waiting for $1 $VERSION in the index..."
    sleep 10
  done
}

if [[ $NPM_ONLY -eq 1 ]]; then
  step "--npm-only: skipping crates.io"
elif [[ $DRY_RUN -eq 1 ]]; then
  # Per-crate `cargo publish --dry-run -p` cannot verify a crate whose
  # internal dependencies are not on crates.io yet; with --workspace, cargo
  # (1.90+) packages the crates in dependency order and verifies each one
  # against the ones before it through a local overlay registry.
  step "cargo publish --dry-run --workspace"
  (cd "$RUST" && cargo publish --dry-run --allow-dirty --workspace)
  rm -rf "$RUST/target/package"
else
  for crate in "${CRATES[@]}"; do
    if crate_published "$crate"; then
      step "$crate $VERSION is already on crates.io; skipping"
      continue
    fi
    step "cargo publish -p $crate"
    (cd "$RUST" && cargo publish -p "$crate")
    wait_for_index "$crate"
  done
fi

# --- 4. npm -------------------------------------------------------------------
NPMRC="$(mktemp)"
trap 'rm -f "$NPMRC"' EXIT
{
  echo 'registry=https://registry.npmjs.org/'
  # Single-quoted: the file holds the variable reference, not the token.
  [[ $DRY_RUN -eq 1 ]] || echo '//registry.npmjs.org/:_authToken=${NPM_TOKEN}'
} >"$NPMRC"
export NPM_CONFIG_USERCONFIG="$NPMRC"

npm_published() {
  [[ "$(npm view "$1@$VERSION" version 2>/dev/null || true)" == "$VERSION" ]]
}

NPM_FLAGS=()
[[ $DRY_RUN -eq 1 ]] && NPM_FLAGS+=(--dry-run)

if [[ $DRY_RUN -eq 0 ]] && npm_published @viscosity/cli; then
  step "@viscosity/cli $VERSION is already on npm; skipping"
else
  step "npm publish @viscosity/cli (prepack builds dist/viscosity.mjs)"
  (cd "$TS/packages/cli" && npm publish "${NPM_FLAGS[@]}")
fi

if [[ $DRY_RUN -eq 0 ]] && npm_published @viscosity/wasm; then
  step "@viscosity/wasm $VERSION is already on npm; skipping"
else
  step "Build @viscosity/wasm"
  node "$RUST/packages/wasm/build.mjs"
  step "npm publish @viscosity/wasm"
  # Just built above, so skip the prepack rebuild.
  (cd "$RUST/packages/wasm" && npm publish --ignore-scripts "${NPM_FLAGS[@]}")
fi

step "Done: Viscosity $VERSION$([[ $DRY_RUN -eq 1 ]] && echo ' (dry run, nothing uploaded)')"
