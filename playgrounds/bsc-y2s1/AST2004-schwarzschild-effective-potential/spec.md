---
title: Schwarzschild Effective Potential and the ISCO
slug: schwarzschild-effective-potential
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: AST2004
primary_citation: carroll-ostlie
supporting_ucs: [AST3017]
curriculum_year: bsc-y2s1
hook: 'Add general relativity''s extra 1/r^3 term to the orbital potential and a new feature appears: an innermost stable circular orbit, below which everything must fall in.'
one_paragraph: 'For a massive particle outside a Schwarzschild black hole the radial motion follows an effective potential V_eff(r) that adds a relativistic -1/r^3 term to the usual Newtonian centrifugal-plus-gravity well. Circular orbits sit at its extrema: a minimum is stable, a maximum unstable. Lower the angular momentum and the minimum and maximum slide together and merge at r = 6M, the innermost stable circular orbit. Inside the ISCO no stable circular orbit exists and matter spirals in, which is why accretion disks have a sharp inner edge and a fixed maximum efficiency. The playground plots V_eff with the energy level, turning points, and the ISCO marked as you vary L. Reference: Carroll and Ostlie, An Introduction to Modern Astrophysics, Ch. 17.'
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
references:
  - "Carroll, Ostlie, An Introduction to Modern Astrophysics, Second ed."
---

# Schwarzschild effective potential and the ISCO

## Explainer

### What you are looking at

Orbits around a black hole are not just Newtonian ellipses with a
twist: general relativity adds a term that, close in, overwhelms the
centrifugal barrier, so there is a smallest stable circular orbit
(the ISCO) and, inside it, an inescapable plunge. The playground plots
the effective potential and a ball rolling in it so you can see the
ISCO and the capture region appear.

### The effective potential

For a test particle outside a Schwarzschild black hole of mass $M$,
the radial motion reduces to a 1D problem with a conserved energy and
angular momentum $\tilde L$:

$$\Big(\frac{dr}{d\tau}\Big)^2 = \tilde E^2 - V_\mathrm{eff}(r),
  \qquad
  V_\mathrm{eff}(r) = \Big(1 - \frac{2GM}{r c^2}\Big)
  \Big(1 + \frac{\tilde L^2}{r^2 c^2}\Big).$$

Expanded, this is the Newtonian potential plus the centrifugal term
plus a new, purely relativistic $-2GM\tilde L^2/(c^2 r^3)$ term.

### The ISCO and capture

That $1/r^3$ term is attractive and steep, so close to the hole it
beats the $1/r^2$ centrifugal barrier:

- For large $\tilde L$ the potential still has a minimum (stable
  circular orbit) and a maximum (unstable). As $\tilde L$ decreases
  the two merge: at $\tilde L^2 = 12\,(GM/c)^2$ the inflection point
  is the innermost stable circular orbit,
$$r_\mathrm{ISCO} = \frac{6GM}{c^2} = 3\,r_s.$$
- Inside the ISCO no stable circular orbit exists; a particle with
  too little angular momentum slides over the centrifugal barrier and
  is captured (the plunge). There is also a photon sphere at
  $1.5\,r_s$.

This is why accretion disks have an inner edge at the ISCO (setting
black-hole spin measurements and radiative efficiency) and why "you
can orbit a black hole" is only true outside $6GM/c^2$. The
playground sweeps $\tilde L$ and energy and shows the potential
reshaping, the ISCO forming, and orbits that bind, precess, or
plunge.

### Things to try

- Lower the angular momentum and watch the potential minimum and
  maximum merge at the ISCO, then vanish (capture for any energy).
- Set a bound orbit just outside the ISCO and watch strong
  perihelion precession (the relativistic rosette).
- Raise the energy above the barrier maximum and watch the particle
  plunge through the horizon.

### Where this comes from

The Schwarzschild effective potential, the ISCO at $6GM/c^2$, and the
photon sphere follow Hartle, *Gravity: An Introduction to Einstein's
General Relativity*, Chapter 9, and Misner, Thorne and Wheeler,
*Gravitation*, Chapter 25.

## Physical setup

Effective radial potential for geodesics outside a Schwarzschild black
hole of mass M (geometric units G = c = 1):
- Massive: V_eff = 0.5 (1 - 2M/r)(1 + L^2 / r^2) - 0.5.
- Photon:  V_eff = 0.5 (L^2 / r^2)(1 - 2M/r).

For a massive particle, the radial equation is (dr/dtau)^2 = E^2 - 1 - 2
V_eff. Circular orbits live at extrema of V_eff. Stability requires a
local minimum.

## Governing equations

Above. Critical radii:
- Photon sphere r = 3M (unstable circular photon orbit).
- ISCO r = 6M for massive particles with L = 2 sqrt(3) M.

## Numerical method

None. Closed-form V_eff and analytic turning-point quadratic.

## Controls

- L / M: angular momentum, 2.5 to 6.
- mode: massive (0) or photon (1).
- speed: auto-sweep over L.
- Reset / Pause / Play.

## Expected qualitative features

1. L > 2 sqrt(3) M (massive): V_eff has unstable max (inner) and stable
   min (outer); two turning-point markers shown.
2. L = 2 sqrt(3) M: inflection at r = 6M (ISCO).
3. L < 2 sqrt(3) M: monotonically decreasing, no stable circular orbit.
4. Photon mode: peak at r = 3M; no minimum.

## Invariants and acceptance thresholds

1. Photon-sphere peak at r = 3M.
2. Photon peak value = L^2 / (54 M^2).
3. ISCO turning points coincide at r = 6M for L = 2 sqrt(3) M.
4. Far-field V_eff_massive ~ -M/r + L^2/(2 r^2).
5. V_eff(2M) = -1/2 at horizon.
6. Turning-point formula yields two distinct radii above ISCO.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- L = 0: pure radial fall.
- L -> infinity: V_eff approaches Newtonian centrifugal barrier.

## Visual fallback

Canvas2D only. Single panel: V_eff(r) curve, dashed vertical lines at
horizon, photon sphere, and ISCO. Yellow dots mark turning points
when applicable.

## Citations

- Carroll, Spacetime and Geometry Ch. 5.
- Hartle, Gravity Ch. 9.

## Stretch goals

- Animate radial test-particle motion in the potential.
- Kerr (rotating) extension.
- Effective potential bifurcation diagram.

## Risk register

- For L very close to L_ISCO, discriminant L^2 - 12 M^2 can go slightly
  negative numerically; turning-point function clamps to zero.
