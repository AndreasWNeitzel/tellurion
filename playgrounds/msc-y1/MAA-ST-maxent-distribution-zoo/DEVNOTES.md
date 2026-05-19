# DEVNOTES - msc-y1/MAA-ST-maxent-distribution-zoo (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Added comprehensive ## Explainer (first-exposure plain language, all governing equations in KaTeX, bibliographic origin); render-neutral.
invariants Tests  12 passed + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
Pure first-exposure-physics user-facing text; no source-code, tooling, performance or CI references.
invariants Tests  12 passed + visual 5/5 x3. Shipped.

## Rebuild 2026-05-19 (live-review #282)
User: "very boring zoo with no actual interactivity." It was a single
static pdf curve (the banned plot-as-main) and interaction-probe
flagged slider-supp DEAD (it only mattered for the uniform family,
hidden for the default gaussian). Rebuilt:
- sim.js APPENDED (existing exports byte-identical): makeRng,
  sampleFamily (direct inversion / Box-Muller), structuredPdf (same
  support, imposed cosine ripple, renormalised; strictly lower
  entropy). invariants 12 -> 21 (structure strictly lowers entropy
  and is monotone in s; structuredPdf normalised; sampler reproduces
  the constraint mean). Caught my own wrong premise mid-build: the
  ripple does not preserve moments exactly, so the claim is framed as
  "added structure beyond the constraints costs entropy", not "same
  moments".
- playground.js: primary is now the living empirical sample cloud
  (4000 draws accumulating into a histogram that converges to the
  pdf); the analytic pdf is a diagnostic overlay; "added structure"
  (repurposed slider-supp, 0..1, always shown) morphs in the
  lower-entropy competitor with a live h* vs h panel. Uniform width
  now driven by the scale slider. interaction-probe: all four
  controls drive the canvas (supp 0.00% -> 1.23%).
- index.html: support row relabelled "added structure" (0..1);
  scale row relabelled. Capture sweeps family; last frame struct=0.6.
Gate: 21 invariants + smoke + visual 5/5 x3 PASS. Shipped.
