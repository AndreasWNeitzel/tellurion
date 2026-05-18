# DEVNOTES - bsc-y2s1/AST2004-transit-mandel-agol-analytic (hidden dev ref)

Repo-only.

## Sweep 2026-05-18 (text-only, render-neutral)
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose. sim/render untouched; invariants 6/6 + visual 5/5 x3 vs existing goldens. Shipped.

## Sweep 2026-05-18
Fixed degenerate capture (frame0==frame4 phase wrap). CAPTURE_FRAC -> t*4.8 sweeps the transit monotonically; capture deterministic across two runs and matching the promoted goldens; visual.test passes 5/5 directly. Screenshot-verified planet crossing the limb-darkened star and the marker tracking the U-shaped light curve. Added comprehensive ## Explainer.
invariants Tests passed + visual 5/5 x3. Shipped.
