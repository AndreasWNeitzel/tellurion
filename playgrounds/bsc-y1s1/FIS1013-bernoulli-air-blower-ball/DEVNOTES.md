# DEVNOTES - FIS1013-bernoulli-air-blower-ball (hidden dev ref)

Repo-only. Not linked, not in gallery, never shown to users.

## What it is
Canvas2D. A light ball levitates in a turbulent free jet: vertical
balance where quadratic sphere drag equals gravity; lateral stability
from the entrainment / Bernoulli pressure gradient across the sphere.
Nozzle tilts, power varies, blower can switch off, ball draggable and
self-recentres. Pure local sim.js, no shared engine, no GL.

## Post-build sweep record (2026-05-18)
- Opus visual-reviewer 6/6 PASS: nozzle + spreading jet streamlines,
  bronze ball tracking the jet across a tilt sweep (-18 to +18 deg),
  readout legible, no defects, self-centering story reads.
- Health: hook/one_paragraph already approachable. Only fix: removed
  the raw bib key "(`tritton`)" from the user-facing figcaption (kept
  the human-readable Tritton source). Render-neutral, NO recapture.
- 7 invariants. Index rebuilt.

## Gate commands
- node --check playground.js sim.js
- npx vitest run invariants.test.mjs   (7 tests)
- node scripts/build-index.mjs
- visual gate only if #stage changes (this sweep was caption-only).

## Sweep 2026-05-18
Added comprehensive ## Explainer (first-exposure plain language, all governing equations in KaTeX, bibliographic origin); render-neutral.
invariants Tests  7 passed + visual 5/5 x3. Shipped.
