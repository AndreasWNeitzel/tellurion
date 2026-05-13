#!/usr/bin/env bash
# scripts/scaffold.sh <slug> [<curriculum_year> <primary_uc>]
# Copies playgrounds/_template into the curriculum-aligned tree at
#   playgrounds/<curriculum_year>/<primary_uc>-<slug>/
# If curriculum_year and primary_uc are omitted, falls back to the legacy
# flat path playgrounds/<slug>/, which a follow-up rename can move into
# the curriculum tree. The _template's shared/ imports still resolve from
# either location because the template uses ../../shared/ paths; if the
# scaffold lands in the curriculum tree the depth becomes wrong and must
# be patched (scaffold-curriculum-batch.mjs handles this).

set -euo pipefail

slug="${1:?Usage: scaffold.sh <kebab-slug> [<curriculum_year> <primary_uc>]}"
year="${2:-}"
uc="${3:-}"

if [[ ! "$slug" =~ ^[a-z0-9][a-z0-9]*(-[a-z0-9]+)*$ ]]; then
  echo "Invalid slug. Use kebab-case: lowercase letters, digits, hyphens. Leading char must be alphanumeric." >&2
  exit 1
fi

src="playgrounds/_template"

if [ -n "$year" ] && [ -n "$uc" ]; then
  dst="playgrounds/$year/$uc-$slug"
else
  dst="playgrounds/$slug"
fi

if [ -d "$dst" ]; then
  echo "$dst already exists." >&2
  exit 1
fi

mkdir -p "$(dirname "$dst")"
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
