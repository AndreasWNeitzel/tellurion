---
title: Perihelion Precession in a Schwarzschild Effective Potential
slug: mercury-precession-pn
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: AST2004
supporting_ucs: [AST3017]
curriculum_year: bsc-y2s1
hook: 'Add a small 1/r^3 nudge to Newtonian gravity and the ellipse stops closing: perihelion creeps around into a slow rosette, the effect that fixed Mercury''s missing 43 arcseconds.'
one_paragraph: 'Bertrand''s theorem says only the 1/r and r^2 central potentials give closed orbits; anything else makes the ellipse precess. General relativity adds, to leading post-Newtonian order, an effective 1/r^3 term to the orbit, and that breaks the exact 1/r form, so perihelion advances a little each lap. For Mercury the real advance is 43 arcseconds per century, far too slow to watch, so the playground keeps the exact functional form of the correction but lets you dial its strength up until the rosette turns in seconds. You are watching the same mechanism Einstein used to account for the one piece of Mercury''s orbit Newton could not. Reference: Carroll and Ostlie, An Introduction to Modern Astrophysics, Ch. 4 (general relativity).'
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

# Perihelion precession in a Schwarzschild-like potential

## Explainer

### What you are looking at

In Newtonian gravity a planet retraces the exact same ellipse forever.
General relativity adds a tiny extra pull that makes the ellipse
slowly rotate, so the point of closest approach (perihelion) creeps
around. This is the famous anomalous precession of Mercury, the first
triumph of general relativity. The playground exaggerates the effect
so you can watch the orbit rosette.

### Why a pure 1/r orbit closes

For an inverse-square force the bound orbit is a closed ellipse: the
radial oscillation period equals the orbital period exactly, so after
one lap the planet is back where it started. Bertrand's theorem says
only two central potentials ($\propto 1/r$ and $\propto r^2$) close
like this; any other shape makes the orbit fail to close and precess.

### The relativistic correction

The orbit-averaged Schwarzschild metric adds an effective
$1/r^3$ term to the potential, breaking the perfect $1/r$ form. The
radial period no longer matches the angular period, and the
perihelion advances by

$$\Delta\varpi
  = \frac{6\pi G M}{c^2\,a\,(1-e^2)}
  \quad\text{per orbit},$$

largest for orbits that are small ($a$), eccentric ($e\to1$), and
close to a massive body. For Mercury this is 43 arcseconds per
century, exactly the unexplained residual that Einstein's theory
accounted for in 1915. The playground lets you dial up the
correction strength and the eccentricity and watch the ellipse
precess into a rosette, the same mechanism as any non-Keplerian
central force.

### Things to try

- Turn the relativistic term off and confirm the orbit is a fixed,
  closed ellipse (pure Kepler).
- Turn it on and watch the perihelion advance each lap, tracing a
  rosette.
- Increase the eccentricity and watch the precession per orbit grow
  (the $1/(1-e^2)$ factor): why Mercury, not the Earth, showed it
  first.

### Where this comes from

The perihelion-precession formula and Bertrand's closed-orbit theorem
follow Carroll and Ostlie, *An Introduction to Modern Astrophysics*,
Chapter 4, and Hartle, *Gravity*, Chapter 9.

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
- Binney and Tremaine 2008, Galactic Dynamics, 2e, Section 3.6.
- Carroll 2004, Spacetime and Geometry, Section 5.5 for the 1PN derivation.

## Stretch goals

- Trace the rosette pattern (envelope of perihelion positions) over many orbits.
- Add an overlay of the pure-Newtonian ellipse for direct visual comparison.

## Risk register

- Large alpha (> 0.06) plus large e (> 0.7) can push the orbit close to r = 0 where the 1PN expansion breaks down. The integrator still runs but the physics is no longer accurate; the playground does not clamp this.
- At fixed dt = 0.005, e = 0.8 has tighter perihelion passages and the integrator should use a smaller dt for full accuracy. Energy still conserves to ~ 1e-3 in that regime, which is acceptable for visualization.
