---
title: 2D Navier-Stokes Vortex Street
slug: navier-stokes-2d-gpu-fullscreen
status: draft
audience: portfolio
created: 2026-05-17
primary_uc: FIS3025
supporting_ucs: []
curriculum_year: bsc-y3s2
primary_citation: chorin1968
hook: 'Drag a cylinder into a stream and watch the wake go from glassy creep to a metronome of alternating vortices, the von Karman street, its beat the Strouhal number.'
one_paragraph: 'An interactive 2D incompressible Navier-Stokes solver (Chorin projection, semi-Lagrangian advection after Stam, implicit Jacobi diffusion, iterative pressure-Poisson projection) rendered fullscreen on the GPU via WebGL2 ping-pong float textures at 512x384, with obstacle drawing, a vorticity colormap, passive tracers and a Reynolds slider that sweeps creeping Stokes flow, the periodic von Karman vortex street and the unsteady high-Re wake. A coarse-grid headless CPU mirror of the identical scheme runs offline in node so the conservation invariants (incompressibility after a converged projection, boundedness, Stokes fore-aft symmetry, determinism) are gate-tested without a GPU; the Strouhal number is a documented weak invariant validated on a finer grid because semi-Lagrangian numerical viscosity over-damps a coarse mesh.'
tags: [fluids, animation, gpu, live-readout, obstacle-drawing]
difficulty: 5
tier: hero
hero_candidate: true
renderer: webgl2
estimated_engagement_minutes: 8
share_state_keys: [re_number, obstacle_preset, tracer_enabled, regime_name]
---

# 2D Navier-Stokes Vortex Street

## Physical setup

A 2D incompressible flow through a rectangular channel (512 x 384 cells, aspect 4:3, normalized to [0,1] x [0,0.75]) past a bluff obstacle. A uniform stream enters at the left; the obstacle sheds vorticity into a wake. The Reynolds number `Re = U D / nu` (reference speed `U = 1`, obstacle size `D = 1` in the nondimensionalization, so `nu = 1/Re`) is user-tunable and selects the regime: creeping Stokes flow (`Re << 1`), the steady recirculating wake (`Re ~ 5 to 45`), the periodic von Karman vortex street (`Re ~ 47 to ~190` in 2D), and the unsteady broadband wake (`Re > ~200`). The scene draws the vorticity field `omega = dv/dx - du/dy` through a colormap, optional passive tracers, and a live readout of the maximum discrete divergence and the measured Strouhal number.

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

Chorin projection (fractional step), the Stam "stable fluids" discretization:

1. **Advect** velocity semi-Lagrangianly: trace each cell back along `u` by `dt` (RK2 backtrace), bilinearly interpolate. Unconditionally stable for advection at any CFL; introduces an implicit numerical viscosity (see caveat below).
2. **Diffuse** implicitly: solve `(I - nu*dt*Lap) u* = u` by Jacobi/Gauss-Seidel sweeps. Implicit, so there is no explicit diffusion CFL constraint `dt < dx^2/(4 nu)`; this is essential because at `Re = 100`, `dx = 1/512`, that explicit bound is `~1e-7` and unusable.
3. **Project**: solve `Lap p = (1/dt) div u*`, then `u = u* - dt grad p`. Collocated grid with the standard 5-point Laplacian; obstacle and boundary cells handled explicitly. The pressure solve is the convergence-critical step (see below).
4. **Boundary conditions** (stated explicitly, not periodic; periodic would recirculate the wake and is wrong here):
   - Left: Dirichlet inflow `u = (1, 0)`.
   - Right: convective / zero-gradient outflow (`du/dx = 0`).
   - Top and bottom: free-slip (`v = 0`, `du/dy = 0`).
   - Obstacle: no-slip `u = 0`; obstacle cells excluded from the pressure update; vorticity zeroed inside.

### Pressure solve: two paths

The real-time GPU path and the offline invariant path use the SAME scheme but DIFFERENT iteration budgets, because Jacobi on the 5-point Laplacian has spectral radius `rho = cos(pi/N) ~= 1 - (pi/N)^2`; on a 384-cell side `rho ~= 0.99993`, so ~50 sweeps barely move the residual and the strong `div u < 1e-3` target needs O(1/(1-rho)) ~ thousands of sweeps.

- **GPU (interactive, 512x384)**: red-black Gauss-Seidel / SOR (`rho ~ 0.95`, far faster than Jacobi) with an adaptive iteration count capped by a per-frame time budget; real-time divergence target relaxed to `max|div u| < 1e-2`. This keeps 60 fps; the wake is visually correct at this tolerance.
- **CPU mirror (offline, invariants.test.mjs, coarse grid)**: the projection is iterated to convergence (red-black Gauss-Seidel until the residual `< 1e-4` or a high fixed cap), which is cheap offline on a small grid. The strong incompressibility invariant `max|div u| < 1e-3` is therefore measured here, where it is genuinely reachable, NOT on the GPU.

### Effective-Reynolds caveat (semi-Lagrangian damping)

Semi-Lagrangian advection with bilinear interpolation adds a numerical viscosity `nu_num ~ C |u| dx` (`C ~ 0.5`), so the realized Reynolds number is `Re_eff ~ 1/(1/Re + C|u|dx)`. On the 512x384 GPU grid at nominal `Re = 100`, `Re_eff ~ 90` (mild). On a coarse 96x72 CPU mirror, `nu_num` swamps `nu` and `Re_eff` falls to O(15 to 20): a coarse grid cannot shed a clean von Karman street. Consequence: the Strouhal invariant is NOT tested on the coarse CPU mirror. It is a weak invariant validated on a moderately fine grid (a one-off `~256 x 192` CPU run in the test, marked weak / non-gating, plus the GPU readout); the coarse mirror only tests divergence, boundedness, Stokes symmetry and determinism.

### Grid and time step

- Grid 512 x 384, `dx = 1/512 ~= 1.95e-3`. CPU mirror 96 x 72 (invariants), and a 256 x 192 mirror for the weak Strouhal check.
- `dt = 0.0025`. Semi-Lagrangian advection has no advective CFL limit; with implicit diffusion there is no diffusion CFL limit. `dt` is chosen for temporal accuracy of the shedding, not stability.
- `nu = 1/Re`, slider `Re` in `[0.1, 1000]`. RNG: none in the flow (deterministic); tracers seeded at fixed positions.

## Stack relaxation (hard rule 8)

Rule 8 restricts playgrounds to Canvas2D/SVG. This playground is granted an explicit, user-authorized relaxation to WebGL2, justified here as required by the rule.

A 512x384 Chorin solver runs, per 60 fps frame: a semi-Lagrangian advection pass, several implicit-diffusion sweeps, and tens-to-hundreds of pressure-Poisson relaxation sweeps, each an O(N) = ~2e5-cell stencil pass. That is on the order of 1e8 to 1e9 flop/s with per-cell texture reads. Canvas2D `ImageData` with pixel-by-pixel JS loops and CPU<->GPU copies is 2-3 orders of magnitude too slow for interactivity. WebGL2 ping-pong fragment-shader float textures are the standard, necessary technique (Harris, GPU Gems 2, Ch. 38; Stam 1999, Sec. 3-4). The relaxation is scoped to the rendering/solve only; correctness is still gate-tested by a GPU-free CPU mirror.

## Controls

| name | type | range | default | sets |
|------|------|-------|---------|------|
| Re | slider | 0.1 .. 1000 (log) | 100 | Reynolds number, `nu = 1/Re` |
| regime | preset menu | Stokes / steady / von Karman / turbulent | von Karman | sets Re to 1 / 20 / 100 / 600 |
| obstacle_preset | menu | cylinder / square / airfoil / none | cylinder | obstacle mask |
| obstacle_draw | drag on canvas | n/a | enabled | paint/erase circular obstacle cells |
| tracer_toggle | checkbox | off / on | off | passive tracers (streak visualization) |
| vorticity_colormap | menu | rdbu / viridis / turbo | rdbu | omega colormap (rdbu is signed, the natural choice) |
| reset | button | n/a | n/a | clear obstacles, reset fields and time |
| pause | button | n/a | n/a | toggle stepping |

Live monospace readouts: time/step, `max|div u|`, measured `St` (shown only when a clean spectral peak exists), `Re_eff` estimate.

## Expected qualitative features

- **Stokes (`Re ~ 1`)**: glassy, steady, fore-aft near-symmetric flow that hugs the obstacle; no shed vortices; tracers in a recirculation bubble stay trapped.
- **Steady wake (`Re ~ 20`)**: a fixed symmetric pair of recirculating eddies behind the obstacle, no time dependence.
- **von Karman (`Re ~ 100`)**: a periodic alternating-sign vortex street; the `rdbu` field shows regular red/blue eddies marching downstream; the readout `St ~= 0.16` (Williamson), not `0.20`.
- **High Re (`Re > ~300`)**: irregular, broadband wake with many scales. Caveat: this is 2D Navier-Stokes; 2D turbulence has an inverse energy cascade and an enstrophy cascade (Kraichnan 1967), qualitatively unlike 3D Kolmogorov turbulence and unlike a real 3D cylinder wake. The playground states this; it does not claim 3D turbulence.
- The divergence readout stays at the path's tolerance (`< 1e-2` on the GPU); the offline mirror drives it `< 1e-3`.

## Invariants and acceptance thresholds

Checked offline by the coarse CPU mirror in `invariants.test.mjs` unless noted.

| invariant | strength | threshold |
|-----------|----------|-----------|
| incompressibility after a converged projection | strong | `max|div u| < 1e-3` on the CPU mirror with the pressure solve iterated to residual `< 1e-4` |
| boundedness / no blow-up | strong | velocity and vorticity remain finite (no NaN/Inf), `||u||_inf` bounded, for `Re` up to 1000 over >= 2000 steps |
| Stokes fore-aft symmetry | strong | at `Re = 1` with a symmetric obstacle, the steady field is symmetric across the obstacle centerline to `< 5%` RMS |
| projection idempotence | strong | applying the converged projection to an already divergence-free field changes it by `< 1e-6` |
| determinism | medium | identical inputs reproduce the field to `< 1e-9` (bitwise-stable scheme, no RNG) |
| advection mass/▼ conservation of a passive scalar | medium | total of an advected scalar conserved to `< 1%` over 500 steps (semi-Lagrangian is not exactly conservative; bound documents the drift) |
| Strouhal at `Re ~ 100` | weak (non-gating) | on a `256 x 192` mirror, `St` in `[0.14, 0.19]` (Williamson `~0.164`); reported, logged, not a hard gate, because grid-dependent |

Visual gate: five Playwright frames (init, 25, 50, 75, terminal) at the canonical `Re = 100` cylinder preset, SSIM `>= 0.92` vs committed golden frames.

## Limiting cases for verification

| limit | expected | source |
|-------|----------|--------|
| `Re -> 0` | steady, reversible, fore-aft symmetric creeping flow; no shedding | Batchelor Ch. 4 |
| `Re ~ 47` (2D cylinder) | onset of the primary instability / first shedding | Williamson 1996 |
| `Re = 100` cylinder | periodic shedding, `St ~= 0.164` | Williamson 1996 (St-Re relation) |
| no obstacle | uniform stream, `div u -> 0` after transient | BC verification |
| `Re -> infinity` (2D) | inverse energy cascade, enstrophy cascade; NOT 3D Kolmogorov | Kraichnan 1967 |

## Visual fallback

WebGL2 with `EXT_color_buffer_float` is required for the live solver. `index.html` detects it; on failure it shows a message and the committed static golden frames stand in for the visual gate. The CPU mirror needs no GPU and prints divergence / symmetry / Strouhal diagnostics to stdout.

## Citations

Append to `docs/CITATIONS.bib` if absent:

- Chorin, A. J., "Numerical solution of the Navier-Stokes equations", Math. Comput. 22 (1968) 745, doi:10.1090/S0025-5718-1968-0242392-2 (`chorin1968`).
- Stam, J., "Stable Fluids", Proc. SIGGRAPH 99 (1999) 121 (`stam1999`).
- Harris, M. J., "Fast Fluid Dynamics Simulation on the GPU", GPU Gems 2, Ch. 38, NVIDIA, 2005 (`harris-gpufluids`).
- Williamson, C. H. K., "Vortex Dynamics in the Cylinder Wake", Annu. Rev. Fluid Mech. 28 (1996) 477, doi:10.1146/annurev.fl.28.010196.002401 (the St-Re relation) (`williamson1996`).
- Kraichnan, R. H., "Inertial Ranges in Two-Dimensional Turbulence", Phys. Fluids 10 (1967) 1417 (2D cascade caveat) (`kraichnan1967`).
- Batchelor, G. K., An Introduction to Fluid Dynamics, CUP, 1967 (Stokes flow, vorticity) (`batchelor1967`).

## Stretch goals

- Drag-to-force mode (localized body force `f`).
- Live kinetic-energy spectrum `E(k)` to show the 2D inverse cascade.
- Pressure-field overlay; time-averaged mean flow for high-Re runs.

## Risk register

- **Pressure convergence vs fps**: Jacobi cannot reach `1e-3` in real time on 512x384; mitigated by red-black GS/SOR + relaxed real-time tolerance, with the strong invariant moved to the converged offline mirror.
- **Semi-Lagrangian over-damping**: coarse grids cannot shed; mitigated by making Strouhal a weak, finer-grid, non-gating invariant and reporting `Re_eff`.
- **GPU float-texture support**: gated by `EXT_color_buffer_float`; static golden-frame fallback.
- **CPU/GPU fidelity gap**: different grids and precision; the mirror validates the algorithm (divergence, symmetry, boundedness, determinism), not the GPU pixels.

## Implementation notes for sim.js / engine

A new headless engine `shared/js/engine/chorin-2d-cpu.js` (no GPU, pure JS, deterministic) exports:

```
createState(NX, NY, Re)          -> fields {u,v,p,obstacle}
step(state, dt)                  -> advance one Chorin step (advect, implicit diffuse, project)
project(state, {tol, maxIter})   -> iterate pressure to convergence; returns max|div u|
divergenceMax(state)             -> max|div u|
vorticity(state)                 -> omega grid
strouhal(series, dt)             -> dominant frequency / St from a wake-probe time series
```

`playground.js` holds the WebGL2 pipeline (advect/diffuse/jacobi/project/render shaders, ping-pong float FBOs). `invariants.test.mjs` imports only `chorin-2d-cpu.js`. The engine ships with its own `tests/engines/chorin-2d-cpu.test.mjs` per hard rule 6 (engine built and tested before the playground).
