---
title: Jones Calculus - Polarization Through Elements
slug: polarization-jones-calculus
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Send linear light through a quarter-wave plate at 45 degrees and watch the ellipse open into a perfect circle, a quarter turn on the Poincare sphere.'
one_paragraph: 'Jones calculus made visual. A fully polarized beam is a Jones vector (Ex, Ey) of complex amplitudes; each polarizer or wave plate is a 2x2 complex Jones matrix and a chain is the matrix product. The scene shows the polarization ellipse the field traces after the chain, beside the Poincare sphere where the input and output states are points. A quarter-wave plate at 45 degrees turns linear light circular; a half-wave plate reflects linear polarization about its axis; a polarizer projects and dims by Malus cos^2. The headless sim.js is gate-tested for Malus and polarizer idempotency, the QWP-to-circular conversion, the HWP reflection, wave-plate and rotator unitarity, rotator composition, the Stokes sphere relation S0^2 = S1^2 + S2^2 + S3^2, chain associativity and the full-wave identity.'
tags: [optics, polarization, jones, multi-panel, live-readout]
difficulty: 3
tier: advanced
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 5
curriculum_year: 'L:F-3Y-1S'
primary_uc: FIS3019
share_state_keys: []
---

# Jones Calculus - Polarization Through Elements

## Physical setup

A monochromatic Jones vector `(Ex, Ey)` passes through up to two
optical elements (polarizer, quarter-wave plate, half-wave plate)
each at a chosen axis angle.

## Governing equations

Element on axis `theta`: conjugate the on-axis matrix by the
rotation `R(theta)`. Polarizer `diag(1,0)`; retarder
`diag(1, e^{-i delta})` (QWP `delta = pi/2`, HWP `delta = pi`).
Output `E_out = M_2 M_1 E_in`. Stokes `S0 = |Ex|^2 + |Ey|^2`,
`S1 = |Ex|^2 - |Ey|^2`, `S2 = 2 Re(Ex* Ey)`, `S3 = -2 Im(Ex* Ey)`;
ellipse orientation `psi = atan2(S2,S1)/2`, ellipticity
`chi = asin(S3/S0)/2`.

## Numerical method

Closed-form 2x2 complex matrix algebra; the ellipse is the locus
`Re[(Ex,Ey) e^{i omega t}]`. Deterministic, no RNG. Reference:
Hecht, Optics (5th ed.), Ch. 8 (`hecht2017`); Born and Wolf,
Principles of Optics (7th ed.), Sec. 1.4 (`born-wolf`).

## Controls

- input: linear (with angle) or circular R/L.
- input angle: the linear polarization azimuth.
- element 1 / element 2: polarizer, QWP, HWP, none.
- element 1 axis: the first element's fast axis.
- Reset.

## Expected qualitative features

- Linear in, QWP at 45 deg: a circle on the ellipse, a pole on the
  sphere.
- Half-wave plate: the ellipse stays linear, reflected about the
  axis (sphere point rotates on the equator).
- Polarizer: the ellipse collapses to a line; intensity follows
  Malus cos^2, the sphere point jumps to a diameter end.
- The DOP readout stays at 1.000 (a pure state).

## Invariants and acceptance thresholds

- Malus `cos^2(dtheta)` and polarizer idempotency `P^2 = P`.
- QWP at 45 deg makes `|Ex| = |Ey|`, `|chi| = pi/4`, `|S3| ~ 1`.
- HWP keeps light linear, azimuth `2 beta - alpha`.
- Wave plates and rotators are unitary (`M^dagger M = I`).
- `R(a) R(b) = R(a+b)`, `R(2 pi) = I`.
- `S0^2 = S1^2 + S2^2 + S3^2`, DOP `= 1`.
- Chain product equals sequential application (1e-9).
- Two QWPs make a HWP; a full-wave plate leaves the state.

## Limiting cases for verification

- Identity (no element): output equals input.
- Crossed polarizers: zero transmission.
- QWP at 0 or 90 deg to linear input: unchanged (axis aligned).

## Visual fallback

Static frame: the input and output ellipses plus the sphere points.

## Citations

- Hecht, Optics (5th ed.), Ch. 8 (`hecht2017`).
- Born and Wolf, Principles of Optics (7th ed.), Sec. 1.4
  (`born-wolf`).

## Stretch goals

- A draggable third element and a saved-chain comparison.
- Partially polarized light (coherency matrix, DOP < 1).

## Risk register

- Global phase is unobservable; matrices drop it, which does not
  affect Stokes or the ellipse (the observed quantities).
- The Poincare depth axis (S2) is shown with a small tilt for a 3D
  read; the projection is for display only, not used in the tests.
