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

## Explainer

### What you are looking at

Polarized light is a 2-vector; each polarizer or wave plate is a 2x2
matrix; sending light through optics is just matrix multiplication.
That is the Jones calculus. The playground sends a beam through up to
two elements and shows the polarization ellipse and Stokes parameters
that come out.

### The vector and the matrices

The light is a Jones vector $(E_x, E_y)$ of complex amplitudes (the
phase between them sets linear vs circular vs elliptical). Each element
is a matrix applied in turn:

$$\mathbf E_\text{out} = M_2\,M_1\,\mathbf E_\text{in}.$$

On its own axis a polarizer is $\operatorname{diag}(1, 0)$ (it kills
one component); a retarder is $\operatorname{diag}(1, e^{-i\delta})$
(it delays one component by $\delta$: a quarter-wave plate has
$\delta = \pi/2$, a half-wave plate $\delta = \pi$). For an element
rotated to angle $\theta$ you conjugate by the rotation,
$M(\theta) = R(-\theta)\,M\,R(\theta)$.

### Reading the output

The output ellipse is summarized by the Stokes parameters

$$S_0 = |E_x|^2 + |E_y|^2,\quad S_1 = |E_x|^2 - |E_y|^2,$$
$$S_2 = 2\,\mathrm{Re}(E_x^* E_y),\quad S_3 = -2\,\mathrm{Im}(E_x^* E_y),$$

from which the ellipse orientation is
$\psi = \tfrac12\operatorname{atan2}(S_2, S_1)$ and the ellipticity is
$\chi = \tfrac12\arcsin(S_3/S_0)$. So a quarter-wave plate at
$45^\circ$ turns linear into circular ($S_3$ maxed); two polarizers at
$90^\circ$ give darkness ($S_0\to0$); inserting a third between them
lets light through again, the classic surprise. The playground updates
the ellipse and Stokes vector live as you set the elements.

### Things to try

- Cross two polarizers (extinction), then rotate a wave plate between
  them and watch light reappear.
- Send linear light through a quarter-wave plate at $45^\circ$ and
  watch it become circular ($\chi \to 45^\circ$).
- Read the Stokes parameters and confirm $S_1^2+S_2^2+S_3^2 = S_0^2$
  for fully polarized light.

### Where this comes from

The Jones vector and matrices, the rotation conjugation, and the
Stokes parameters follow Hecht, *Optics*, 5th ed., Chapter 8.

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
- input angle: the linear polarization azimuth. Shown only for
  linear input; circular light has no linear azimuth so the control
  is hidden there rather than left looking dead.
- element 1 / element 2: polarizer, QWP, HWP, none.
- element 1 axis: the first element's fast axis.
- Reset.

## Expected qualitative features

- An optical bench across the top: the beam enters, passes element 1
  then element 2, and the polarization ellipse is drawn at every
  stage (input, after E1, output), so the transformation is concrete
  rather than abstract.
- The Poincare sphere shows the stage-by-stage path (input, mid,
  output joined by a dashed line): each element moves the point, a
  wave plate rotating it, a polarizer projecting it.
- Linear in, QWP at 45 deg: a circle on the ellipse, the path runs
  from the equator (H) to a pole (S3) on the sphere.
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
