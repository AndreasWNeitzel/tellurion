---
title: Incompressible Wake and the Projection Method
slug: navier-stokes-2d-gpu-fullscreen
status: verified
audience: portfolio
created: 2026-05-17
primary_uc: FIS3025
supporting_ucs: []
curriculum_year: bsc-y3s2
primary_citation: chorin1968
hook: 'Drop a body into a stream: Chorin''s pressure projection holds the flow incompressible (the live max|div u| stays tiny) while the wake thickens from a glassy creep to an unsteady, agitated trail as the Reynolds number climbs.'
one_paragraph: 'An interactive 2D incompressible Navier-Stokes solver, the Chorin projection method made visible: semi-Lagrangian advection (Stam), implicit diffusion, and an iterated pressure-Poisson projection on a MAC staggered grid, the gate-tested shared engine (shared/js/engine/chorin-2d-cpu.js). It renders the vorticity of flow past a bluff body in Canvas2D over that verified engine, with a Reynolds slider sweeping creeping Stokes flow, a steady recirculating wake, and a damped unsteady wake, an obstacle and tracer toggle, and a live readout of the post-projection discrete divergence, the incompressibility constraint enforced in real time. The headless engine is gate-tested offline (incompressibility after a converged projection, projection identity, Stokes top-bottom symmetry, boundedness to Re=1000, determinism). The von Karman vortex street and its Strouhal number are a documented weak, resolution-limited feature: at the interactive grid the semi-Lagrangian numerical viscosity holds the effective Reynolds below the shedding threshold, so a crisp periodic street is a finer-grid / stretch mode, not the default claim.'
tags: [fluids, incompressible, pressure-projection, live-readout, obstacle-drawing]
difficulty: 5
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 7
share_state_keys: [re_number, obstacle_preset, tracer_enabled, regime_name]
---

# Incompressible Wake and the Projection Method

## Physical setup

A 2D incompressible flow (180 x 120 grid, normalized channel) past a bluff obstacle. A uniform stream enters at the left, free-slip walls top and bottom, zero-gradient outflow on the right, no-slip on the obstacle. The Reynolds number `Re = U D / nu` (reference speed `U = 1`, obstacle size `D = 1`, so `nu = 1/Re`) is user-tunable. Honest about the discretization: the realized (effective) Reynolds number is lowered by the semi-Lagrangian numerical viscosity, `Re_eff ~ 1/(1/Re + C |u| dx)`, so the slider sweeps three regimes that the interactive grid actually resolves: creeping, near fore-aft-symmetric Stokes flow (`Re ~ 1`); a steady recirculating wake (`Re` tens); and a broader, agitated, unsteady wake (high nominal `Re`). The headline is not a vortex street but the projection method itself: the scene draws the vorticity `omega = dv/dx - du/dy` and a live readout of the maximum post-projection discrete divergence, which stays small because the pressure-Poisson solve enforces `div u = 0` every step.

## Governing equations

Incompressible Navier-Stokes:

```math
\frac{\partial \mathbf{u}}{\partial t} + (\mathbf{u}\cdot\nabla)\mathbf{u} = -\nabla p + \nu\,\nabla^2\mathbf{u} + \mathbf{f}, \qquad \nabla\cdot\mathbf{u} = 0
```

Nondimensionalization: lengths by the obstacle scale `D`, speeds by the inflow speed `U`, time by `D/U`, pressure by `rho U^2`. The single control parameter is the Reynolds number; in these units the kinematic viscosity is `nu = 1/Re` (it is not the case that `Re = 1/nu` dimensionally; `Re = U D / nu` and the choice `U = D = 1` makes the dimensionless `nu` equal to `1/Re`).

Vorticity (visualized, transported): `omega = dv/dx - du/dy`. Strouhal number of the shed wake: `St = f_shed D / U`, with `f_shed` the dominant frequency of the cross-stream velocity (or vorticity) in the near wake.

For a circular cylinder the empirical Strouhal-Reynolds relation (Williamson 1996; Roshko) in the laminar shedding range `47 < Re < 180` is

```math
\mathrm{St}(Re) = \frac{-3.3265}{Re} + 0.1816 + 1.6\times10^{-4}\,Re
```

so at `Re = 100`, `St ~= 0.164`, not the high-`Re` asymptote `~0.21`. The acceptance window below reflects this.

## Numerical method

Chorin projection (fractional step) on a MAC staggered grid (pressure
at cell centres, `u` on x-faces, `v` on y-faces, the Harlow-Welch
layout), the Stam "stable fluids" discretization. Per step:

1. **Advect** velocity semi-Lagrangianly: trace each face back along
   the interpolated velocity by `dt`, bilinearly interpolate.
   Unconditionally stable at any advective CFL; it adds an implicit
   numerical viscosity (the effective-Reynolds caveat below).
2. **Diffuse** implicitly: Jacobi sweeps for `(I - nu*dt*Lap) u* = u`.
   Implicit, so no explicit diffusion-CFL; `dt` is an accuracy choice.
3. **Project**: solve `Lap p = div u*` then `u = u* - grad p`. On the
   MAC grid the forward-face divergence, the compact 5-point
   Laplacian and the backward gradient are exactly consistent and
   reflection-symmetric (no collocated odd-even checkerboard), so the
   projection is a true Hodge decomposition. Red-black SOR; Neumann
   pressure on inflow / free-slip / obstacle faces, Dirichlet `p = 0`
   at the outflow column (non-singular, no compatibility hack).
4. **Boundary conditions** (explicit, not periodic): left Dirichlet
   inflow `u = (1, 0)`; right zero-gradient outflow; top and bottom
   free-slip (no penetration); obstacle no-slip.

One scheme, two iteration budgets. The numerics live in the
gate-tested shared engine `shared/js/engine/chorin-2d-cpu.js`. The
live playground runs it with a relaxed pressure tolerance (capped SOR
iterations) for interactivity and reports the honest post-projection
`max|div u|`; the offline `invariants.test.mjs` runs the SAME engine
with the projection iterated to convergence, where the strong
incompressibility invariant `max|div u| < 1e-3` is genuinely reached.
Correctness is proven by the converged offline path, not asserted
from the relaxed live one.

Effective-Reynolds caveat: semi-Lagrangian advection adds
`nu_num ~ C |u| dx`, so the realized Reynolds number is
`Re_eff ~ 1/(1/Re + C|u|dx)`. At the interactive 180 x 120 grid
`nu_num` is large enough that `Re_eff` stays below the von Karman
shedding threshold for any nominal `Re`. Stated plainly: the
playground does NOT show a crisp periodic vortex street at the
interactive resolution. It shows creeping flow, a steady
recirculating wake, and a broader unsteady, agitated wake. The von
Karman street and its Strouhal number are a documented weak,
resolution-limited feature (a finer-grid stretch mode), not the
default claim, which is the projection method and incompressibility.

Grid and time step: live grid 180 x 120; `dt = 0.06` (accuracy, not
stability). `nu = 1/Re`, slider `Re` in `[1, 1000]`. No RNG
(deterministic); tracer dye seeded at fixed inflow positions.

## Controls

- regime: select Stokes / steady / unsteady / broadband, default
  unsteady; sets `Re` to 2 / 80 / 700 / 950.
- Re: slider `[1, 1000]`, default 700; `nu = 1/Re`.
- obstacle: select cylinder / square / none; the body is slightly
  offset to seed the asymmetry a deterministic solver needs.
- tracer dye: checkbox, a passive streak dye from the inflow.
- reset, pause: buttons.
- Live monospace readouts: `max|div u|` (the post-projection
  incompressibility, the headline), peak `|omega|`, `Re`, regime.
- Share-state keys: `re_number`, `obstacle_preset`, `tracer_enabled`,
  `regime_name` (parseUrlState restore plus a Copy-URL button).

## Expected qualitative features

- Stokes (`Re ~ 2`): glassy, steady, near top-bottom symmetric
  creeping flow hugging the obstacle; no shed vortices.
- Steady wake (`Re ~ 80`): a fixed recirculating wake behind the
  body, no time dependence.
- Unsteady / broadband (`Re` high): a broader, agitated, slowly
  fluctuating wake; the shear layers wobble but do not form a clean
  periodic street at this grid. Caveat: this is 2D Navier-Stokes;
  2D turbulence has an inverse energy / enstrophy cascade (Kraichnan
  1967), unlike 3D Kolmogorov and unlike a real 3D cylinder wake.
- The `max|div u|` readout stays small every frame (relaxed-live
  tolerance), the visible statement that the projection enforces
  incompressibility; the offline engine drives it below `1e-3`.
- Rendering is the vorticity over the dark theme: zero goes to the
  background (not white), glowing red and blue where the wake is
  rotational.

## Invariants and acceptance thresholds

Checked offline by the shared MAC engine through `sim.js` in
`invariants.test.mjs` (no GPU):

- incompressibility after a converged projection (strong):
  `max|div u| < 1e-3` with the projection iterated to residual
  below `1e-4`.
- projection identity on a divergence-free field (strong): projecting
  the uniform stream changes it by less than `1e-6`.
- boundedness / no blow-up (strong): finite (no NaN or Inf),
  `||u||_inf` bounded, for `Re` up to 1000 over at least 2000 steps.
- Stokes top-bottom symmetry (strong): at `Re = 1`, centred body, the
  steady field is symmetric across the channel centreline to under
  `5%` RMS.
- determinism (medium): identical inputs reproduce the field to
  better than `1e-12` (no RNG).
- constant-scalar transport (medium): a constant scalar stays
  constant under semi-Lagrangian advection (under `1e-6`).
- Strouhal (weak, non-gating): a finer-grid stretch diagnostic only,
  not asserted at the interactive resolution; Williamson `St ~= 0.164`
  at `Re = 100` is the reference if pursued.

Visual gate: five Playwright frames (init, 25, 50, 75, terminal) of
the deterministic time sweep (unsteady preset, cylinder), SSIM at
least `0.92` vs committed golden frames. The render is deterministic
(no RNG; the engine and the capped SOR are bitwise-stable).

## Limiting cases for verification

- `Re -> 0`: steady, reversible, symmetric creeping flow; no shedding
  (Batchelor Ch. 4).
- no obstacle: uniform stream, `div u -> 0` after transient (BC check).
- converged projection: discrete `div u -> 0`, a true Hodge
  decomposition on the MAC grid (Chorin 1968).
- `Re -> infinity` (2D): inverse energy / enstrophy cascade, NOT 3D
  Kolmogorov (Kraichnan 1967).

## Visual fallback

Pure Canvas2D over the verified MAC engine: no WebGL, no GPU
extension, so the headless capture and the SSIM gate are robust. The
deterministic time sweep yields the five golden frames; the engine
invariants run GPU-free in node.

## Citations

In `docs/CITATIONS.bib`:

- Chorin, Math. Comput. 22 (1968) 745 (`chorin1968`), the projection method.
- Harlow and Welch, Phys. Fluids 8 (1965) 2182 (`harlow-welch1965`), the MAC staggered grid.
- Stam, Proc. SIGGRAPH 99 (1999) 121 (`stam1999`), stable semi-Lagrangian advection.
- Batchelor, An Introduction to Fluid Dynamics, CUP, 1967 (`batchelor1967`), Stokes flow.
- Williamson, Annu. Rev. Fluid Mech. 28 (1996) 477 (`williamson1996`), the St-Re relation (the weak Strouhal reference).
- Kraichnan, Phys. Fluids 10 (1967) 1417 (`kraichnan1967`), the 2D-cascade caveat.

## Stretch goals

- A high-fidelity mode (finer grid, more pressure iterations, longer
  integration) that actually sheds a crisp von Karman street and
  measures the Strouhal number, trading away real-time interactivity.
- A WebGL2 512x384 ping-pong float-texture fast path (would require a
  documented hard-rule-8 relaxation in this spec).
- Drag-to-force mode; live kinetic-energy spectrum; pressure overlay.

## Risk register

- Semi-Lagrangian over-damping: the interactive grid cannot shed a
  clean street; mitigated by reframing honestly (this spec, the
  title, the readouts) and keeping Strouhal a documented weak,
  non-gating, finer-grid feature, never claimed at the live grid.
- Relaxed live vs converged offline divergence: the live readout is
  honestly the relaxed tolerance; the strong invariant is proven
  offline by the converged engine, not by the live render.
- Engagement: a non-shedding wake is less dramatic than a street;
  mitigated by the dark vivid vorticity render, the Re sweep across
  visibly distinct regimes, and the live incompressibility readout as
  the genuine pedagogical headline (Chorin's method made visible).

## Implementation notes

The headless engine `shared/js/engine/chorin-2d-cpu.js` (committed,
tested in `tests/engines/chorin-2d-cpu.test.mjs`, hard rule 6)
exports `createState`, `setBlockObstacle`, `step`, `project`,
`divergenceMax`, `vorticity`, `cellVelocity`, `advectScalar`,
`strouhal`. The playground `sim.js` re-exports it so
`invariants.test.mjs` validates the exact numerics the renderer
uses. `playground.js` is pure Canvas2D: it steps the engine with a
relaxed projection budget, paints the vorticity through the shared
rdbu LUT composited over the dark background, and honours the
`?deterministic=1&capture=NAME&captureFraction=F` capture contract.
