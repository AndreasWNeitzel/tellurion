---
title: Central-Force Orbit Gallery
slug: central-force-orbit-gallery
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Only two power-law forces in the universe make orbits that close on themselves. Everything else is a slowly turning flower.'
one_paragraph: 'A particle in a central potential V(r)=k r^p, integrated by symplectic velocity-Verlet. The orbit is the primary scene; a side panel shows the effective potential V_eff(r)=V(r)+L^2/2 mu r^2 with the energy line and radial turning points. Presets walk through the Bertrand closed orbits (Kepler ellipse, harmonic oscillator), a precessing rosette and an unbound escape.'
tags: [mechanics, animation, live-readout]
difficulty: 3
tier: medium
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
curriculum_year: 'L:F-1Y-1S'
primary_uc: F1006
share_state_keys: []
---

# Central-Force Orbit Gallery

## Physical setup

A unit-mass particle moves in a central potential `V(r) = k r^p`
(with `k` signed so the well is attractive for every `p`; `p = 0` is
the logarithmic potential). The orbit is drawn about a luminous force
centre with a fading trail; a secondary panel shows the effective
potential and the energy.

## Governing equations

$$F(r)=-\frac{dV}{dr},\qquad
V_{\text{eff}}(r)=V(r)+\frac{L^2}{2\mu r^2}.$$

Bound motion oscillates between the two roots of
`V_eff(r) = E` (pericentre and apocentre); the apsidal angle is
`pi` only for `p = -1` and `p = 2` (Bertrand's theorem), so every
other law precesses.

## Numerical method

Velocity-Verlet (symplectic) in Cartesian coordinates with
`dt = 0.0015`, so the energy and angular momentum stay flat over very
long integrations.

## Controls

- exponent `p`, angular momentum `L`, launch radius `r0` sliders.
- preset selector (Kepler ellipse, harmonic, rosette, escape,
  near-circular); Reset, Pause.

## Expected qualitative features

- Closed ellipse for inverse-square; closed centred ellipse for the
  harmonic law.
- A visibly precessing rosette for other exponents.
- An unbound hyperbolic escape when `E > 0`.
- The V_eff turning points coincide with the orbit's pericentre and
  apocentre.

## Invariants and acceptance thresholds

- Energy conserved within 1e-4 over 2e4 steps.
- Angular momentum conserved within 1e-7.
- Inverse-square: Laplace-Runge-Lenz direction fixed within 0.02 rad
  (closed orbit); other exponents drift more than 0.2 rad.
- Time-averaged virial `2<T> = p<V>` within 4%.
- Energy-based bound/unbound classification correct.

## Limiting cases for verification

- `p = -1, k < 0`: Kepler, closed ellipse, fixed perihelion.
- `p = 2, k > 0`: isotropic oscillator, closed ellipse about centre.
- `E > 0`: unbound, single turning point.

Source: Goldstein, *Classical Mechanics*, 3rd ed., Ch. 3
(`goldstein`); Landau and Lifshitz, *Mechanics*, Sec. 14-15
(`landau-mechanics`).
