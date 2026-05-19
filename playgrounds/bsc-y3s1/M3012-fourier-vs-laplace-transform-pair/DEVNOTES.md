# DEVNOTES - bsc-y3s1/M3012-fourier-vs-laplace-transform-pair (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
REVIEW (CONFIRMED CODE FIX + RECAPTURE) partly stale: Fourier/Laplace transform-pair physics correct (exp -> Lorentzian + 1/(s+a) + one real LHP pole; damped cos -> twin Lorentzians + (s+a)/((s+a)^2+w0^2) + conjugate LHP poles), sim.js + 6 real invariants pass, hook real, has Explainer. Genuine defect: bootSync had NO captureFraction read (static render) so goldens did not vary. Fixed: added CAPTURE_FRAC; capture steps through 5 (a,omega0,fn) states (exp a=0.6/1.5, cos w0=2/4, ramp) syncing the sliders/select. Recaptured 5 distinct goldens; READ t-000 (exp: decay, Lorentzian, 1/(s+a), 1 real pole) and t-050 (damped cos: oscillatory decay, twin Lorentzians, 2 conjugate poles) physically correct, 60fps. No sim/invariants/text change. leakscan2=0. Shipped.

## Sweep 2026-05-19
REVIEW NEEDS-CODE-FIX partly stale: physics + sim.js + real invariants + text already correct; sole genuine defect was bootSync ignoring captureFraction (5 identical goldens). Added CAPTURE_FRAC sweep + slider sync; recaptured 5 distinct verified-correct goldens.
invariants Tests  6 passed + visual 5/5 x3. Shipped.
