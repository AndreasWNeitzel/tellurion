#!/usr/bin/env bash
# scripts/verify-all.sh
# Runs invariant tests and visual tests across every playground, plus engine unit tests.
# Exits nonzero on any failure. Used by CI and by /audit manually.

set -euo pipefail

cd "$(dirname "$0")/.."

# Engine unit tests
echo "::group::engine-unit-tests"
npx vitest run "tests/engines/**/*.test.mjs" --reporter=verbose
echo "::endgroup::"

# Playground invariant tests
echo "::group::playground-invariants"
for d in playgrounds/*/; do
  name=$(basename "$d")
  [ "$name" = "_template" ] && continue
  if [ -f "$d/invariants.test.mjs" ]; then
    echo "-- invariants: $name"
    npx vitest run "$d/invariants.test.mjs" --reporter=verbose
  else
    echo "-- skipping $name (no invariants.test.mjs)"
  fi
done
echo "::endgroup::"

# Playground visual tests
echo "::group::playground-visual"
for d in playgrounds/*/; do
  name=$(basename "$d")
  [ "$name" = "_template" ] && continue
  if [ -f "$d/visual.test.mjs" ] && [ -d "$d/references/golden-frames" ]; then
    echo "-- visual: $name"
    npx playwright test "$d/visual.test.mjs"
  else
    echo "-- skipping $name (no goldens yet)"
  fi
done
echo "::endgroup::"

echo "All gates passed."
