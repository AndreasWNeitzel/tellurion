# DEVNOTES - msc-y1/MAA-GD-dynamical-friction-chandrasekhar (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Added comprehensive ## Explainer (first-exposure plain language, all governing equations in KaTeX, bibliographic origin); render-neutral.
invariants Tests  4 passed + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
Real card text (hook + one_paragraph) sourced from the spec body; render-neutral.
invariants Tests  4 passed + visual 5/5 x3. Shipped.

## Hero rehaul 2026-05-19 (mission #286, no-plot-as-main)
Was the banned pattern: a static |a_df|(v/sigma) curve, capture not
sweeping (5 identical goldens). Rebuilt render-only (sim.js
frictionMag/G_SI + the 4 invariants byte-identical):
- Primary is a live galaxy: a massive perturber on a near-circular
  orbit in a flat-Vc host, a 1500-particle background sea that the
  perturber focuses into a trailing wake (mini N-body, particles
  respawn so the sea stays full), and an inspiral trail. fShape()
  takes the Chandrasekhar velocity dependence from sim.frictionMag
  (M and prefactor cancel in the ratio); dfK ~ 10^((logM-8)/3) so
  the sinking time scales ~ 1/M.
- |a_df|(v/sigma) demoted to a side diagnostic; the marker sits
  steady near the peak (a circular orbit always has v ~ V0 ~ sigma).
- Numerics took 5 iterations: Euler dt=0.5 with friction
  proportional to M flung the body out and ejected the sea; a
  speed-kill drag overdamped (v -> 0 at fixed r, no infall). Final
  correct model is a circular-orbit radius decay (Binney and
  Tremaine Sec. 8.1): state (r, phi), phi advances at V0/r, r shrinks
  at an M-scaled rate, flat-Vc keeps the speed ~ V0. Stable,
  M-dependent, faithful. Capture sweeps logM {5,7,8.5,10,11.5} at a
  fixed mid-inspiral time -> 5 distinct goldens (wide orbit vs sunk).
Gate: 4 invariants + smoke + visual 5/5 x3 PASS. Shipped.
