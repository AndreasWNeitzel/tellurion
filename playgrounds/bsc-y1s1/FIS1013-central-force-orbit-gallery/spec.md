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

# Central-Force Orbit Gallery

## Explainer

### What you are looking at

A single particle is pulled toward a fixed centre by a force that
depends only on distance. Change the force law and the orbit changes
character: a clean closed ellipse for gravity, a closed ellipse
centred on the origin for a spring, and for almost everything else a
rosette that never quite closes, slowly turning. The second panel turns
the 2D orbit into a 1D energy picture that explains why.

### The force and the trick that makes it 1D

The potential is a power law, $V(r) = k\,r^p$, with $k$ signed so the
well always attracts ($p = 0$ is the logarithmic potential). The force
is its slope:

$$F(r) = -\frac{dV}{dr}.$$

Because the force points along the line to the centre, angular momentum
$L$ is conserved. That lets you fold the angular motion into an extra
term and treat the radius alone, as if it were a particle in 1D moving
in the effective potential

$$V_\text{eff}(r) = V(r) + \frac{L^2}{2\mu r^2}.$$

The added piece $L^2/2\mu r^2$ is the centrifugal barrier: it blows up
near the centre and keeps an orbiting particle from falling in.

### Reading the energy panel

Draw a horizontal line at the total energy $E$. The particle's radius
oscillates between the two points where

$$V_\text{eff}(r) = E,$$

the pericentre (closest) and apocentre (farthest). A circular orbit
sits exactly at the minimum of $V_\text{eff}$. A bound orbit rocks
between the two radii while the angle keeps advancing, and that is what
draws the rosette.

### Why only two force laws give closed orbits

Each radial in-and-out takes the particle through some apsidal angle
(the angle swept from one pericentre to the next). The orbit closes
into a fixed shape only if that angle is a rational fraction of a
turn. Bertrand's theorem says this happens for *every* bound orbit in
just two cases:

$$p = -1 \;\; (\text{inverse-square gravity}), \qquad
  p = 2 \;\; (\text{Hooke spring}).$$

For gravity the apsidal angle is exactly $\pi$ (a closed ellipse with
the centre at a focus); for the spring it is $\pi/2$ (a closed ellipse
centred on the origin). For any other $p$ the apsidal angle is not a
nice fraction, so the orbit precesses forever and fills a ring. That
single fact is why planetary orbits are (to first approximation)
closed ellipses and almost nothing else is.

### Things to try

- Set $p = -1$ and see the closed Kepler ellipse, pericentre and
  apocentre steady on the energy panel.
- Set $p = 2$ for the origin-centred Hooke ellipse.
- Pick any other exponent and watch the rosette precess: the apsidal
  angle is no longer $\pi$.

### Where this comes from

The effective-potential reduction, the turning-point reading, and
Bertrand's theorem (only $1/r^2$ and Hooke forces give closed bound
orbits) follow Goldstein, Poole and Safko, *Classical Mechanics*, 3rd
ed., Chapter 3 (central-force motion).

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

Source: Goldstein, *Classical Mechanics*, 3rd ed., Ch. 3; Landau and Lifshitz, *Mechanics*, Sec. 14-15.
