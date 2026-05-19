# DEVNOTES - bsc-y3s2/FIS3020-cooper-pair-binding-energy (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
REVIEW (NEEDS CODE FIX + RECAPTURE) partly stale: Cooper-problem physics correct (E_b ~ exp(-2/N0V), pair-wavefunction width ~ E_b), sim.js + 8 real invariants pass, hook real, has Explainer; the REVIEW "raw bib key in HTML" claim is STALE (no backtick bibkey in any data-slot; leakscan2=0). Sole genuine defect: bootSync ignored captureFraction so all 5 goldens identical at V=0.3. Fixed: added CAPTURE_FRAC; capture sweeps st.V = 0.15 + frac*0.55 and syncs the V slider. Recaptured 5 distinct goldens; READ t-000 (V=0.15, E_b=3.24e-6 hw_D, narrow |g|) and t-100 (V=0.70, E_b=1.15e-1 hw_D, broadened |g|) physically correct exponential binding, 60fps. No sim/invariants/text change. leakscan2=0. Shipped.

## Sweep 2026-05-19
REVIEW NEEDS-CODE-FIX partly stale: physics + sim.js + real invariants + text already correct; sole genuine defect was bootSync ignoring captureFraction (5 identical goldens). Added CAPTURE_FRAC sweep + slider sync; recaptured 5 distinct verified-correct goldens.
invariants Tests  8 passed + visual 5/5 x3. Shipped.
