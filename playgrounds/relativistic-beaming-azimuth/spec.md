---
title: Relativistic Beaming Pattern
slug: relativistic-beaming-azimuth
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: AST3016
supporting_ucs: [MAA-HE]
curriculum_year: bsc-y3s2
---

# Relativistic beaming pattern

## Physical setup

A monochromatic source that emits isotropically in its rest frame. When the source moves at relativistic speed, the lab-frame emission is concentrated into a forward cone of half-angle ~ 1/gamma. The textbook beaming effect; it explains blazar variability and the brightness of AGN jets pointed near our line of sight.

## Governing equations

Lorentz factor gamma, beta = sqrt(1 - 1/gamma^2). Doppler factor at lab-frame angle theta from the velocity vector:

  D(theta) = 1 / (gamma (1 - beta cos theta)) = sqrt(1 - beta^2) / (1 - beta cos theta).

Observed intensity for an isotropic source (Rybicki and Lightman 1979, Section 4.8):

  I_obs(theta) = D^{3 + alpha} I_emit,   with alpha the spectral index.

Beaming half-angle (definition: D(theta_beam) = D(0) / 2): theta_beam -> 1/gamma in the ultra-relativistic limit.

## Numerical method

Closed-form: sample 720 angles around the full circle; compute D(theta) and D^{3+alpha}. Polar-plot the result in log(1 + I) scale so backward emission is still visible.

## Controls

- gamma: Lorentz factor, slider 1.05 - 20, default 5.0
- alpha: spectral index (alpha = 0 bolometric; alpha = 1 typical AGN jet), slider -1 to +2, default 0

## Expected qualitative features

1. gamma -> 1 (rest): polar plot is a circle (isotropic).
2. Moderate gamma (~ 2): pattern elongates along the velocity vector.
3. gamma >= 10: tight forward beam ~ 1/gamma; back lobe down by a factor (1+beta)^3/(1-beta)^3 ~ (2 gamma)^6 from the front.
4. Increasing alpha sharpens the beam further (intensity scales as D^{3 + alpha}).

## Invariants and acceptance thresholds

- D(0) = 1 / (gamma (1 - beta)) (closed form to 8 sig figs).
- D(pi) = 1 / (gamma (1 + beta)).
- D = 1 at beta = 0.
- Beam half-angle * gamma in [0.5, 2.0] for gamma >= 20.
- I(0) / I(pi) = ((1 + beta)/(1 - beta))^3 to machine precision at gamma = 10.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- beta -> 0: isotropic.
- beta -> 1: head-on emission goes to D = sqrt(2 gamma); back-on D = 1/(2 gamma).
- alpha = 0: bolometric beaming D^3 (the canonical "Doppler boost factor").

## Visual fallback

Canvas2D only.

## Citations

- Rybicki and Lightman 1979, Radiative Processes in Astrophysics, Section 4.8 (`rybickilightman1979`).
- Lind and Blandford 1985, Astrophys. J. 295, 358 (relativistic beaming of jet emission).

## Stretch goals

- Add a "fixed observer, scan source velocity vector" mode that animates a moving spotlight.
- Add a brightness-vs-time light curve for an isotropic blob moving on a ballistic trajectory.

## Risk register

- Log scaling on the polar plot makes very small back-lobe values barely visible; this is intentional. At gamma = 18, alpha = 2, back/front ratio is ~ 1e-12 and would be invisible on linear scale.
- Slider lower bound gamma = 1.05 avoids beta = 0 limit (where the polar plot is the same circle regardless of alpha).
