# DEVNOTES - bsc-y3s2/AST3017-gravitational-lensing-caustics (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Added comprehensive ## Explainer (first-exposure plain language, all governing equations in KaTeX, bibliographic origin); render-neutral.
invariants Tests  1 passed + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
REVIEW (NEEDS CODE FIX + RECAPTURE) was GENUINE: (1) capture frozen at default source -> 5 byte-identical goldens; (2) invariants.test.mjs was a skeleton energy-drift mock, no sim.js. Fixed: extracted DOM-free sim.js (alphaAt/mapToSource/jacobianDet/findImages/pointLensMagnification), playground.js imports it; deterministic capture now sets binary mode and sweeps the source across the figure-eight caustic by captureFraction (5 distinct frames, read t-000 outside caustic=3 images, t-050 inside=5 images, caustic crossing correct, 60fps). Wrote 7 real invariants (Einstein-ring det A=0 at |theta|=1 and =1-1/r^4 closed form, lens-equation residual, exactly 2 images off-ring, point-lens magnification (u^2+2)/(u sqrt(u^2+4)), binary odd-image caustic crossing, determinism, mass normalisation) all pass. leakscan2=0. Shipped.

## Sweep 2026-05-19
REVIEW NEEDS-CODE-FIX genuine: frozen capture (5 identical goldens) + skeleton invariants. Extracted DOM-free sim.js, deterministic source sweep across the binary caustic, 7 real invariants pass, recaptured 5 distinct physically-correct goldens.
invariants Tests  7 passed + visual 5/5 x3. Shipped.
