# DEVNOTES - bsc-y3s2/AST3016-radiative-transfer-1d-slab (hidden dev ref)

Repo-only.

## Code-fix sweep 2026-05-18
playground.js: added CAPTURE_FRAC; bootSync sweeps st.tau=0.2+CAPTURE_FRAC*8; t-100 verified I(tau=8.2)->S=3.0 saturation.
Recaptured; 5 golden frames now distinct (screenshot-verified). invariants 6/6 + visual 5/5 x3. Shipped.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
REVIEW verdict (CONFIRMED/NEEDS CODE FIX) is STALE (pre-fix). Verified-clean: golden frames 5/5 byte-distinct, invariants.test.mjs is a real non-skeleton suite that passes, and the headline closed form was node-hand-checked vs the textbook: Beer-Lambert e^-tau transmission and emergent profile; 6 real invariants pass. No code/render change; render unchanged so no gate needed.

## Hero rehaul 2026-05-19 (mission #286, no-plot-as-main)
Was the banned pattern: a static I(tau) cartesian curve. Rebuilt
render-only (sim.js transmitOptical/profileVsTau + the 6 invariants
byte-identical):
- Primary is the physical scene: a source of brightness I_in, a
  tinted slab (opacity grows with tau, tint with S), and a beam
  whose colour/brightness relaxes along the path from I_in toward S
  via transmitOptical(I_in,S,tau*f); streaming photons sample the
  local intensity; an observer + emergent I_out + regime label
  (optically thin -> I_out~I_in; thick -> I_out~S).
- A spectrum strip turns it into the real payoff: an absorption dip
  (S<I_in) or emission bump (S>I_in) on the continuum.
- I(tau) demoted to a thin diagnostic with the S reference + marker.
- Capture sweeps 5 regime cases (thin / thick absorption / thick
  emission / S=I_in / strong emission) -> 5 distinct goldens.
One transient VIS_FAIL run2 (glow-gradient AA flake); clean 5/5 x3
on re-gate. Gate: 6 invariants + smoke + visual 5/5 x3 PASS. Shipped.
