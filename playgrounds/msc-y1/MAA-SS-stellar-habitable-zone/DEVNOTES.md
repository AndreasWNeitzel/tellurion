# DEVNOTES - msc-y1/MAA-SS-stellar-habitable-zone (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
REVIEW (NEEDS CODE FIX) was GENUINE on both points (HEAVY): (1) invariants.test.mjs was the skeleton energy-drift MOCK (no sim.js); (2) frozen capture -> all 5 goldens identical. Physics (T_eq Stefan-Boltzmann balance, HZ bounds) was correct. Fixed: extracted DOM-free sim.js (luminosity/Teq/radiusAtT/hzBounds/inHZ), playground.js imports it (removed inline duplicate + unused rng import); added CAPTURE_FRAC sweeping the planet a from 0.30 to 3.0 AU (slider synced); wrote 9 real invariants (L=R^2(Teff/Tsun)^4, Earth T_eq~254 K, T_eq~1/sqrt(a), (1-A)^1/4, HZ edges exactly at 273/200 K, HZ ~ sqrt(L), inHZ consistency, determinism) all pass. Recaptured 5 distinct goldens; READ t-000 (a=0.30 AU T_eq=464 K hot/red, inside HZ inner) and t-050 (a=1.65 AU T_eq=198 K cold/blue, past HZ outer; HZ=[0.87,1.62] AU exact) physically correct, 60fps. leakscan2=0. Shipped.

## Sweep 2026-05-19
REVIEW NEEDS-CODE-FIX partly stale: physics + sim.js + real invariants + text already correct; sole genuine defect was bootSync ignoring captureFraction (5 identical goldens). Added CAPTURE_FRAC sweep + slider sync; recaptured 5 distinct verified-correct goldens.
invariants Tests  9 passed + visual 5/5 x3. Shipped.
