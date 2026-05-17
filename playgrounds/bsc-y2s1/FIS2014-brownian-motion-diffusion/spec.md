---
title: Brownian Motion and the Diffusion Law
slug: brownian-motion-diffusion
status: verified
audience: portfolio
created: 2026-05-17
hook: 'A point of 1600 particles blurs into a Gaussian cloud, the spread tracking sqrt(4Dt) exactly, while a single tracer jitters under the molecular hail.'
one_paragraph: 'An ensemble of 1600 independent two-dimensional walkers diffuses from the origin, each axis taking Gaussian steps, so the cloud spreads as a Gaussian whose mean-squared displacement is 4Dt and a highlighted tracer drags a random-walk trail under solvent buffeting. The diffusion coefficient is the Stokes-Einstein value D = kB T / (6 pi eta r): heating, thinning the solvent, or shrinking the tracer all visibly speed the spread. Side panels track the measured mean-squared displacement against the 4Dt line and the displacement histogram against the Gaussian. The headless sim.js is gate-tested for the 4Dt law, time linearity, isotropy, Gaussianity (KS), the Stokes-Einstein scaling, and seed determinism.'
tags: [statistical-mechanics, stochastic, animation, multi-panel, live-readout]
difficulty: 3
tier: advanced
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 4
curriculum_year: 'L:F-2Y-1S'
primary_uc: FIS2001
share_state_keys: []
---

# Brownian Motion and the Diffusion Law

## Physical setup

A dilute suspension of Brownian particles released from a common
origin in a two-dimensional fluid. Each particle performs an
independent random walk driven by molecular collisions; one tracer is
drawn large with its trail and the surrounding solvent agitation.

## Governing equations

Overdamped Langevin dynamics give, per Cartesian axis, independent
Gaussian increments of variance `2 D dt`. The mean-squared
displacement is `<r^2> = 4 D t` in 2D, and the displacement
distribution is `N(0, 2 D t)` (the Einstein result). The diffusion
coefficient follows Stokes-Einstein,
`D = kB T / (6 pi eta r)`,
with `kB = 1.380649e-23 J/K`.

## Numerical method

Exact Gaussian-increment integration of the free-diffusion SDE (no
spatial discretisation error): `x += sqrt(2 D dt) * xi`, `xi ~ N(0,1)`,
from a seeded Box-Muller stream. A slider change deterministically
rebuilds the ensemble and re-diffuses it to the current step count, so
the displayed cloud is always consistent with the current `D`.
Reference: Reif, *Fundamentals of Statistical and Thermal Physics*,
Ch. 1 (random walk) and Sec. 15.5-15.6 (Einstein relation) (`reif`).

## Controls

- temperature T (150 to 600 K): `D` proportional to `T`.
- viscosity eta (0.3 to 3.0 mPa s): `D` inversely proportional.
- tracer radius r (0.4 to 5.0 nm): `D` inversely proportional, and
  the drawn tracer scales.
- Reset, Pause.

## Expected qualitative features

- The cloud spreads as an isotropic Gaussian; the dashed circle is the
  rms radius `sqrt(4 D t)` and contains about 63 percent of walkers.
- The measured `<r^2>` overlies the `4 D t` line; the histogram
  overlies the Gaussian.
- Raising `T`, or lowering `eta` or `r`, widens the cloud at the same
  time (faster diffusion); the readout `D` updates accordingly.

## Invariants and acceptance thresholds

- `<r^2> = 4 D t` within 5% (ensemble of 12000).
- Linearity: `MSD(2t) / MSD(t) = 2` within 5%.
- Isotropy `<x^2>/<y^2> = 1` within 6%; mean within `4 sigma/sqrt(N)`.
- Displacement KS statistic vs the normal `< 0.05`.
- Stokes-Einstein scaling exact in `T`, `eta`, `r` within 1e-9.
- Deterministic in the seed; new seeds still obey `4 D t` within 6%.

## Limiting cases for verification

- `t = 0`: all walkers at the origin, `<r^2> = 0`.
- Doubling `T` doubles `D` and hence `<r^2>` at fixed `t`.

Source: Reif, *Fundamentals of Statistical and Thermal Physics*,
Ch. 1 and Sec. 15.5-15.6 (`reif`).
