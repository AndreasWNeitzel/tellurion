---
title: Coupled Springs and Normal Modes
slug: coupled-springs-normal-modes
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS1013
supporting_ucs: [FIS2016, FIS2021]
curriculum_year: bsc-y1s1
hook: "Two carts between three springs. Push them the same way and they march in step; push them apart and they bounce against each other faster. Every possible motion is just these two patterns added together."
one_paragraph: "Two equal masses sit on a frictionless track joined by three identical springs (wall, mass, mass, wall). This is the textbook small-oscillation problem, and everything follows from diagonalising the 2x2 stiffness matrix into two normal modes: the symmetric mode (both masses move together, the middle spring never deforms, the lower frequency) and the antisymmetric mode (they move oppositely, the middle spring is doubly loaded, higher by a factor sqrt(3) here). A general start is a superposition, so the displacements show beats: energy trades between the two masses at the difference frequency. The playground draws the spring chain, the x1(t) and x2(t) traces, and a phase portrait that collapses to a straight eigen-line for a pure mode and fills a quasi-periodic orbit for a mixed one. The readout reports the two mode frequencies and the conserved energy."
tags: [mechanics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Coupled springs and normal modes

## Physical setup

Two equal masses on a frictionless track, connected by three identical
springs to two fixed walls: wall - (k) - m - (k) - m - (k) - wall. This is
the textbook small-oscillation system; everything follows from diagonalizing
the 2 x 2 stiffness matrix.

## Governing equations

  m x1'' = -2 k x1 + k x2
  m x2'' = +k x1 - 2 k x2

Normal modes from diagonalizing the stiffness matrix:
- Symmetric: eigenvector (1, 1), frequency omega_+ = sqrt(k / m).
- Antisymmetric: eigenvector (1, -1), frequency omega_- = sqrt(3 k / m).

In units k = m = 1: omega_+ = 1, omega_- = sqrt(3) approx 1.732. The beat
frequency between modes is (omega_- - omega_+) / 2 approx 0.366.

## Numerical method

Velocity-Verlet integrator with dt = 0.01. The integrator is symplectic, so
total energy stays bounded by 1e-3 over 10^4 steps. The analytic eigenmode
decomposition is used for the side-by-side numerical-vs-analytic test.

## Controls

- + mode: launches a pure symmetric eigenmode.
- - mode: launches a pure antisymmetric eigenmode.
- generic: launches with x1(0) = 0.7, x2(0) = 0 (50/50 mix).
- speed: integrator steps per render frame, 1 to 8.

## Expected qualitative features

1. + mode: both masses oscillate together at omega_+.
2. - mode: masses oscillate exactly opposite at omega_-.
3. generic: energy sloshes between the two masses; x1(t) and x2(t) traces
   show a clear beat envelope.
4. Phase portrait (x1, x2): in eigenmodes it traces a line through the
   origin; in generic IC, traces a dense quasiperiodic Lissajous orbit
   because omega_- / omega_+ = sqrt(3) is irrational.

## Invariants and acceptance thresholds

1. Pure + mode: omega_+ exact within 1e-3; antisymmetric amplitude < 1e-3.
2. Pure - mode: omega_- exact within 1e-3; symmetric amplitude < 1e-3.
3. Velocity-Verlet energy drift |delta E / E_0| < 1e-3 over 10^4 steps.
4. Eigenfrequencies match analytic expressions to 1e-12.
5. Numerical state vs analytic decomposition: agreement within 1e-3 at t = 2.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- k_coupling = 0: omega_+ = omega_- (degeneracy); no beats.
- Generic IC: state expressible as A_+ e_+ + A_- e_-, oscillates at both
  frequencies independently.

## Visual fallback

Canvas2D only. Top panel shows the mechanical scene (springs as zigzags);
lower-left panel shows x1(t), x2(t) traces; lower-right shows the (x1, x2)
phase portrait.

## Citations

- Goldstein, Poole, Safko 2001, Classical Mechanics 3e, Ch. 6 (`goldstein2001`).
- Marion and Thornton, Classical Dynamics 5e, Ch. 12 (alternate cite).

## Stretch goals

- Three or more masses; show the chain dispersion relation.
- Coupling-strength slider that breaks the k = m assumption.
- Animate eigenmode arrows on the phase portrait.

## Risk register

- For dt = 0.01, velocity-Verlet drift is fine but the eigenmode test
  requires N period at exactly 2 pi / omega; if dt does not divide that
  cleanly, the test must allow a small tolerance.
