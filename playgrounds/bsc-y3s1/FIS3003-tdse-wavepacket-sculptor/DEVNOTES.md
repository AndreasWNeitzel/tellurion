# DEVNOTES - bsc-y3s1/FIS3003-tdse-wavepacket-sculptor (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Rewrote placeholder hook/one_paragraph as first-exposure-undergrad prose; render-neutral.
invariants  + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
Pure first-exposure-physics user-facing text; no source-code, tooling, performance or CI references.
invariants Tests  8 passed + visual 5/5 x3. Shipped.

## Fix 2026-05-19 (user: "broken / won't initiate / no start button")
sim.js was correct (node-verified: free packet at k0=3 moves right
v~3, CN unitary, the 8 invariants incl. unitarity + energy pass). The
real problem was UX/tuning: it auto-ran but the default barrier
(E=k0^2/2=4.5 << V0=8) mostly reflected with little visible travel
(slow STEPS_PER_FRAME=3, broad sig=1.8), so for several seconds it
looked like a static smear with no obvious launch -> read as broken.
playground.js only (sim.js + 8 invariants byte-identical):
- Default k0 3.0 -> 4.0 so E = 8 ~ V0 = 8: the barrier splits the
  packet into clearly comparable reflected + tunnelled lobes (the
  headline), T(right) climbs visibly.
- STEPS_PER_FRAME 3 -> 6 and sig 1.8 -> 1.2: a tight pulse that
  visibly travels across and interacts within ~1.5 s.
- Auto-relaunch: holds the final split ~1.2 s then rebuild(0) loops,
  so it is continuously alive.
- Added an explicit "Launch" button (re-fires from t=0); Reset
  default k0 -> 4.0.
Live-verified: packet travels, splits at the barrier into reflected
(left) + tunnelled (right), T(right) 0.10 -> 0.24. Capture sweeps
nstep 0..1400 -> 5 distinct goldens. Gate 8 inv + smoke + 5/5 x3.
