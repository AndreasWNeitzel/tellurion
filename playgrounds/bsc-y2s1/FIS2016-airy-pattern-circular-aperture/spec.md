---
title: Airy Diffraction Pattern from a Circular Aperture
slug: airy-pattern-circular-aperture
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2016
supporting_ucs: [FIS3019, MAA-OT]
curriculum_year: bsc-y2s1
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
tags: [waves, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Airy diffraction pattern from a circular aperture

## Physical setup

The Fraunhofer far-field intensity from a uniformly illuminated circular aperture of radius a. This is the classical resolution-limiting pattern for any optical instrument with a round pupil: telescopes, microscopes, eyes.

## Governing equations

For monochromatic plane-wave illumination at wavelength lambda observed at angle theta from the optical axis,
  I(theta) / I_0 = [2 J_1(x) / x]^2,
  x = (2 pi a / lambda) sin(theta),
where J_1 is the first Bessel function of the first kind. The first dark ring sits at x_1 = 3.8317, giving the Rayleigh resolution
  theta_1 = 1.22 lambda / D, D = 2 a.

## Numerical method

Closed-form evaluation. J_1(x) computed by power series for |x| < 8 (truncation at term 20) and by the standard asymptotic form for larger |x| (Numerical Recipes 6.5; matches Abramowitz and Stegun 9.1 to 1e-10).

2D field: 256 x 256 grid in scaled coordinate x = (2 pi a / lambda) sin(theta) within [-xMax, +xMax]^2. Drawn with gamma correction (default gamma = 0.30) to bring out the outer rings.

## Controls

- lambda: wavelength in nanometers, slider 350-900 nm, default 550 nm
- D: aperture diameter in millimeters, slider 0.2-5 mm, default 1 mm
- sigma_RMS: atmospheric/aberration wavefront error in waves, slider 0-0.3 waves, default 0 (diffraction-limited). Strehl ratio S = exp(-(2pi sigma)^2); degraded PSF blends the Airy core with a broad seeing halo
- gamma: intensity gamma for the heatmap (lower gamma = more visible rings), 0.10-1.00, default 0.30
- UV aperture / IR aperture shortcut buttons with preset (wavelength, D) pairs

## Expected qualitative features

1. Bright central Airy disc surrounded by concentric dark rings.
2. First dark ring at x ~ 3.83 (Rayleigh resolution), moving inward (closer to center in angular space) as wavelength decreases or aperture diameter increases (higher resolution).
3. Secondary maxima at x ~ 5.14, 8.42, 11.62 with rapidly decreasing intensity.
4. 83.8 percent of total integrated power is inside the central disc in the diffraction-limited case (sigma_RMS = 0).
5. When sigma_RMS > 0, the central core brightens and shrinks while energy redistributes into a broad halo; Strehl ratio (live readout) decreases monotonically with sigma_RMS.

## Invariants and acceptance thresholds

- J_1(0) = 0 exactly.
- J_1 matches A&S table for x = 1, 2, 5, 10 (6+ sig figs).
- J_1 zeros at canonical values 3.8317, 7.0156, 10.1735, 13.3237, 16.4706.
- I(x_zero) ~ 0 at each Bessel zero (< 1e-9).
- I(0) = 1.
- First secondary maximum I(5.136) < 0.02.
- Central disc encloses 80 - 86 percent of integrated power (Born and Wolf gives 0.838).

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- Small x: I(x) -> 1 (peak).
- x at a J_1 zero: I -> 0.
- Asymptotic x: I(x) ~ (2/x)^3 / pi (envelope decay), oscillating.

## Visual fallback

Canvas2D only.

## Citations

- Hecht 2017, Optics, 5e, Section 10.2.5 (`hecht2017`).
- Born and Wolf 1999, Principles of Optics, 7e, Section 8.6.2.
- Numerical Recipes, 3e, Section 6.5 (for the J_1 series + asymptotic approximation).

## Stretch goals

- Add an obstruction parameter (central circular obstruction) to model a Cassegrain pupil; the result is the Airy pattern of an annulus.
- Add a slider for log-intensity (-3 to 0 decades) display mode.

## Risk register

- Heatmap memory: 256 x 256 grid is recomputed on every parameter change. Cost ~ 65536 J_1 evaluations per render. At 60 fps the budget is fine on a modern laptop.
- At x_max > 22 the corner pixels evaluate J_1 at x > 30 (asymptotic regime) where the approximation degrades to 4 sig figs; visually invisible.
