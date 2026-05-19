# DEVNOTES - bsc-y3s2/AST3017-bbn-light-element-toy (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-18
Added comprehensive ## Explainer (first-exposure plain language, all governing equations in KaTeX, bibliographic origin); render-neutral.
invariants invariants pass + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
REVIEW (NEEDS CODE FIX + RECAPTURE) partly stale: BBN abundance physics correct (Y_p rises, D/H falls steeply, 7Li valley vs eta; Planck eta=6.1 marked), sim.js + 5 real invariants pass, hook real, has Explainer. Sole genuine defect: bootSync ignored captureFraction so all 5 goldens identical at eta=6.1. Fixed: added CAPTURE_FRAC; capture sweeps st.eta = 1.5 + frac*16.5 and syncs the slider. Recaptured 5 distinct goldens; READ t-000 (eta=1.5: D/H=2.4e-4 high, Y_p=0.233) and t-100 (eta=18: D/H=4.5e-6, Y_p=0.262) physically correct, 60fps. leakscan2=0. Shipped.

## Sweep 2026-05-19
REVIEW NEEDS-CODE-FIX partly stale: physics + sim.js + real invariants + text already correct; sole genuine defect was bootSync ignoring captureFraction (5 identical goldens). Added CAPTURE_FRAC sweep + slider sync; recaptured 5 distinct verified-correct goldens.
invariants Tests  5 passed + visual 5/5 x3. Shipped.
