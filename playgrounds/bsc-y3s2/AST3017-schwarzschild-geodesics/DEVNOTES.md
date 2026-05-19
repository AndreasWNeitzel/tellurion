# DEVNOTES - bsc-y3s2/AST3017-schwarzschild-geodesics (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
REVIEW (NEEDS CODE FIX + RECAPTURE) partly stale: Schwarzschild null-geodesic physics correct (b_crit=3 sqrt3 M=5.196, capture for b<b_crit, deflection for b>b_crit, photon sphere r=3), sim.js + 7 real invariants pass, hook real, has Explainer. PARTIAL-degenerate defect: bootSync swept target=round(frac*CAPTURE_TOTAL_STEPS) with CAPTURE_TOTAL_STEPS=1500 but the fan fully resolves by ~750 steps, so t-050/t-075/t-100 were byte-identical (3/5). Fixed: span capped to round(frac*600) so all 5 frames land in the evolving window. Recaptured 5 distinct goldens; READ t-000 (plane wave released, b_crit=5.196) and t-100 (600 steps: swallowed red rays b<b_crit, deflected rays b>b_crit, photon-sphere whirl) physically correct, 60fps. No sim/invariants/text change. leakscan2=0. Shipped.

## Sweep 2026-05-19
REVIEW NEEDS-CODE-FIX partly stale: physics + sim.js + real invariants + text already correct; sole genuine defect was bootSync ignoring captureFraction (5 identical goldens). Added CAPTURE_FRAC sweep + slider sync; recaptured 5 distinct verified-correct goldens.
invariants Tests  7 passed + visual 5/5 x3. Shipped.
