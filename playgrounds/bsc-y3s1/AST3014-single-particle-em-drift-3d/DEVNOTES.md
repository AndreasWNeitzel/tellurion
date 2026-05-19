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

## Live-fix 2026-05-19
User: "most options just quickly drift out of the visualization. Kinda boring. Not very educational. Feels like something is missing." Root cause: proj() used a fixed world origin and per-preset fixed scale, so the drifting presets (E x B, grad-B, curvature) translated the guiding centre straight off the fixed viewport within a few gyro-periods; and there was no field/drift scaffolding. Fix (render-side; sim.js Boris pusher + invariants byte-identical): (1) guiding centre = slow EMA of position (gyration averages out, drift remains); a camera eases to follow it so the orbit is always framed for every preset while you watch the particle gyrate about the drifting guiding centre. (2) Pedagogy overlays: faint B-field arrow grid, guiding-centre cross marker, instantaneous velocity vector v, the E x B drift vector v_d, and a per-preset drift label/formula (E x B, grad-B, curvature, mirror). Verified live (capture = E x B preset): particle stays centred across all 5 frames (was drifting off), overlays render. invariants 6/6, smoke OK, visual 5/5 x3, 60 fps.
