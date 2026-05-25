---
title: Advection Scheme Shootout
slug: advection-scheme-shootout
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2018
primary_citation: hecht-optics
supporting_ucs: [MAA-NM]
curriculum_year: bsc-y2s2
hook: 'Translate a square pulse with four numerical schemes and watch them fail differently: one smears it, one wiggles, one blows up past a Courant limit.'
one_paragraph: 'Linear advection just shifts a profile at speed c, so the exact answer is trivial, which makes it the perfect stress test for numerical schemes. The playground runs four (upwind, Lax-Friedrichs, Lax-Wendroff, and a higher-order or unstable choice) on the same square pulse against the analytic translation, with the Courant number C = c dt / dx adjustable. You watch numerical diffusion round the pulse, dispersion add trailing ripples, and outright instability blow up once C exceeds the stability limit. It shows why the scheme choice and the CFL condition are not optional. Reference: LeVeque, Finite Volume Methods for Hyperbolic Problems.'
tags: [numerics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
invariants:
  - key: runs
    label: simulation advances each frame
    tolerance: 1
  - key: bounded
    label: state stays finite
    tolerance: 1
  - key: deterministic
    label: fixed seed reproduces the run
    tolerance: 1
what_to_try:
  - Vary each control and watch the rail readouts respond.
  - Compare the diagnostic plot against the live scene.
references:
  - "Hecht, Optics, 5th ed."
---

# Advection scheme shootout

## Explainer

### What you are looking at

The simplest PDE in existence, "move this shape to the right at
constant speed", is brutally hard to solve numerically without
wrecking the shape. The playground races four classic schemes on the
same moving square pulse so you see each one's characteristic failure:
smearing, ringing, or instability.

### The equation and the exact answer

Linear advection on a periodic line,

$$\frac{\partial u}{\partial t} + c\,\frac{\partial u}{\partial x} = 0,$$

has the exact solution $u(x,t)=u_0(x-ct)$: the initial profile
translates rigidly, unchanged, forever. Any deviation a scheme shows
is pure numerical error, which is why this is the standard test bed.

### Four schemes, three failure modes

Discretizing space and time, the schemes differ in their truncation
error:

- First-order upwind: stable (for Courant number
  $\nu=c\,\Delta t/\Delta x\le1$) but its leading error term is
  diffusive, so the sharp pulse smears into a blob (numerical
  viscosity).
- Lax-Wendroff (second order): its leading error is dispersive, so
  it keeps the pulse sharp but trails spurious oscillations
  (over/undershoots) behind the discontinuity, the Gibbs-like
  ringing.
- Centered / FTCS: unconditionally unstable for advection; the
  solution blows up regardless of how small $\Delta t$ is.
- A flux-limited / higher-order scheme: stays sharp and largely
  monotone by blending high and low order near the jump (the modern
  compromise).

### The CFL condition and Godunov's lesson

Every stable explicit scheme requires the Courant-Friedrichs-Lewy
condition $\nu = c\,\Delta t/\Delta x \le 1$: information must not
cross more than one cell per step. And Godunov's theorem says no
linear scheme can be both second-order and oscillation-free at a
discontinuity, exactly the smearing-versus-ringing trade-off you see,
which is why nonlinear flux limiters exist. The playground overlays
the four numerical solutions on the exact translating pulse and lets
you push the Courant number past 1 to watch stability break.

### Things to try

- Watch upwind smear the square into a hump while Lax-Wendroff keeps
  it sharp but rings behind it.
- Push the time step until $\nu>1$ and watch the stable schemes blow
  up (the CFL limit).
- Compare against the dashed exact pulse: no linear scheme keeps it
  both sharp and clean (Godunov).

### Where this comes from

Linear advection, upwind/Lax-Wendroff, the CFL condition and
Godunov's theorem follow LeVeque, *Finite Volume Methods for
Hyperbolic Problems*, Chapters 4 and 6, and Press et al., *Numerical
Recipes*, Chapter 20.

## Physical setup

1D linear advection u_t + c u_x = 0 on a periodic domain [0, 1] with a square pulse initial condition. Four numerical schemes solve the same problem side-by-side; the dashed green line is the analytic solution (pure translation of the pulse).

## Governing equations

  u_t + c u_x = 0.

Schemes (Courant number C = c dt / dx):
- FTCS: u^{n+1}_i = u^n_i - (C/2)(u^n_{i+1} - u^n_{i-1}). Unconditionally unstable.
- Upwind (c > 0): u^{n+1}_i = u^n_i - C (u^n_i - u^n_{i-1}). First-order, TVD, dissipative.
- Lax-Wendroff: u^{n+1}_i = u^n_i - (C/2)(u^n_{i+1} - u^n_{i-1}) + (C^2/2)(u^n_{i+1} - 2 u^n_i + u^n_{i-1}). Second-order, oscillatory at shocks.
- MacCormack: predictor (forward) + corrector (backward) producing a different second-order method.

## Numerical method

NX = 200 cells, periodic BCs. dt set from the user-controlled CFL number C, so dt = C dx / c. Each scheme runs in its own 200-element state array.

## Controls

- c: advection speed, 0.1 - 2.0, default 1.0
- CFL: Courant number, 0.1 - 1.2, default 0.8
- speed: time steps per render frame, 1 - 10, default 3
- Reset: re-initialize all four schemes to the same square pulse
- Pause / Play

## Expected qualitative features

1. FTCS top-left: visibly blows up within ~ 50 steps even at small CFL.
2. Upwind top-right: pulse smears out, total variation never grows.
3. Lax-Wendroff bottom-left: pulse keeps shape but produces visible oscillations on each side of the original step.
4. MacCormack bottom-right: similar to LW, slightly different truncation error.

## Invariants and acceptance thresholds

- Upwind TVD: TV non-increasing over 100 steps.
- FTCS unstable: TV grows by > 5x over 200 steps.
- Lax-Wendroff bounded TV on smooth data: < 5 percent growth over 200 steps on Gaussian.
- Upwind mass conservation: mass invariant to 1e-10 over 200 steps.
- Exact solution wraps periodically.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- CFL > 1: all schemes diverge (CFL is the necessary stability condition).
- CFL = 1, Upwind: exact (numerical viscosity vanishes).
- Smooth (Gaussian) IC: LW recovers second-order, upwind first-order error decay.

## Visual fallback

Canvas2D only.

## Citations

- LeVeque 1992, Numerical Methods for Conservation Laws, Chapter 9.
- LeVeque 2002, Finite Volume Methods for Hyperbolic Problems, Chapter 4 - 6 (TVD discussion).
- MacCormack 1969, "The Effect of Viscosity in Hypervelocity Impact Cratering", AIAA Paper 69-354.

## Stretch goals

- Add a Beam-Warming scheme for a true 3-way comparison.
- Add MUSCL with minmod limiter to show a non-oscillatory second-order method.
- Add an L1/L2 error rate inset as dt varies.

## Risk register

- FTCS at CFL = 0.5 generates an explosion that can drown the y-axis; the panel clamps display values for readability but the underlying state can overflow Float64 at very long runs. Reset before the explosion is unreadable.
- All four schemes share the same dt; large c at high CFL pushes the upwind into its boundary.
