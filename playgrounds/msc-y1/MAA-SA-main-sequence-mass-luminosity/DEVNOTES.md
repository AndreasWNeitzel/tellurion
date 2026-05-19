# DEVNOTES - msc-y1/MAA-SA-main-sequence-mass-luminosity (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Added comprehensive ## Explainer (first-exposure plain language, all governing equations in KaTeX, bibliographic origin); render-neutral.
invariants Tests  5 passed + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
Real card text (hook + one_paragraph) sourced from the spec body; render-neutral.
invariants Tests  5 passed + visual 5/5 x3. Shipped.

## Hero rehaul 2026-05-19 (mission #286)
Was the banned pattern: a single static log-log L-M cartesian curve
with a dot, no animation, and the capture sweep didn't vary M (5
identical goldens). Rebuilt render-only (sim.js L_solar /
MS_lifetime_Gyr + the 5 invariants byte-identical):
- Primary is a living main sequence: 11 stars at log-spaced masses,
  each sized R ~ M^0.7, coloured by Teff from Stefan-Boltzmann
  (T/Tsun = (L/R^2)^0.25), glow ~ log L, aging on its own clock
  age = elapsed / t_MS(M); near age 1 a death flash (SN spikes for
  M >= 8) then rebirth, so massive blue stars visibly die many times
  while the Sun barely ages and red dwarfs are immortal.
- A selected-star panel (slider M) reads M, L, Teff, R, t_MS with
  adaptive units (Gyr / Myr to 2 dp for sub-10-Myr, so M=60 shows
  0.31 Myr, not a misleading "0 Myr").
- The log-log L-M relation is demoted to a thin bottom diagnostic
  strip with the current marker.
- Glow halos bounded (gr = rad*(1.5+0.6 glowK)) so high-mass stars
  do not white out the readout or neighbours. Capture sweeps
  M in {0.3,1,5,20,60} at a frozen clock -> 5 distinct goldens.
Gate: 5 invariants + smoke + visual 5/5 x3 PASS. Shipped.
