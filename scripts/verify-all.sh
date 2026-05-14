#!/usr/bin/env bash
# scripts/verify-all.sh
# Runs invariant tests (vitest) + visual tests (playwright) + HTML lint + a11y audit.
# Exits nonzero on any failure. Used by CI and by /audit manually.

set -euo pipefail
cd "$(dirname "$0")/.."

echo "::group::invariants"
npx vitest run --reporter=default
echo "::endgroup::"

echo "::group::html-lint"
node scripts/lint-playground-html.mjs
echo "::endgroup::"

echo "::group::a11y"
node scripts/a11y-audit.mjs
echo "::endgroup::"

echo "::group::smoke"
node scripts/smoke-test.mjs
echo "::endgroup::"

echo "::group::perf-aggregate"
node scripts/perf-aggregate.mjs
echo "::endgroup::"

echo "::group::visual-tests"
npx playwright test --reporter=line
echo "::endgroup::"

echo "All gates green."
