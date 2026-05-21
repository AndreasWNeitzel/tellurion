---
title: Brownian Motion and the Diffusion Law
slug: brownian-motion-diffusion
status: verified
audience: portfolio
created: 2026-05-17
hook: 'A point of 1600 particles blurs into a Gaussian cloud, the spread tracking sqrt(4Dt) exactly, while a single tracer jitters under the molecular hail.'
one_paragraph: 'An ensemble of independent two-dimensional random walkers spreads out from the origin under the incessant buffeting of solvent molecules. Because each displacement is a sum of many tiny independent kicks, the cloud is Gaussian and its mean-squared displacement grows linearly in time, <r^2> = 4 D t in 2D, the signature of diffusion; a highlighted tracer drags its jagged random-walk trail. The diffusion coefficient is the Einstein-Stokes value D = kB T / (6 pi eta r), so heating the fluid, thinning it, or shrinking the particle all visibly quicken the spread, the link Einstein used to infer molecular reality from Brownian motion. Side panels track the measured mean-squared displacement against the 4 D t line and the step histogram against the predicted Gaussian. Reference: Einstein 1905; Reif, Fundamentals of Statistical and Thermal Physics, Chapter 1.'
tags: [statistical-mechanics, stochastic, animation, multi-panel, live-readout]
difficulty: 3
tier: advanced
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 4
curriculum_year: 'L:F-2Y-1S'
primary_uc: FIS2001
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
---

# Brownian Motion and the Diffusion Law

## Explainer

### What you are looking at

A speck of pollen in water jitters endlessly, kicked by invisible
molecules. Release a cloud of such specks from one point and they
spread, not at constant speed, but with the cloud's width growing as
the square root of time. Einstein realized in 1905 that watching this
proves atoms exist and measures their size.

### The equations

Each particle takes independent random kicks. Per axis, in a time step
$dt$, the displacement is a Gaussian of variance $2D\,dt$ (overdamped
Langevin dynamics). Summing independent kicks, the mean-squared
displacement grows linearly in time:

$$\langle r^2\rangle = 4 D t \quad (\text{in 2D}),$$

and the cloud is a spreading Gaussian, $\mathcal N(0, 2Dt)$ per axis.
The width therefore grows as $\sqrt{t}$, not $t$: diffusion is slow,
which is why stirring beats waiting. The diffusion coefficient is set by
the Stokes-Einstein relation,

$$D = \frac{k_B T}{6\pi\eta r},$$

linking the visible spreading to temperature $T$, fluid viscosity
$\eta$, and particle radius $r$. Measuring $D$ from the cloud and
inverting this gave the first good value of Avogadro's number.

### Why it matters

This connects a microscopic cause (molecular collisions) to a
macroscopic law (the diffusion equation), and the bridge is the
fluctuation-dissipation idea: the same collisions that slow a particle
(drag) also kick it (noise). The playground integrates the exact
Gaussian increments, so there is no discretization error; the cloud you
see is the true $\mathcal N(0,2Dt)$.

### Things to try

- Watch the cloud radius grow as $\sqrt{t}$, fast at first, then
  slowing, never linear.
- Raise the temperature (or shrink the particle) and see $D$ rise via
  Stokes-Einstein; the cloud spreads faster.
- Follow the highlighted tracer: its path is jagged at every zoom, a
  random walk.

### Where this comes from

The random-walk picture, the $\langle r^2\rangle = 4Dt$ law, and the
Stokes-Einstein relation follow Reif, *Fundamentals of Statistical and
Thermal Physics*, Chapter 1 and Sections 15.5 to 15.6 (the Einstein
relation).

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
