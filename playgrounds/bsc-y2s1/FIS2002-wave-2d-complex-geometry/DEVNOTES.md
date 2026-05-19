# DEVNOTES - bsc-y2s1/FIS2002-wave-2d-complex-geometry (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Added comprehensive ## Explainer (first-exposure plain language, all governing equations in KaTeX, bibliographic origin); render-neutral.
invariants Tests  6 passed + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
Pure first-exposure-physics user-facing text; no source-code, tooling, performance or CI references.
invariants Tests  6 passed + visual 5/5 x3. Shipped.

## Fix 2026-05-19 (user: cannot draw / dishonest title; colormap; animation stops)
- Renamed "2D Waves in a Drawable Geometry" -> "2D Wave Diffraction:
  Slits and Obstacles" (spec title, index <title>/<h1>, caption);
  there is no draw tool, the body text was already accurate.
- Field colormap rdbu (white at zero) -> shared divBlack (black at
  zero); quiescent medium is black on the dark theme.
- Animation "randomly stopped": the loop halted at HORIZON=900
  steps. Removed the HORIZON gate from the live loop (per-frame step
  budget instead); the driven field now runs indefinitely in steady
  oscillation. HORIZON still maps the deterministic capture fraction.
Render/loop only; sim.js + 6 invariants byte-identical; goldens
recaptured. Gate 6 + smoke + 5/5 x3.
