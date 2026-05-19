# DEVNOTES - bsc-y3s1/AST3014-single-particle-em-drift-3d (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
Pure first-exposure-physics user-facing text; no source-code, tooling, performance or CI references.
invariants Tests  6 passed + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
REVIEW (NEEDS CODE FIX + RECAPTURE) partly stale: Boris-pusher F=q(E+vxB) physics correct (ExB drift vd=E0/B0=0.4), sim.js + 6 real invariants pass, hook real, has Explainer. PARTIAL-degenerate defect: capture used the cyclotron preset (a closed circle: trail saturates to the full loop, frames stop differing -> 3/5). Fixed: capture now uses the exb preset (the playground headline; guiding centre translates so every frame is distinct) sweeping steps = round(frac*520). Recaptured 5 distinct goldens; READ t-000 (released at origin, vd=0.400) and t-100 (textbook ExB cycloid: gyration + steady guiding-centre drift) physically correct, 60fps. No sim/invariants/text change. leakscan2=0. Shipped.

## Sweep 2026-05-19
REVIEW NEEDS-CODE-FIX partly stale: physics + sim.js + real invariants + text already correct; sole genuine defect was bootSync ignoring captureFraction (5 identical goldens). Added CAPTURE_FRAC sweep + slider sync; recaptured 5 distinct verified-correct goldens.
invariants Tests  6 passed + visual 5/5 x3. Shipped.
