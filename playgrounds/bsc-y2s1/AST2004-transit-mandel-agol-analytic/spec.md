---
title: Mandel-Agol Analytic Transit
slug: transit-mandel-agol-analytic
status: superseded
superseded_by: exoplanet-transit-3d
audience: portfolio
created: 2026-05-14
primary_uc: AST2004
supporting_ucs: [AST3015]
curriculum_year: bsc-y2s1
primary_citation: mandelagol2002
primary_chapter: -1
hook: 'When a planet crosses its star the brightness dips in an exact, calculable shape; limb darkening rounds the shoulders, and that shape is how we weigh planets.'
one_paragraph: 'A transiting planet blocks a small, time-varying slice of its star''s disk, producing a characteristic dip in the light curve. Mandel and Agol (2002) derived the exact analytic form, both for a uniform disk and, through a ring decomposition, for a limb-darkened star. The playground draws the live light curve as you change the planet-to-star radius ratio, the impact parameter, and the limb-darkening coefficients: the depth tracks the radius ratio squared, the duration the geometry, and the curved ingress and egress the limb darkening. This closed form is exactly what every transit-fitting pipeline evaluates millions of times. Reference: Mandel and Agol 2002.'
tags: [stellar, exoplanets, animation, live-readout]
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
---
# Mandel-Agol transit
Analytic transit light curve; uniform-source closed form plus quadratic limb darkening via ring decomposition. Source: Mandel & Agol 2002.

## Explainer

### What you are looking at

When a planet crosses in front of its star it blocks a sliver of
light, producing a small periodic dip. The exact shape of that dip
encodes the planet's size, orbit, and the star's brightness profile.
The playground draws the transit geometry and the resulting light
curve, computed with the standard analytic Mandel and Agol model.

### The uniform-star transit

Model the star as a disk of radius $R_\star$ and the planet as an
opaque disk of radius $R_p$; let $p = R_p/R_\star$ and let $z(t)$ be
their projected centre separation in stellar radii. The blocked
fraction is just the overlap area of two circles, so the relative
flux is

$$\frac{F(t)}{F_0} = 1 - \frac{A_\mathrm{overlap}(z,p)}{\pi}.$$

The depth at mid-transit is $\approx p^2 = (R_p/R_\star)^2$, so the
dip directly measures the planet-to-star size ratio. The ingress and
egress durations set the impact parameter and the orbital geometry.

### Limb darkening: why the floor is curved

A real star is brighter at the centre of its disk than at the limb
(the grey-atmosphere law). Mandel and Agol handle this by decomposing
the star into concentric rings of intensity $I(\mu)$ and integrating
the uniform-disk result over them, with the quadratic law

$$I(\mu)/I(1) = 1 - u_1(1-\mu) - u_2(1-\mu)^2,
  \qquad \mu = \sqrt{1 - r^2}.$$

The visible consequence: the transit floor is not flat but
"U-shaped", deepest at mid-transit when the planet covers the bright
centre and shallower near ingress/egress when it covers the dim limb.
Fitting that curvature is how limb-darkening coefficients and precise
radii are extracted from Kepler and TESS light curves. The playground
sweeps $p$, the impact parameter and the limb-darkening coefficients
and shows the geometry and the analytic curve together.

### Things to try

- Increase the planet radius and watch the transit depth grow as
  $p^2$.
- Raise the impact parameter toward 1 and watch the transit shorten
  and become more V-shaped (a grazing transit).
- Turn limb darkening on and watch the flat bottom curve into a
  rounded U.

### Where this comes from

The analytic transit model, the overlap-area formula, and the
limb-darkened ring decomposition follow Mandel and Agol, ApJ 580,
L171 (2002), and Winn, "Transits and Occultations" (2010).
