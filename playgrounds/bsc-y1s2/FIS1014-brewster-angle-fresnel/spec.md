---
title: Brewster Angle and Fresnel Equations
slug: brewster-angle-fresnel
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS1014
supporting_ucs: [FIS3019]
curriculum_year: bsc-y1s2
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
tags: [electromagnetism, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Brewster angle and the Fresnel reflectance

## Physical setup

Plane wave from medium 1 (index n_1) incident on the planar interface with
medium 2 (index n_2) at angle theta_i. Default: n_1 = 1.0 (air),
n_2 = 1.5 (glass). Refracted angle theta_t from Snell's law.

## Governing equations

  r_s = (n_1 cos theta_i - n_2 cos theta_t) / (n_1 cos theta_i + n_2 cos theta_t)
  r_p = (n_2 cos theta_i - n_1 cos theta_t) / (n_2 cos theta_i + n_1 cos theta_t)
  R_s = r_s^2,  R_p = r_p^2

Brewster's angle: theta_B = atan(n_2 / n_1), at which r_p = 0.
Critical angle (if n_1 > n_2): theta_c = arcsin(n_2 / n_1).

## Numerical method

None. Closed-form evaluation.

## Controls

- theta_i: incidence angle, 0 to 89 degrees.
- n_2 / n_1: index ratio, 0.6 to 2.5.
- speed: angle sweep rate.
- Reset / Pause / Play.

## Expected qualitative features

1. theta_i = 0: R_s = R_p = ((n_1 - n_2)/(n_1 + n_2))^2.
2. theta_i = theta_B: R_p = 0 exactly; R_s small but nonzero.
3. theta_i -> 90: R_s, R_p both -> 1 (grazing).
4. If n_1 > n_2 and theta_i > theta_c: total internal reflection.

## Invariants and acceptance thresholds

1. theta_B = atan(n_2 / n_1) exact.
2. R_p at theta_B < 1e-6.
3. R_s, R_p in [0, 1] over [0, pi/2].
4. Normal-incidence formula exact.
5. Grazing: R approaches 1.
6. TIR above critical angle.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- Normal incidence: standard reflectance.
- Grazing: full reflection.
- TIR for n_1 > n_2 above theta_c.

## Visual fallback

Canvas2D only. Left: ray sketch with incident (cyan), reflected (s and p
beam widths proportional to R_s and R_p), transmitted (yellow). Right:
R_s(theta) and R_p(theta) curves with Brewster marker and current-angle
cursor.

## Citations

- Hecht, Optics 5e Ch. 4.
- Born and Wolf Ch. 1.

## Stretch goals

- Complex refractive index (metals) with phase rotation.
- Animated polarization vectors.
- Pseudo-Brewster minimum for absorbing media.

## Risk register

- For n_1 > n_2 the slider can produce TIR; the ray diagram shows no
  transmitted ray and R_s = R_p = 1.
