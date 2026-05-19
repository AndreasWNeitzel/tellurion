# DEVNOTES - bsc-y3s2/AST3017-distance-ladder-toy (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
REVIEW (NEEDS CODE FIX + RECAPTURE) partly stale: distance-ladder error-compounding physics correct (orthogonal sum: 1,2,3% -> 3.74%; 6,12,14% -> 19.4%), sim.js + 4 real invariants pass, hook real, has Explainer. Sole genuine defect: bootSync ignored captureFraction so all 5 goldens identical. Fixed: added CAPTURE_FRAC; capture widens st.s1/s2/s3 with frac and syncs the 3 sliders. Recaptured 5 distinct goldens; READ t-000 (sigma 1/2/3%, Hubble 3.7%) and t-100 (6/12/14%, Hubble 19.4%) physically correct compounding, 60fps. leakscan2=0. Shipped.

## Sweep 2026-05-19
REVIEW NEEDS-CODE-FIX partly stale: physics + sim.js + real invariants + text already correct; sole genuine defect was bootSync ignoring captureFraction (5 identical goldens). Added CAPTURE_FRAC sweep + slider sync; recaptured 5 distinct verified-correct goldens.
invariants Tests  4 passed + visual 5/5 x3. Shipped.
