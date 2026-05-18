# DEVNOTES - M1017-series-convergence-tests (hidden dev ref)

Repo-only. Not linked, not in gallery, never shown to users.

## What it is
Canvas2D. Partial sums S_N vs N for four series (geometric, p=2,
harmonic, alternating Leibniz) plus term and ratio/root-test panels.
Readout: series, S_N, verdict, limit.

## Post-build sweep record (2026-05-18)
- Opus visual-reviewer 6/6 PASS (partial-sum curve flattens or
  diverges, ratio/root panels, harmonic shown divergent, render
  correct, frames distinct).
- Fixed: placeholder hook/one_paragraph rewritten approachable
  (running total settles or runs off; harmonic = terms->0 not
  sufficient). Removed the raw arfken-weber key from the figcaption.
  Render-neutral, NO recapture. Index rebuilt.

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs
- node scripts/build-index.mjs
- visual gate only if #stage changes (this sweep was text-only).

## Sweep 2026-05-18
Added comprehensive ## Explainer (first-exposure plain language, all governing equations in KaTeX, bibliographic origin); render-neutral.
invariants Tests  7 passed + visual 5/5 x3. Shipped.
