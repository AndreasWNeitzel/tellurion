---
title: Relativistic Beaming Pattern
slug: relativistic-beaming-azimuth
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: AST3016
primary_citation: dodelson-cosmology
supporting_ucs: [MAA-HE]
curriculum_year: bsc-y3s2
hook: 'A relativistic source emits isotropically in its rest frame; in the lab frame the light collimates into a 1/gamma headlight cone.'
one_paragraph: 'Pseudo-3D scene of relativistic beaming: the D^(3+alpha) emission pattern revolved into a shaded solid of revolution, with a photon stream sampled isotropically in the rest frame and aberrated to the lab frame so the forward collimation is shown directly. Sweeping gamma tightens the lobe from a broad teardrop to a pencil beam (theta_beam -> 1/gamma); alpha and the readout (D(0), D(pi), I(0)/I(pi)) stay locked to the closed-form Doppler physics.'
tags: [stellar, animation, live-readout]
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
  - "Dodelson, Modern Cosmology, 1st ed."
---

# Relativistic beaming pattern

## Explainer

### What you are looking at

A source that glows equally in all directions in its own frame looks
utterly different when it moves near light speed: nearly all its light
is swept into a narrow forward cone and hugely brightened. The
playground sweeps the source speed and shows the isotropic glow
collapse into a headlight beam, the effect behind blazars and AGN jets.

### Aberration: the headlight cone

Boosting to the lab frame, the emission angles transform (relativistic
aberration). Photons emitted sideways in the rest frame are thrown
forward, so isotropic emission becomes a cone of half-angle

$$\theta \sim \frac{1}{\gamma},$$

with $\gamma$ the Lorentz factor. At $\gamma = 10$ essentially all the
light is within $\sim 6^\circ$ of the motion.

### Doppler boosting

How bright it appears at lab angle $\theta$ is set by the Doppler
factor

$$D(\theta) = \frac{1}{\gamma\,(1-\beta\cos\theta)}
  = \frac{\sqrt{1-\beta^2}}{1-\beta\cos\theta}.$$

For an isotropic source the observed intensity scales as a strong power
of it:

$$I_\text{obs}(\theta) = D^{\,3+\alpha}\,I_\text{emit},$$

with $\alpha$ the spectral index. Because $D$ can be $\gg 1$ head-on
and the exponent is $3+\alpha$, a jet pointed near the line of sight is
brightened by enormous factors, while the same source pointed away is
dimmed to near invisibility. That single $D^{3+\alpha}$ explains why
blazars flare so violently and why we see one-sided AGN jets even when
the outflow is intrinsically two-sided. The playground shows the polar
brightness pattern sharpen and intensify as $\gamma$ rises.

### Things to try

- Raise $\gamma$ and watch the emission collapse into a forward cone
  of half-angle $\sim 1/\gamma$.
- Look head-on ($\theta\to0$) and watch the intensity boosted by
  $D^{3+\alpha}$; look from behind and watch it vanish.
- Note the asymmetry: a small viewing-angle change near $\theta=0$
  swings the brightness by orders of magnitude (blazar variability).

### Where this comes from

Relativistic aberration, the Doppler factor, and the $D^{3+\alpha}$
intensity boost for an isotropic source follow Rybicki and Lightman,
*Radiative Processes in Astrophysics*, Section 4.8.

## Physical setup

A monochromatic source that emits isotropically in its rest frame. When the source moves at relativistic speed, the lab-frame emission is concentrated into a forward cone of half-angle ~ 1/gamma. The textbook beaming effect; it explains blazar variability and the brightness of AGN jets pointed near our line of sight.

## Governing equations

Lorentz factor gamma, beta = sqrt(1 - 1/gamma^2). Doppler factor at lab-frame angle theta from the velocity vector:

  D(theta) = 1 / (gamma (1 - beta cos theta)) = sqrt(1 - beta^2) / (1 - beta cos theta).

Observed intensity for an isotropic source (Rybicki and Lightman 1979, Section 4.8):

  I_obs(theta) = D^{3 + alpha} I_emit,   with alpha the spectral index.

Beaming half-angle (definition: D(theta_beam) = D(0) / 2): theta_beam -> 1/gamma in the ultra-relativistic limit.

## Numerical method

Closed-form Doppler/aberration from sim.js. The emission pattern D^{3+alpha} is revolved about the boost axis into a shaded solid of revolution (per-facet Lambert shading, viridis by intensity, painter's-algorithm depth sort) and rendered as a pseudo-3D Canvas2D scene. A photon stream is sampled isotropically in the rest frame and aberrated to the lab frame via aberratedAngle(beta, theta'); each streak is colored and brightened by its Doppler factor so the collimation into the 1/gamma headlight cone is visible directly. log(1 + I) scaling keeps backward emission perceptible.

## Controls

- gamma: Lorentz factor, slider 1.05 - 20, default 5.0
- alpha: spectral index (alpha = 0 bolometric; alpha = 1 typical AGN jet), slider -1 to +2, default 0

## Expected qualitative features

1. gamma -> 1 (rest): the revolved lobe is a sphere and the photon stream is isotropic.
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

- Rybicki and Lightman 1979, Radiative Processes in Astrophysics, Section 4.8.
- Lind and Blandford 1985, Astrophys. J. 295, 358 (relativistic beaming of jet emission).

## Stretch goals

- Add a "fixed observer, scan source velocity vector" mode that animates a moving spotlight.
- Add a brightness-vs-time light curve for an isotropic blob moving on a ballistic trajectory.

## Risk register

- Log scaling on the polar plot makes very small back-lobe values barely visible; this is intentional. At gamma = 18, alpha = 2, back/front ratio is ~ 1e-12 and would be invisible on linear scale.
- Slider lower bound gamma = 1.05 avoids beta = 0 limit (where the polar plot is the same circle regardless of alpha).
