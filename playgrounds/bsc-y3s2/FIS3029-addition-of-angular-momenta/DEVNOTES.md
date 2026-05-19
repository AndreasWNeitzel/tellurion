# DEVNOTES - bsc-y3s2/FIS3029-addition-of-angular-momenta (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
REVIEW (CODE FIX + RECAPTURE) partly stale: physics (Clebsch-Gordan allowedJ/multiplicity/sum-rule) correct, invariants real 4/4 pass, sim.js present, hook/one_paragraph already real prose (NOT placeholders; that REVIEW claim was stale), has ## Explainer. GENUINE current defect: bootSync ignored captureFraction so all 5 goldens were byte-identical at j1=j2=1/2. Fixed: added CAPTURE_FRAC read; deterministic capture sweeps (j1,j2) over [[.5,.5],[1,.5],[1,1],[1.5,1],[2,1]] (also syncs the sliders). Recaptured 5 distinct goldens; READ t-000 (1/2x1/2=0+1 dim4) and t-100 (2x1=1+2+3 dim15=3+5+7) physically correct, 60fps. No sim/invariants/text change. leakscan2=0. Shipped.

## Sweep 2026-05-19
REVIEW CODE-FIX partly stale: Clebsch-Gordan physics, sim.js and 4 invariants already correct, hook/one_paragraph real, has Explainer. Sole genuine defect: bootSync ignored captureFraction so all 5 goldens were identical at j1=j2=1/2. Added CAPTURE_FRAC; deterministic capture sweeps (j1,j2); recaptured 5 distinct verified-correct goldens (1/2x1/2=0+1; 2x1=1+2+3).
invariants Tests  4 passed + visual 5/5 x3. Shipped.
