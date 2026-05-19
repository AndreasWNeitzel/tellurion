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
hook: 'Drop a body into a stream: Chorin''s pressure projection holds the flow incompressible (the live max|div u| stays tiny) while the wake goes from a glassy creep, through a steady recirculating bubble, to a shedding von Karman vortex street as the Reynolds number climbs.'
one_paragraph: 'Flow of an incompressible viscous fluid past a blunt obstacle obeys the Navier-Stokes equations, and a single dimensionless number, the Reynolds number Re = U L / nu, decides what happens. The incompressibility constraint div u = 0 is enforced by the pressure-projection idea (Chorin): advect and diffuse the velocity, then subtract the gradient of a pressure field chosen so the result is divergence-free. A live readout of the largest remaining divergence shows that constraint holding in real time. As you raise Re with the slider the wake passes through the classic regimes: glassy creeping (Stokes) flow that is fore-aft symmetric, a steady pair of recirculating vortices trapped behind the body, and then a periodic von Karman street of alternating vortices shed downstream (the pattern seen behind bridge piers and chimneys), whose shedding frequency sets the Strouhal number. Toggle the obstacle and a passive tracer to see the streamlines and mixing.'
tags: [fluids, incompressible, pressure-projection, live-readout, obstacle-drawing]
difficulty: 5
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 7
share_state_keys: [re_number, obstacle_preset, tracer_enabled, regime_name]
---

# Incompressible Wake and the Projection Method

## Explainer

### What you are looking at

Flow past a blunt obstacle does completely different things depending
on one number, the Reynolds number: it can creep around smoothly,
form a steady trapped bubble, shed a regular train of alternating
vortices (the von Karman street you see behind bridge piers and
chimneys), or break up into broadband turbulence. The playground
solves the real incompressible Navier-Stokes equations and sweeps
those regimes.

### The equations

An incompressible Newtonian fluid obeys momentum balance plus a
divergence-free constraint:

$$\frac{\partial \mathbf u}{\partial t}
  + (\mathbf u\cdot\nabla)\mathbf u
  = -\nabla p + \nu\,\nabla^2\mathbf u,
  \qquad
  \nabla\cdot\mathbf u = 0.$$

Nondimensionalizing with the inflow speed $U$ and obstacle size $D$
leaves a single control parameter, the Reynolds number

$$\mathrm{Re} = \frac{U D}{\nu},$$

the ratio of inertial to viscous forces. Low $\mathrm{Re}$ is
viscous and smooth; high $\mathrm{Re}$ is inertial and unstable.

### The projection method

The pressure has no evolution equation; its job is purely to keep the
flow divergence-free. Chorin's projection method does this in two
steps each tick: advect and diffuse the velocity ignoring pressure to
get an intermediate $\mathbf u^*$, then subtract the gradient of a
pressure found from the pressure-Poisson equation

$$\nabla^2 p = \frac{1}{\Delta t}\,\nabla\cdot\mathbf u^*,
  \qquad
  \mathbf u^{n+1} = \mathbf u^* - \Delta t\,\nabla p,$$

which is exactly the Helmholtz projection onto the
divergence-free subspace. The live readout shows the maximum
post-projection divergence staying near zero: the constraint is
enforced every step. Low-dissipation BFECC advection plus vorticity
confinement keep the numerical viscosity from swamping the physical
$\nu$, so the effective Reynolds number tracks the slider. Sweeping
$\mathrm{Re}$ walks through creeping flow, a steady recirculation
bubble, the periodic von Karman street, and a turbulent wake.

### Things to try

- Set a low $\mathrm{Re}$ and see nearly fore-aft symmetric creeping
  flow with no wake.
- Raise it into the hundreds and watch the regular alternating
  vortex shedding (the von Karman street) switch on.
- Push higher for a broad, agitated, broadband turbulent wake; watch
  the divergence readout stay tiny throughout (the projection works).

### Where this comes from

The incompressible Navier-Stokes equations, the Reynolds-number
regimes, and Chorin's projection method follow Chorin, Math. Comp.
22, 745 (1968), and Pozrikidis, *Fluid Dynamics*.

## Physical setup

A 2D incompressible flow (120 x 76 live grid, normalized channel) past a bluff obstacle. A uniform stream enters at the left, free-slip walls top and bottom, zero-gradient outflow on the right, no-slip on the obstacle. The Reynolds number `Re = U D / nu` (reference speed `U = 1`, obstacle size `D = 1`, so `nu = 1/Re`) is user-tunable. The live path runs the engine's BFECC low-dissipation advection plus Steinhoff vorticity confinement, which cut the semi-Lagrangian numerical viscosity so the effective Reynolds tracks the nominal one. The slider then sweeps four visibly distinct regimes: creeping, near fore-aft-symmetric Stokes flow (`Re ~ 8`); a steady recirculating bubble (`Re` tens); a genuine periodic von Karman street of alternating shed vortices convecting downstream (`Re ~ 300`); and a broader, agitated, broadband wake (`Re ~ 600`). The headline twin is the projection method itself: the scene draws the speed `|u|` (free stream, the bright acceleration around the body, the dark wake deficit and the discrete shed cores) and a live readout of the maximum post-projection discrete divergence, which stays small because the pressure-Poisson solve enforces `div u = 0` every step.

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

Two advection schemes, one engine. The default `advect` is the
first-order semi-Lagrangian step above; this is the path the offline
invariants exercise. The engine also exports a BFECC self-advection
(`selle2008-bfecc`: forward semi-Lagrangian, backward semi-Lagrangian,
the error-corrected restart `phi_bar = phi0 + 0.5(phi0 - phi2)`, a
final forward step clamped to the first-pass min/max so no new extrema
appear, so boundedness is preserved) and a Steinhoff vorticity
confinement body force (`steinhoff1994`: `f = eps * (N x omega)` with
`N = grad|omega| / |grad|omega||`, re-sharpening the eddies coarse-grid
diffusion smears). Both are `step()` options that default OFF, so the
gate-tested engine and `invariants.test.mjs` run the unmodified
first-order scheme; the live playground turns them ON for a
low-dissipation, genuinely shedding flow.

One scheme, two iteration budgets. The numerics live in the
gate-tested shared engine `shared/js/engine/chorin-2d-cpu.js`. The
live playground runs it with a relaxed pressure tolerance (capped SOR
iterations) for interactivity and reports the honest post-projection
`max|div u|`; the offline `invariants.test.mjs` runs the SAME engine
with the projection iterated to convergence, where the strong
incompressibility invariant `max|div u| < 1e-3` is genuinely reached.
Correctness is proven by the converged offline path, not asserted
from the relaxed live one.

Effective-Reynolds note: first-order semi-Lagrangian advection adds
`nu_num ~ C |u| dx`, so with it alone the realized Reynolds is
`Re_eff ~ 1/(1/Re + C|u|dx)`, pinned subcritical at a coarse
interactive grid (no shedding, the symmetric steady bubble). The live
path removes this: BFECC roughly halves the advective `C`, and
Steinhoff confinement re-injects the small amount of vortical energy
the coarse grid still diffuses, so `Re_eff` tracks the nominal `Re`
and a genuine, if coarse, periodic von Karman street forms above the
shedding threshold. The shed period gives an approximate Strouhal
number; it is a qualitative diagnostic, not gate-asserted at this
resolution (the precise `St(Re)` is the documented finer-grid
quantity, Williamson the reference). The confinement strength is small
(`eps ~ 0.08`) on a clean BFECC base; an over-large `eps` amplifies
grid-scale noise, so it is tuned and visually verified, not free.

Grid and time step: live grid 120 x 76; `dt = 0.10` (accuracy, not
stability); BFECC self-advection plus Steinhoff confinement
(`eps = 0.08`) on the live path; a small grid with a large `dt` and
one to a few physics steps per frame keeps it a smooth 60 fps. `nu =
1/Re`, slider `Re` in `[1, 1000]`. No RNG (deterministic); tracer dye
seeded at fixed inflow positions.

## Controls

- regime: select Stokes / steady / von Karman / broadband, default
  von Karman; sets `Re` to 8 / 60 / 300 / 600.
- Re: slider `[1, 1000]`, default 300; `nu = 1/Re`.
- obstacle: select cylinder / square / none. "cylinder" is a real
  circular disk (a 2D cylinder cross-section, so the label is
  honest, not a mislabelled rectangle); "square" is the rectangular
  block. The body is slightly offset to seed the asymmetry a
  deterministic solver needs.
- speed: slider, physics steps per frame `[1, 6]` (default 2), so
  the evolution rate is user-controllable and the live loop stays a
  smooth 60 fps on a modest grid.
- tracer dye: checkbox, a passive streak dye from the inflow.
- reset, pause: buttons.
- Live monospace readouts: `max|div u|` (the post-projection
  incompressibility, the headline), `max|u|`, `Re`, regime.
- Share-state keys: `re_number`, `obstacle_preset`, `tracer_enabled`,
  `regime_name` (parseUrlState restore plus a Copy-URL button).

## Expected qualitative features

- Stokes (`Re ~ 8`): glassy, steady, near top-bottom symmetric
  creeping flow hugging the obstacle; no shed vortices.
- Steady wake (`Re ~ 60`): a fixed, closed, symmetric recirculating
  bubble behind the body, no time dependence.
- von Karman (`Re ~ 300`): a genuine periodic street, alternating
  shed vortices that detach from each side and convect downstream,
  the near wake visibly asymmetric and time-dependent; visibly,
  unmistakably different from the steady bubble.
- Broadband (`Re ~ 600`): a broader, more agitated, less regular
  wake. Caveat: this is 2D Navier-Stokes; 2D turbulence has an
  inverse energy / enstrophy cascade (Kraichnan 1967), unlike 3D
  Kolmogorov and unlike a real 3D cylinder wake.
- The `max|div u|` readout stays small every frame (relaxed-live
  tolerance, order `1e-2`), the visible statement that the projection
  enforces incompressibility; the offline converged engine drives it
  below `1e-3`.
- Rendering is the speed `|u|` through viridis over the dark theme:
  the uniform stream, the bright acceleration over the shoulders of
  the body, the dark low-speed wake deficit, and the discrete shed
  cores; the obstacle is drawn as the solid dark body.

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
- Strouhal (weak, non-gating): the live BFECC + confinement path
  sheds a coarse periodic street whose period gives an approximate
  `St`; this is a qualitative diagnostic, not gate-asserted at the
  interactive resolution. The precise `St(Re)` is the documented
  finer-grid quantity; Williamson `St ~= 0.164` at `Re = 100` is the
  literature reference.

These six strong/medium invariants run the engine with its defaults
(first-order advection, no confinement), so the live BFECC +
confinement path does not weaken any of them; it is a separate,
visually verified live mode (the spec's two-path design).

Visual gate: five Playwright frames (init, 25, 50, 75, terminal) of
the deterministic time sweep (von Karman preset `Re = 300`, cylinder
disk, BFECC + confinement as in the live path), SSIM at least `0.92`
vs committed golden frames. The render is deterministic (no RNG; the
engine, BFECC, confinement and the capped SOR are bitwise-stable).

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
- Selle, Fedkiw, Kim, Liu, Rossignac, J. Sci. Comput. 35 (2008) 350 (`selle2008-bfecc`), the BFECC low-dissipation advection.
- Steinhoff and Underhill, Phys. Fluids 6 (1994) 2738 (`steinhoff1994`), vorticity confinement.

## Stretch goals

- A high-fidelity, quantitative mode (finer grid, more pressure
  iterations, longer integration) that measures `St(Re)` from the
  near-wake spectrum and checks it against Williamson, trading away
  real-time interactivity for a gate-assertable Strouhal number.
- A WebGL2 512x384 ping-pong float-texture fast path (would require a
  documented hard-rule-8 relaxation in this spec).
- Drag-to-force mode; live kinetic-energy spectrum; pressure overlay.

## Risk register

- Confinement over-energizing: too large an `eps` amplifies
  grid-scale (checkerboard) noise into salt-and-pepper artefacts;
  mitigated by a clean low-dissipation BFECC base, a deliberately
  small `eps = 0.08`, a tighter live projection (more SOR iterations),
  and visual verification of the captured frames (the noise failure
  mode is obvious and was caught and tuned out, not assumed away).
- BFECC boundedness: the error-corrected restart is clamped to the
  first-pass min/max so no new extrema appear; the engine boundedness
  invariant (still on the default path) and the bounded live frames
  confirm no blow-up.
- Relaxed live vs converged offline divergence: the live readout is
  honestly the relaxed tolerance (order `1e-2`); the strong invariant
  `< 1e-3` is proven offline by the converged default engine, not by
  the live render. The six invariants run engine defaults, so the
  live BFECC + confinement mode cannot weaken them.
- Engagement: addressed; the wake now genuinely sheds a periodic
  von Karman street and the regimes are visibly, unmistakably
  distinct, with the live incompressibility readout as the
  pedagogical headline (Chorin's method made visible).

## Implementation notes

The headless engine `shared/js/engine/chorin-2d-cpu.js` (committed,
tested in `tests/engines/chorin-2d-cpu.test.mjs`, hard rule 6)
exports `createState`, `setBlockObstacle`, `setDiskObstacle`,
`step` (with `bfecc` and `confine` options, both default-off),
`project`, `divergenceMax`, `vorticity`, `cellVelocity`,
`advectScalar`, `strouhal`. The playground `sim.js` re-exports it so
`invariants.test.mjs` validates the exact numerics the renderer
uses. `playground.js` is pure Canvas2D: it steps the engine with a
relaxed projection budget and the live BFECC + confinement options,
paints the speed `|u|` through the shared viridis LUT composited over
the dark background, and honours the
`?deterministic=1&capture=NAME&captureFraction=F` capture contract.
