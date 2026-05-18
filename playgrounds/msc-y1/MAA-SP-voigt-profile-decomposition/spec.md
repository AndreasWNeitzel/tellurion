---
title: Voigt Profile Decomposition
slug: voigt-profile-decomposition
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: MAA-SP
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: carroll-ostlie
primary_chapter: 9
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
tags: [stellar, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---
# Voigt profile decomposition
Gaussian core × Lorentzian wings. Source: Mihalas Stellar Atmospheres Ch. 9 (`mihalas-atm`).

## Explainer

### What you are looking at

A spectral line is never infinitely thin. Two different physical
effects broaden it: random thermal motions (a bell-shaped Gaussian)
and the finite lifetime of the atomic level plus collisions (a
heavy-tailed Lorentzian). The observed line is the convolution of
both, the Voigt profile. The playground shows the two components and
their blend, and how the mix changes with conditions.

### The two broadening mechanisms

- Doppler (thermal) broadening: atoms move with a Maxwellian
  velocity spread, so the line is a Gaussian of width set by
  temperature and mass,
$$\phi_G(\Delta\nu) \propto
  \exp\!\left[-\left(\frac{\Delta\nu}{\Delta\nu_D}\right)^2\right],
  \qquad
  \Delta\nu_D = \frac{\nu_0}{c}\sqrt{\frac{2k_BT}{m}}.$$
- Natural + pressure (collisional) broadening: the upper level has a
  finite lifetime, giving a Lorentzian with damping width $\gamma$,
$$\phi_L(\Delta\nu) \propto
  \frac{\gamma/4\pi^2}{\Delta\nu^2 + (\gamma/4\pi)^2}.$$

### The Voigt profile

The actual absorption profile is their convolution:

$$\phi_V(\Delta\nu)
  = \int_{-\infty}^{\infty}
  \phi_G(\Delta\nu')\,\phi_L(\Delta\nu-\Delta\nu')\,d\Delta\nu',$$

usually written with the Voigt function $H(a,u)$ where
$u=\Delta\nu/\Delta\nu_D$ and the damping parameter
$a=\gamma/(4\pi\Delta\nu_D)$ sets the Lorentzian-to-Gaussian ratio.
The result has a Gaussian-dominated core and Lorentzian-dominated
wings: the core decides the line depth and the wings, falling only as
$1/\Delta\nu^2$, carry most of the equivalent width for strong lines.
This is exactly why the curve of growth has three regimes
(linear, flat, square-root) and why pressure-broadened wings let you
measure stellar gravities. The playground sweeps temperature (the
Gaussian width) and the damping parameter $a$ (the wing strength) and
shows the decomposition.

### Things to try

- Set $a\to0$ and recover a pure Gaussian; raise $a$ and watch the
  Lorentzian wings emerge while the core stays Gaussian.
- Increase the temperature and watch the Doppler core widen.
- Note that the wings, not the core, dominate the area for a strong
  line (the damping part of the curve of growth).

### Where this comes from

The Doppler and Lorentzian profiles and their Voigt convolution
follow Mihalas, *Stellar Atmospheres*, Chapter 9, and Gray, *The
Observation and Analysis of Stellar Photospheres*.
