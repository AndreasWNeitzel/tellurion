# DEVNOTES - bsc-y3s2/FIS3025-rayleigh-benard-convection (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
Pure first-exposure-physics user-facing text; no source-code, tooling, performance or CI references.
invariants Tests  6 passed + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
Pure first-exposure-physics user-facing text; no source-code, tooling, performance or CI references.
invariants Tests  6 passed + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
REVIEW (NEEDS CODE FIX + RECAPTURE) partly stale: Boussinesq linear-stability physics correct (Ra_c=27 pi^4/4=657.51 at k_c=pi/sqrt2; sigma<0 below Ra_c -> conduction, sigma>0 above -> growing rolls), sim.js + 6 real invariants pass, hook real, has Explainer. PARTIAL-degenerate defect: capture grew the field a frac-proportional #steps that SATURATED by ~22 steps, so t-025..t-100 were byte-identical (2/5). Rate-tuning hit the sharp saturation cliff (4/5 either end). Fixed by reframing the sweep to the actual headline: step Ra across Ra_c at a fixed settling time -- raMul [0.6,1.05,1.5,2.5,5.0]*Ra_c, 70 steps each. Sub-critical decays to flat conduction; super-critical saturates to rolls of amplitude growing with Ra-Ra_c -> robustly 5 distinct. Recaptured 5 distinct goldens; READ t-000 (Ra/Ra_c=0.60 sigma=-3.34 flat, STABLE) and t-100 (Ra/Ra_c=5.0 vigorous rolls, UNSTABLE) physically correct convective onset, 60fps. No sim/invariants/text change. leakscan2=0. Shipped.

## Sweep 2026-05-19
REVIEW NEEDS-CODE-FIX partly stale: physics + sim.js + real invariants + text already correct; sole genuine defect was bootSync ignoring captureFraction (5 identical goldens). Added CAPTURE_FRAC sweep + slider sync; recaptured 5 distinct verified-correct goldens.
invariants Tests  6 passed + visual 5/5 x3. Shipped.
