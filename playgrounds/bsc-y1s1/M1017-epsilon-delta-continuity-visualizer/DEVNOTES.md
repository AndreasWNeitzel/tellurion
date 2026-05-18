# DEVNOTES - M1017-epsilon-delta-continuity-visualizer (hidden dev ref)

Repo-only. Not linked, not in gallery, never shown to users.

## What it is
Canvas2D. f(x)=sin x with an epsilon (y) band and delta (x) band at a
point; solves the largest delta keeping the curve in the epsilon band.
Capture sweeps epsilon 0.05 -> 0.45 (delta tracks). Readout: epsilon,
delta_max.

## Post-build sweep record (2026-05-18)
- Opus visual-reviewer 6/6 PASS (curve + epsilon/delta box, box grows
  with epsilon, delta tracks, frames distinct, render correct).
- Fixed: placeholder hook/one_paragraph rewritten approachable
  (continuity as the epsilon-delta game). Removed the raw arfken-weber
  key from the figcaption. Render-neutral, NO recapture. Index rebuilt.

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs
- node scripts/build-index.mjs
- visual gate only if #stage changes (this sweep was text-only).

## Sweep 2026-05-18
Added comprehensive ## Explainer (first-exposure plain language, all governing equations in KaTeX, bibliographic origin); render-neutral.
invariants Tests  5 passed + visual 5/5 x3. Shipped.
