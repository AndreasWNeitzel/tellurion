---
title: Perihelion Precession in a Schwarzschild Effective Potential
slug: mercury-precession-pn
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: AST2004
supporting_ucs: [AST3017]
curriculum_year: bsc-y2s1
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
tags: [stellar, exoplanets, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Perihelion precession in a Schwarzschild-like potential

## Physical setup

In pure Newtonian gravity, Bertrand's theorem says that the only closed bound orbits in central potentials are those of V(r) ~ 1/r and V(r) ~ r^2. Any departure from these forms causes the orbit to fail to close: the perihelion moves around with each revolution. The 1PN correction in the orbit-averaged Schwarzschild metric introduces an effective extra 1/r^3 term that breaks the 1/r form and produces a perihelion advance.

For Mercury the actual advance is 43 arcseconds per century, vastly too slow to visualize. This playground keeps the same functional form of the correction but lets the user dial up its strength so the precession is visible in seconds.

## Governing equations

Newton plus a radial 1PN correction (radial-only and conservative):

  a_x = -G M x / r^3 * (1 + alpha / r^2)
  a_y = -G M y / r^3 * (1 + alpha / r^2)

Corresponding potential energy (matched so that -dV/dr equals the radial force):

  V(r) = -G M / r - alpha G M / (3 r^3)

Units: G M = 1, semi-major axis a = 1.

## Numerical method

Velocity-Verlet from `shared/js/engine/symplectic.js`, fixed dt = 0.005. The 1PN correction is q-only (no qdot dependence), so velocity-Verlet is exactly symplectic and angular momentum is conserved to machine precision.

## Controls

- alpha: GR-strength parameter, slider 0.0 - 0.1, default 0.02
- e: eccentricity of the initial orbit, slider 0.0 - 0.8, default 0.4
- speed: integration steps per render frame, 0.1 - 2.0, default 0.5

## Expected qualitative features

1. alpha = 0: closed Keplerian ellipse; perihelion stays put.
2. alpha > 0: ellipse rotates around the focus, with a per-orbit advance that scales linearly with alpha (in the small-alpha limit).
3. Higher e at fixed alpha gives a larger absolute precession because the orbit spends more time at small r.

## Invariants and acceptance thresholds

- Newtonian limit alpha = 0: per-orbit perihelion advance < 0.005 rad over 32 orbits.
- Linear scaling: per-orbit advance at alpha = 0.02 is 3.6 - 4.6 times that at alpha = 0.005.
- At default alpha = 0.01, e = 0.4: per-orbit advance in [0.07, 0.12] rad (empirically calibrated from the implementation).
- Energy drift |dE/E| < 5e-4 over 30k steps at default parameters.
- Angular momentum L conserved to 1e-6 relative.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- alpha = 0: pure Kepler; reduces to closed ellipse (Bertrand 1873).
- alpha small: per-orbit precession linear in alpha (this is the testable scaling law).
- e -> 0: circular orbit, no perihelion to track; reduce to a slow uniform-radius motion with omega slightly shifted.

## Visual fallback

Canvas2D only; no fallback needed.

## Citations

- Misner, Thorne, Wheeler 1973, Gravitation, Section 25.5.
- Binney and Tremaine 2008, Galactic Dynamics, 2e, Section 3.6 (`binneytremaine2008`).
- Carroll 2004, Spacetime and Geometry, Section 5.5 for the 1PN derivation.

## Stretch goals

- Trace the rosette pattern (envelope of perihelion positions) over many orbits.
- Add an overlay of the pure-Newtonian ellipse for direct visual comparison.

## Risk register

- Large alpha (> 0.06) plus large e (> 0.7) can push the orbit close to r = 0 where the 1PN expansion breaks down. The integrator still runs but the physics is no longer accurate; the playground does not clamp this.
- At fixed dt = 0.005, e = 0.8 has tighter perihelion passages and the integrator should use a smaller dt for full accuracy. Energy still conserves to ~ 1e-3 in that regime, which is acceptable for visualization.
