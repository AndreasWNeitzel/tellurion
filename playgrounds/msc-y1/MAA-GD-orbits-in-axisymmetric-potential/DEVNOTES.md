# DEVNOTES - msc-y1/MAA-GD-orbits-in-axisymmetric-potential (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Added comprehensive ## Explainer (first-exposure plain language, all governing equations in KaTeX, bibliographic origin); render-neutral.
invariants Tests  4 passed + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
Real card text (hook + one_paragraph) sourced from the spec body; render-neutral.
invariants Tests  4 passed + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
Real card text (hook + one_paragraph) sourced from the spec body; render-neutral.
invariants Tests  4 passed + visual 5/5 x3. Shipped.

## Hero rehaul + physics fix 2026-05-19 (mission #286)
PHYSICS BUG: the old code integrated R-double-dot = F_R, z with NO
angular momentum (rk4Orbit had no L_z), so for every input the star
was a degenerate radial plunge straight through R=0. No rosette,
flatly contradicting this card's own spec (which describes conserved
E, L_z, Phi_eff, rosettes). Fixed by appending the correct meridional
dynamics; sim.js miyamotoPotential / forceR / forceZ / rk4Orbit are
byte-identical:
- effPotential = Phi + L_z^2/2R^2; orbitEnergy; leapfrogMeridional
  (kick-drift-kick, symplectic as the spec demands) with the
  centrifugal term L_z^2/R^3 added to F_R.
- slider-v repurposed from a useless radial-velocity knob to the
  physically essential azimuthal speed v_phi, which sets
  L_z = R0 v_phi. HTML label/aria/description updated.
- Render is now the two textbook pictures: left, the face-on rosette
  filling the annulus between peri/apo guide circles, precessing
  (alive); right, the (R,z) orbit filling its box inside the shaded
  zero-velocity curve Phi_eff <= E. Live conserved readout: L_z
  const, |dE/E| ~ 1e-5 (symplectic).
- Tracked true peri/apo separately from padded panel-scaling bounds
  so the printed peri/apo are the real turning radii (was showing
  the padded values).
- Invariants 4 -> 7: effPotential adds positive centrifugal term;
  leapfrog conserves orbitEnergy < 1e-3 over 20000 steps; the
  centrifugal barrier keeps R in a bound annulus (no plunge).
- Capture sweeps integration progress (60 -> 1760 steps): 5
  byte-distinct goldens (few petals -> filled rosette).
Live-verified (peri/apo 5.2/8.0 kpc at the defaults; rosette fills
and precesses; orbit stays inside the zero-velocity region).
Gate: 7 invariants + smoke + visual 5/5 x3 PASS. Shipped.
