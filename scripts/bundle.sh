#!/usr/bin/env bash
# scripts/bundle.sh <playground-slug>
# Bundles a single playground into dist/playgrounds/<slug>/ for static hosting.

set -euo pipefail

slug="${1:?Usage: bundle.sh <slug>}"
src="playgrounds/$slug"
dst="dist/playgrounds/$slug"

if [ ! -d "$src" ]; then
  echo "Playground not found: $src" >&2
  exit 1
fi
if [ ! -f "$src/.verified" ]; then
  echo "Playground not verified. Run /verify $slug first." >&2
  exit 1
fi

rm -rf "$dst"
mkdir -p "$dst"

# Bundle JS via esbuild (single entry, ES2022, minified, sourcemap external)
npx esbuild "$src/playground.js" \
  --bundle \
  --format=esm \
  --target=es2022 \
  --minify \
  --sourcemap=external \
  --outfile="$dst/bundle.js"

# Inline CSS (token + base + any playground-specific)
{
  cat shared/css/tokens.css
  printf '\n'
  cat shared/css/base.css
  if [ -f "$src/style.css" ]; then
    printf '\n'
    cat "$src/style.css"
  fi
} > "$dst/bundle.css"

# Rewrite index.html to point at bundled assets
sed \
  -e 's|../../shared/css/tokens.css|./bundle.css|g' \
  -e 's|<link rel="stylesheet" href="../../shared/css/base.css">||' \
  -e 's|./playground.js|./bundle.js|g' \
  "$src/index.html" > "$dst/index.html"

# Copy goldens for visual reference
if [ -d "$src/references/golden-frames" ]; then
  mkdir -p "$dst/goldens"
  cp -r "$src/references/golden-frames/." "$dst/goldens/"
fi

# Copy README and spec for provenance
cp "$src/README.md" "$dst/README.md"
cp "$src/spec.md"   "$dst/spec.md"

echo "Bundled $slug -> $dst"
du -sh "$dst"
