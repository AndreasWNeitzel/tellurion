
## Code-fix sweep 2026-05-18
Reviewer capture-range was wrong for this code; investigated render and swept the correct parameter. Recaptured, 5 frames distinct + screenshot-verified, invariants 5, visual 5/5 x3. Shipped.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
REVIEW verdict (CONFIRMED/NEEDS CODE FIX) is STALE (pre-fix). Verified-clean: golden frames 5/5 byte-distinct, invariants.test.mjs is a real non-skeleton suite that passes, and the headline closed form was node-hand-checked vs the textbook: R proportional t^(2/5) (R(32t)/R(t)=32^0.4=4.000); strong-shock rho2/rho1=4 (gamma=5/3); 5 real invariants pass. No code/render change; render unchanged so no gate needed.

## Hero rehaul 2026-05-19 (mission #286)
Below hero: thin (yellow concentric rings + a dot), no sense of the
remnant / swept ISM / deceleration. Rebuilt render-only (sim.js
shockRadius/shockSpeed/postShockDensity + the 5 invariants
byte-identical):
- Primary is a supernova remnant in a seeded ambient ISM particle
  field: a hot rarefied interior, and the shock sweeps every particle
  within R(t) into a thin bright shell (mass conservation made
  visible; rho2/rho1 = 4), expanding and self-similarly decelerating
  (R proportional (E/rho)^1/5 t^2/5; v_s falls). The shell colour
  cools (white-blue -> orange -> red) as v_s drops.
- log R vs log t demoted to a thin diagnostic showing the 2/5 slope
  with a live marker. logE / logn drive remnant size and speed.
- Capture sweeps t (young -> old) -> 5 distinct goldens (R 7.9 pc /
  985 km/s -> R 12.7 pc / 481 km/s, verified).
Gate: 5 invariants + smoke + visual 5/5 x3 PASS. Shipped.
