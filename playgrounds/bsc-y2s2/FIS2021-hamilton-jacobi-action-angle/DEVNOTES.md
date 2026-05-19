# DEVNOTES - bsc-y2s2/FIS2021-hamilton-jacobi-action-angle (hidden dev ref)

Repo-only.

## Sweep 2026-05-18
Added comprehensive ## Explainer (first-exposure plain language, all governing equations in KaTeX, bibliographic origin); render-neutral.
invariants Tests  10 passed + visual 5/5 x3. Shipped.

## Sweep 2026-05-19
Pure first-exposure-physics user-facing text; no source-code, tooling, performance or CI references.
invariants Tests  10 passed + visual 5/5 x3. Shipped.

## Kepler fix 2026-05-19 (user: traced path != actual path; weird animation)
sim.js consistent and byte-identical; bugs were in playground.js:
- The Kepler E/L mapping put the pericentre at r ~ 0.05, where the
  1/r^2 radial force is so stiff that fixed-step velocity-Verlet
  blew the energy up and the live (r,p_r) point spiralled off the
  analytic loop. Remapped: L in [0.70,0.90] (r_circ = L^2 ~ 0.6),
  E in [-0.74,-0.25], so the pericentre stays >~ 0.35; and the
  integrator now substeps adaptively (more substeps the smaller r),
  so action is conserved (dJ/J ~ 1e-5) and the dot rides the loop.
- The right "action-angle" panel drew a toCircle-mapped blob for
  non-harmonic potentials (toCircle is the harmonic-only canonical
  transform), which is the "weird animation". Action-angle variables
  turn ANY 1-DOF bound orbit into a circle of radius sqrt(2J) swept
  at constant rate, so it now always draws a clean circle with the
  angle winding uniformly (correct for Kepler and the pendulum too).
Render/physics only; sim.js + 10 invariants byte-identical; goldens
recaptured. Gate 10 + smoke + 5/5 x3.
