---
title: Stellar Pulsation Modes in 3D
slug: stellar-pulsation-3d
status: verified
audience: portfolio
created: 2026-05-20
primary_uc: MAA-AS
supporting_ucs: [AST3015]
curriculum_year: hero
primary_citation: aerts-asteroseism
primary_chapter: 3
hero_candidate: true
hook: 'A real spherical harmonic Y_l^m painted on a 3D star: pick (l, m) and watch the surface breathe in the iconic asteroseismic mode pattern.'
one_paragraph: 'A non-radial stellar oscillation has surface displacement proportional to a real spherical harmonic Y_l^m(theta, phi) multiplied by cos(omega t). The playground renders the star as a 3D sphere whose surface is displaced radially by the chosen mode and colored by signed displacement, with the time phase animated. Pick (l, m) from (1,0) tilt, (2,0) bowl, (2,2) "soccer" panel, (3,1), (4,2), and up to (l=6) modes. This is the angular pattern asteroseismic inversions actually decode from Kepler and TESS light curves. Reference: Aerts, Christensen-Dalsgaard, Kurtz, Asteroseismology, Ch. 3.'
caption: 'Figure 1. Surface of a 3D star displaced by the chosen spherical harmonic Y_l^m, time-evolved as cos(omega t). Method: real spherical harmonic via Legendre recurrence, Canvas2D 3D wireframe + interpolated color map. Source: Aerts et al., Asteroseismology, Ch. 3.'
tags: [stellar, animation, three-d, live-readout]
difficulty: 3
tier: single
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [l, m, omega]
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

# Stellar pulsation 3D
Surface Y_l^m oscillation pattern. Source: Aerts et al. Ch. 3.

## Explainer

### What you are looking at

A 3D star whose surface is oscillating in the angular pattern of a
real spherical harmonic $Y_l^m(\theta, \phi)$, animated by a global
time factor $\cos(\omega t)$. Pick $(l, m)$ from the controls and the
displayed pattern updates: $(1, 0)$ is a dipole tilt (the whole star
sloshes back and forth along an axis), $(2, 0)$ is the famous bowl-
shaped quadrupole, $(2, 2)$ is the four-quadrant pattern that looks
like a tilted "soccer-panel," and high $(l, m)$ modes get bumpier.

The orange-blue coloring on the surface is signed radial displacement:
warm where the star is pushed out, cool where it is pulled in. As
time advances the whole pattern inverts every half-period, which is
why asteroseismic spectra are sinusoids in time.

### The math

A non-radial oscillation of a spherically symmetric star has
displacement of the form

$$\vec\xi(r, \theta, \phi, t) \;=\; \xi_r(r)\, Y_l^m(\theta, \phi)\,
  \hat r\, \cos(\omega t)\;+\;\text{tangential},$$

where $Y_l^m$ is a (real) spherical harmonic, $\xi_r(r)$ is the
radial eigenfunction, and $\omega$ is the eigenfrequency. Without
rotation the $(2l + 1)$ modes of fixed $l$ are degenerate; rotation
splits them into a multiplet (see the rotational-splitting playground
next door). The angular pattern, in any case, is fixed by $(l, m)$.

### Real spherical harmonics

For visualization we use the real-valued spherical harmonic

$$Y_l^m(\theta, \phi) \;=\; \begin{cases}
  P_l^m(\cos\theta)\,\cos(m\phi),  & m \ge 0 \\
  P_l^{|m|}(\cos\theta)\,\sin(|m|\phi), & m < 0
\end{cases}$$

with $P_l^m$ the associated Legendre polynomial computed by the
standard three-term recurrence in the source.

### Symbols

- $l$: spherical-harmonic degree (number of "nodal circles" on the
  sphere).
- $m$: azimuthal order, $-l \le m \le l$.
- $\theta, \phi$: colatitude and longitude.
- $\xi_r$: radial displacement eigenfunction.
- $\omega$: mode angular frequency.

### Things to try

- Set $(l, m) = (1, 0)$: the whole star tips back and forth.
- Set $(l, m) = (2, 0)$: a quadrupole "American football" oscillation
  with prolate to oblate alternation.
- Increase $l$ to $4$ or $5$: many nodal lines, surface looks bumpy.
- Change $m$ at fixed $l$: the pattern's symmetry axis tilts and the
  number of azimuthal nodes shifts.

### Where this comes from

The non-radial pulsation formalism follows Aerts, Christensen-
Dalsgaard and Kurtz, *Asteroseismology*, CUP 2010, Chapter 3, and the
classical reference Cox, *Theory of Stellar Pulsation*, Princeton 1980.
