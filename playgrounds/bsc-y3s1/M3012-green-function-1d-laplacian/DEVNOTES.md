# DEVNOTES - bsc-y3s1/M3012-green-function-1d-laplacian (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
REVIEW (CONFIRMED CODE FIX + RECAPTURE) partly stale: Greens-function physics correct (tent peaks at x0, vanishes at Dirichlet boundaries; u = integral G f solves -u`` = f), sim.js + 5 real invariants pass, hook real, has Explainer. The REVIEW`s suggested fn list (const/sine/gauss/delta) was a wrong guess; actual options are const/step/gauss/sin. Sole genuine defect: bootSync ignored captureFraction so all 5 goldens identical at x0=0.5/const. Fixed: added CAPTURE_FRAC; deterministic capture steps through 5 (x0, fn) states (x0 0.20->0.80 with const/step/gauss/sin) and syncs the slider/select. Recaptured 5 distinct goldens; READ t-000 (x0=0.20 tent, f=const, u parabola) and t-050 (x0=0.50 tent, Gaussian f, smooth u) physically correct, 60fps. No sim/invariants/text change. leakscan2=0. Shipped.

## Sweep 2026-05-19
REVIEW CONFIRMED-CODE-FIX partly stale: Greens-function physics, sim.js, 5 invariants, text already correct (REVIEW fn list was a wrong guess). Sole genuine defect: bootSync ignored captureFraction so all 5 goldens identical. Added CAPTURE_FRAC; capture steps 5 (x0,fn) states; recaptured 5 distinct verified-correct goldens (tent peaks at x0, u solves -u''=f, Dirichlet).
invariants Tests  5 passed + visual 5/5 x3. Shipped.
