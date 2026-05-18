---
title: Advection Scheme Shootout
slug: advection-scheme-shootout
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2018
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
---

# Advection scheme shootout

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

- LeVeque 1992, Numerical Methods for Conservation Laws, Chapter 9 (`leveque1992`).
- LeVeque 2002, Finite Volume Methods for Hyperbolic Problems, Chapter 4 - 6 (TVD discussion).
- MacCormack 1969, "The Effect of Viscosity in Hypervelocity Impact Cratering", AIAA Paper 69-354.

## Stretch goals

- Add a Beam-Warming scheme for a true 3-way comparison.
- Add MUSCL with minmod limiter to show a non-oscillatory second-order method.
- Add an L1/L2 error rate inset as dt varies.

## Risk register

- FTCS at CFL = 0.5 generates an explosion that can drown the y-axis; the panel clamps display values for readability but the underlying state can overflow Float64 at very long runs. Reset before the explosion is unreadable.
- All four schemes share the same dt; large c at high CFL pushes the upwind into its boundary.
