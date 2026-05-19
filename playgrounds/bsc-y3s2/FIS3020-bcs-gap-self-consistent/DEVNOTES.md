# DEVNOTES - bsc-y3s2/FIS3020-bcs-gap-self-consistent (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
REVIEW (CONFIRMED CODE FIX + RECAPTURE) partly stale: BCS self-consistent gap physics correct (2 Delta0/kBTc = 3.54 = BCS weak-coupling value), sim.js + 4 real invariants pass, hook real, has Explainer. Sole genuine defect: bootSync ignored captureFraction so all 5 goldens identical at tRel=0.3. Fixed: added CAPTURE_FRAC; deterministic capture sets st.tRel = 0.05 + frac (to ~1.05) and syncs the T slider. Recaptured 5 distinct goldens; READ t-000 (T/Tc=0.05, gap open, SUPERCONDUCTING, Delta/Delta0=1.0) and t-100 (T/Tc=1.05, gap closed, NORMAL STATE, Delta=0) physically correct gap-closing through Tc, 60fps. No sim/invariants/text change. leakscan2=0. Shipped.

## Sweep 2026-05-19
REVIEW CONFIRMED-CODE-FIX partly stale: BCS gap physics (2D0/kBTc=3.54), sim.js, 4 invariants, text already correct. Sole genuine defect: bootSync ignored captureFraction so all 5 goldens identical at tRel=0.3. Added CAPTURE_FRAC; capture sweeps st.tRel 0.05->1.05; recaptured 5 distinct verified-correct goldens (T/Tc=0.05 gap open superconducting; T/Tc=1.05 gap closed normal state).
invariants Tests  4 passed + visual 5/5 x3. Shipped.
