---
title: Gravitational Redshift in Schwarzschild
slug: gravitational-redshift
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: AST3017
supporting_ucs: []
curriculum_year: bsc-y3s2
hook: 'Climbing out of a gravity well costs a photon energy; light leaving near a black hole arrives redder, and at the horizon it never arrives at all.'
one_paragraph: 'A photon emitted at radius r outside a Schwarzschild mass M climbs out of the gravitational potential and reaches a distant observer at lower frequency: f_obs = f_em sqrt(1 - 2M/r) in geometric units. The shift grows as the emission point approaches the horizon r = 2M, where it diverges and the photon is infinitely redshifted, the spectral signature of the horizon itself. The playground moves the emission radius and shows the redshift factor and the shifted line. The same effect, tiny but measured, makes orbiting GPS clocks run fast relative to the ground. Reference: Hartle, Gravity: An Introduction to Einstein''s General Relativity, Ch. 9.'
tags: [cosmology, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Gravitational redshift in Schwarzschild spacetime

## Physical setup

A photon emitted at radius r_em outside a Schwarzschild black hole of
mass M (geometric units G = c = 1) is observed at infinity with
frequency f_obs = f_em sqrt(1 - 2M / r_em). At the horizon r = 2M the
redshift factor vanishes, corresponding to infinite redshift.

## Governing equations

Static observer time-dilation factor sqrt(1 - 2M/r) is the redshift
factor for a photon arriving at infinity. The redshift z is defined as
z = lambda_obs / lambda_em - 1 = 1 / f - 1.

## Numerical method

None. Closed-form Schwarzschild metric factor.

## Controls

- r_em / 2M: emission radius in units of the horizon, 1.001 to 20.
- speed: auto-sweep over r.
- Reset / Pause / Play.

## Expected qualitative features

1. r near horizon: factor near 0; large z.
2. r >> 2M: factor approaches 1; small z.
3. Source wavelength 530 nm (green) shifts red as r decreases.
4. Pound-Rebka regime (Earth): z ~ 10^-15 (off-scale in this plot).

## Invariants and acceptance thresholds

1. Weak-field: factor approaches 1 within 1e-5 at r = 1e6 M.
2. At horizon: factor = 0.
3. Clock rate = sqrt(1 - 2M / r) exact.
4. Reciprocity: factor(r_em, r_obs) = clockRate(r_em) / clockRate(r_obs).
5. Weak-field expansion 1 - factor ~ M(1/r_em - 1/r_obs).
6. z = 1/f - 1.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- Horizon limit: infinite redshift.
- Far-field: no redshift.

## Visual fallback

Canvas2D only. Top: factor curve vs r/2M with current-r cursor and
horizon line. Bottom: source-to-observed wavelength swatches with
connecting arrow.

## Citations

- Hartle, Gravity: An Introduction to Einstein's General Relativity Ch. 9
  (`schutz-firstcourse`).
- Carroll, Spacetime and Geometry Ch. 5.
- Pound and Rebka 1959.

## Stretch goals

- Observer at finite r (not infinity).
- Kerr metric variant.
- Cosmological redshift comparison.

## Risk register

- Below the horizon (r < 2M) the metric is no longer static; the formula
  is invalid. Slider lower bound is 1.001 to keep r outside the horizon.
