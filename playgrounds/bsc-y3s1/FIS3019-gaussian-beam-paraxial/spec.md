---
title: Paraxial Gaussian Beam (TEM_00)
slug: gaussian-beam-paraxial
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS3019
supporting_ucs: []
curriculum_year: bsc-y3s1
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
tags: [optics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Paraxial Gaussian beam (TEM_00)

## Physical setup

The fundamental TEM_00 mode of a laser cavity, modeled in the paraxial (slowly varying envelope) limit. The beam is narrowest at z = 0 with 1/e^2 intensity radius w_0; it expands hyperbolically along z as it propagates.

## Governing equations

  z_R = pi w_0^2 / lambda                              (Rayleigh range)
  w(z) = w_0 sqrt(1 + (z / z_R)^2)                    (spot radius)
  R(z) = z (1 + (z_R / z)^2)                          (radius of curvature)
  eta(z) = atan(z / z_R)                              (Gouy phase)
  I(r, z) = I_0 (w_0 / w(z))^2 exp(-2 r^2 / w(z)^2)   (intensity)

Far-field divergence half-angle theta = lambda / (pi w_0).

## Numerical method

Closed-form analytic profile. 320 x 200 grid covering [-z_max, +z_max] x [-r_max, +r_max] with r_max = 4 w_0. Gamma 0.5 for display so faint tails near the Gaussian wings remain visible.

## Controls

- w_0: beam waist, slider 0.05 - 0.50, default 0.20
- lambda: wavelength, slider 0.005 - 0.080, default 0.020
- z range: half-width of the displayed z axis, 1 - 10, default 4.0

## Expected qualitative features

1. At z = 0 the spot is narrowest; the heatmap shows a tight bright bar.
2. At z = +/- z_R the spot has grown to sqrt(2) w_0; the dashed red markers identify these positions.
3. Far from the waist (|z| >> z_R), the +/- w(z) curves are nearly linear with slope +/- theta.
4. Smaller w_0 at fixed lambda gives a larger far-field divergence (uncertainty trade-off).

## Invariants and acceptance thresholds

- z_R = pi w_0^2 / lambda (closed form to 12 sig figs).
- w(0) = w_0; w(z_R) = sqrt(2) w_0.
- Far field: w(z) -> z lambda / (pi w_0) within 1e-3 relative for z = 50 z_R.
- Power through aperture of radius w(z): 1 - e^{-2} ~ 0.865 (Siegman 17.51) at any z.
- Intensity field peak at z = 0, r = 0 (within grid resolution).

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- lambda -> 0: z_R -> infinity, w(z) -> w_0 (no diffraction).
- w_0 -> 0 at fixed lambda: theta diverges (impossible to focus to a point).
- z -> infinity: hyperbolic envelope flattens to straight lines.

## Visual fallback

Canvas2D only.

## Citations

- Siegman 1986, Lasers, Chapter 17 (`siegman1986`).
- Hecht 2017, Optics, 5e, Section 13.1 (`hecht2017`).
- Born and Wolf 1999, Principles of Optics, 7e, Section 13.4.

## Stretch goals

- Add a higher-order Hermite-Gauss (HG_mn) mode selector.
- Add a "thin lens" location that re-focuses the beam to a new waist.
- Overlay the wavefront contours (constant phase surfaces).

## Risk register

- At very small lambda (< 0.005) z_R becomes huge and the displayed field is uniformly bright; the slider lower bound prevents this.
- At w_0 < 0.05 the spot becomes a single pixel at the chosen grid resolution; clamp prevents.
