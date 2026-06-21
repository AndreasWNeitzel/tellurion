---
title: Keplerian Orbit Elements
slug: kepler-orbit-elements
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: AST2004
supporting_ucs: [AST3015]
curriculum_year: bsc-y2s1
primary_citation: carroll-ostlie
primary_chapter: 2
hook: 'Six numbers fix an orbit completely: its size, its shape, and three angles that tilt and spin its plane in space. Turn each dial and watch which part of the ellipse moves.'
one_paragraph: 'Any Keplerian orbit is pinned down by six classical elements. The semi-major axis a sets the size and the eccentricity e the shape of the ellipse; the inclination i, longitude of ascending node Omega, argument of periapsis omega, and true anomaly nu orient and place the body on it. The scene renders the orbit in pseudo-3D against an explicit celestial reference frame, the reference plane, the vernal-equinox direction, and the line of nodes, and draws each element as the angle arc that defines it: Omega in the reference plane from the equinox to the ascending node, i as the tilt between the planes at the node, omega in the orbital plane from the node to periapsis, and nu from periapsis to the body. The body moves on real Keplerian timing from Kepler''s equation. The diagnostic plots the orbital distance and speed versus true anomaly, anti-correlated, the body fastest at periapsis (Kepler''s second law). This is the element language every ephemeris and mission plan is written in. Reference: Carroll and Ostlie, An Introduction to Modern Astrophysics, Ch. 2.'
tags: [stellar, exoplanets, animation, live-readout, interactive]
difficulty: 3
tier: hero
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
invariants:
  - key: perihelion
    label: perihelion = a(1-e)
    tolerance: 1e-9
  - key: aphelion
    label: aphelion = a(1+e)
    tolerance: 1e-9
  - key: semi_latus
    label: r(90 deg) = a(1-e^2)
    tolerance: 1e-9
what_to_try:
  - Raise eccentricity e toward 0.9 and watch the ellipse flatten.
  - Set inclination i to 90 degrees to view the orbit plane edge-on.
  - Sweep the node Omega and argument of periapsis omega to swing and spin the orbit.
references:
  - "Carroll and Ostlie, An Introduction to Modern Astrophysics, 2nd ed., Ch. 2."
  - "Murray and Dermott, Solar System Dynamics, Ch. 2."
---
# Keplerian orbit elements
Vary the six classical elements (a, e, i, Ω, ω, ν) and watch a 3D orbit redraw. Source: Carroll-Ostlie Ch. 2.

## Explainer

### What you are looking at

Six numbers fully specify any orbit in space. The playground gives
you one slider per element so you can build any orbit from scratch
and see exactly what each one does: the shape, the size, and the
three angles that tilt and spin the ellipse in 3D.

### The two-body orbit

A body bound to a central mass moves on an ellipse with the mass at
one focus (Kepler's first law):

$$r(\nu) = \frac{a\,(1-e^2)}{1 + e\cos\nu},$$

with $a$ the semi-major axis (size, and via Kepler's third law the
period $P^2\propto a^3$) and $e$ the eccentricity (shape: $e=0$
circle, $0<e<1$ ellipse, $e\to1$ nearly radial). Those two fix the
orbit in its own plane.

### Orienting the ellipse: the three angles

To place that in-plane ellipse into 3D space takes three Euler-like
angles, defined relative to a reference plane and direction:

- inclination $i$: tilt of the orbit plane out of the reference
  plane.
- longitude of the ascending node $\Omega$: where the orbit crosses
  the reference plane going up (it swings the whole orbit about the
  pole).
- argument of periapsis $\omega$: orientation of the ellipse within
  its own plane (where the closest approach sits).

The sixth element, the true anomaly $\nu$, is just the body's current
position along the fixed orbit (a clock, not a shape). The clean
separation, two elements for the orbit, three for its orientation,
one for the phase, is the language every ephemeris, mission design,
and exoplanet catalogue uses. The playground redraws the 3D orbit
live as you move each slider so the role of each element is isolated.

### Things to try

- Sweep $e$ from 0 to near 1 and watch the circle stretch into a
  thin ellipse with the focus fixed.
- Change $i$ and $\Omega$ and watch the same ellipse tilt and swing
  in 3D without changing shape.
- Vary $\omega$ and see the ellipse rotate within its own plane
  (periapsis moving) while $\nu$ just moves the body around it.

### Where this comes from

The classical orbital elements and the two-body ellipse follow
Carroll and Ostlie, *An Introduction to Modern Astrophysics*,
Chapter 2, and Murray and Dermott, *Solar System Dynamics*,
Chapter 2.

## Controls

- eccentricity e (0 to 0.9): the shape of the ellipse.
- inclination i (0 to 90 deg): tilt of the orbital plane.
- ascending node Omega (0 to 360 deg) and argument of periapsis omega
  (0 to 360 deg): the in-plane and out-of-plane orientation angles.
- Reset, Pause. The semi-major axis a is fixed; the true anomaly nu is
  the animated time variable.

## Numerical method

Closed-form orbit (perifocal-to-reference rotation, elementsToPos). The
body's true anomaly is driven by Kepler's equation each frame (mean
anomaly M = n t, Newton solve for the eccentric anomaly E, then nu), so
it moves at the correct varying speed. Rendering is plain Canvas2D: an
orthographic camera draws the reference-plane grid, the depth-shaded
orbit, the line of nodes, periapsis and ascending-node markers, the star
at the focus, and the orbiting body; the diagnostic plots r(nu) and the
vis-viva speed v(nu).

## Invariants and acceptance thresholds

| invariant | threshold | location |
| Kepler's equation converges | residual < 1e-9 | invariants test |
| circular orbit r = a | < 1e-12 | invariants test |
| inclination 0 gives z = 0 | < 1e-12 | invariants test |
| perihelion r = a(1-e) | < 1e-12 | invariants test |
| vis-viva: timed speed matches sqrt(2/r - 1/a) | rel < 2e-2 | live readout |

All confirmed in `invariants.test.mjs` (5 tests passing).
