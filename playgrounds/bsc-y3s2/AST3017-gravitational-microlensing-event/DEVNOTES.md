# DEVNOTES - bsc-y3s2/AST3017-gravitational-microlensing-event (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
REVIEW (NEEDS CODE FIX + RECAPTURE) GENUINE (HEAVY): (1) invariants.test.mjs was a 1-test skeleton mock, no sim.js; (2) frozen capture (state.t hardcoded 0) -> all 5 goldens identical. Paczynski physics itself correct. ALSO found a legacy arithmetic error: the old __physicsCheck and its comment claimed A(0.3)=3.461, but the exact closed form (u^2+2)/(u sqrt(u^2+4)) at u=0.3 = 2.09/0.60671 = 3.4448 (they used 0.604 vs 0.60671). Fixed: extracted DOM-free sim.js (magnification/imagePositions/uOfT/lightCurve/peakMagnification), playground.js imports it; added CAPTURE_FRAC sweeping state.t from -120 to +120 (rise->peak->fade); wrote 8 real invariants (A(0.3)=3.4448, A->1 as u->inf, A strictly decreasing, A(1)=3/sqrt5, theta_+ theta_- = -1 and sum=u, time symmetry + peak at t0, smaller u0 sharper peak, determinism) all pass; corrected __physicsCheck to 3.4448. Recaptured 5 distinct goldens; READ t-000 (t=-120 lens far, marker at baseline A~1) and t-050 (t=0 lens on source, Einstein ring, marker at Paczynski peak) physically correct, 60fps. leakscan2=0. Shipped.

## Sweep 2026-05-19
REVIEW NEEDS-CODE-FIX partly stale: physics + sim.js + real invariants + text already correct; sole genuine defect was bootSync ignoring captureFraction (5 identical goldens). Added CAPTURE_FRAC sweep + slider sync; recaptured 5 distinct verified-correct goldens.
invariants Tests  8 passed + visual 5/5 x3. Shipped.

## Merge 2026-05-19
Merged AST3017-gravitational-lensing-caustics INTO this card. Interactive image-plane lensing sandbox: point/binary lens, critical curve (det A=0 scan), source-plane caustic, lensed images from the lens equation (grid-seed Newton), draggable + drifting source, Einstein ring; magnification A(t) is the diagnostic strip. sim.js keeps the point-lens Paczynski API (invariants 8/8 unchanged) plus makeLenses/mapToSource/jacobianDet/imageMag/findImages. Deleted the redundant caustics card; regenerated index/catalogue/landing (0 dangling refs). Note: recapture goldens AFTER any spec.md hook edit (the longer hook made the page 2px taller -> first gate hit a dimension mismatch; recaptured against the regenerated index.html and PASS). smoke OK, visual 5/5 x3.
