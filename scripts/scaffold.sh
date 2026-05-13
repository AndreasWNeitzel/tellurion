#!/usr/bin/env bash
# scripts/scaffold.sh <slug>
# Copies playgrounds/_template into playgrounds/<slug>, substituting placeholders.

set -euo pipefail

slug="${1:?Usage: scaffold.sh <kebab-slug>}"

if [[ ! "$slug" =~ ^[a-z][a-z0-9]*(-[a-z0-9]+)*$ ]]; then
  echo "Invalid slug. Use kebab-case: lowercase letters, digits, hyphens, starting with a letter." >&2
  exit 1
fi

src="playgrounds/_template"
dst="playgrounds/$slug"

if [ -d "$dst" ]; then
  echo "$dst already exists." >&2
  exit 1
fi

cp -r "$src" "$dst"

# Title-case the slug for placeholder use
title=$(echo "$slug" | awk -F- '{for (i=1;i<=NF;i++) $i=toupper(substr($i,1,1))substr($i,2); print}' OFS=' ')
date_iso=$(date -u +%Y-%m-%d)

find "$dst" -type f \( -name '*.md' -o -name '*.html' -o -name '*.mjs' -o -name '*.js' \) -print0 \
  | while IFS= read -r -d '' f; do
      sed -i \
        -e "s|__TITLE__|$title|g" \
        -e "s|__SLUG__|$slug|g" \
        -e "s|__DATE__|$date_iso|g" \
        "$f"
    done

echo "Scaffolded $dst"
echo "Next: spawn playground-architect to draft spec.md"
