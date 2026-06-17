---
title: Poynting Vector: a Plane EM Wave in 3D
slug: poynting-vector-wave-3d
status: verified
audience: portfolio
created: 2026-05-17
hook: 'E and B are not just out of phase by ninety degrees in time, they live in perpendicular planes, and their cross product is exactly where the energy goes.'
one_paragraph: 'A plane electromagnetic wave shown in 3D: the electric field E (red/blue) and magnetic field B (orange) oscillate in phase, perpendicular to each other and to the direction of travel, with |E| = c|B|. The white arrows are the Poynting vector S = E x B / mu0, which points along the propagation axis and carries the wave''s energy at speed c, and ghost wavefront planes march forward at c. Switching modes shows linear polarization, circular (the E tip traces a helix), elliptical, and a standing wave formed by two counter-propagating waves with fixed nodes; drag to orbit and see the field geometry from any angle. Reference: Griffiths, Introduction to Electrodynamics, Chapter 9.'
tags: [electromagnetism, 3d, animation, live-readout]
difficulty: 3
tier: advanced
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 4
curriculum_year: 'L:F-1Y-2S'
primary_uc: FIS1004
primary_citation: griffithsem2017
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
  - "Griffiths, Introduction to Electrodynamics."

---

# Poynting Vector: a Plane EM Wave in 3D

## Explainer

### What you are looking at

A light wave is an electric field and a magnetic field locked together,
oscillating at right angles to each other and to the direction they
travel. The playground draws both as ribbons along the propagation
axis and a third arrow, the Poynting vector, showing which way (and how
fast) energy actually flows.

### The fields

For a plane wave traveling along $z$, the electric field oscillates in
one transverse direction and the magnetic field in the perpendicular
one, in step:

$$\mathbf E = E_0\cos(kz - \omega t)\,\hat e_{\rm pol}, \qquad
  \mathbf B = \frac{1}{c}\,\hat z \times \mathbf E.$$

They are in phase (peak together, zero together) and $B$ is smaller by
a factor $c$. The wave moves at $c = \omega/k$.

### The Poynting vector: where the energy goes

The energy flux is the Poynting vector

$$\mathbf S = \frac{\mathbf E \times \mathbf B}{\mu_0}.$$

Because $\mathbf E \perp \mathbf B$ and both are transverse, $\mathbf S$
points along $+\hat z$, the propagation direction, and its size
pulses as $\cos^2(kz-\omega t)$. Its time average is the intensity, the
brightness you actually measure. This is the precise statement that a
light wave carries energy forward.

### Polarization states

- Linear: $\mathbf E$ stays in one plane (the default ribbon).
- Circular: two perpendicular components a quarter cycle apart,
  $\mathbf E = E_0[\cos(kz-\omega t)\,\hat x + \sin(kz-\omega t)\,\hat y]$,
  so the tip traces a helix.
- Standing: two counter-propagating waves add to
  $\mathbf E = 2E_0\sin(kz)\sin(\omega t)$, fixed nodes, no net energy
  transport ($\langle\mathbf S\rangle = 0$).

The playground switches between these so you see the geometry change
while the $\mathbf E \times \mathbf B$ rule still sets the energy flow.

### Things to try

- Watch $\mathbf E$ and $\mathbf B$ peak at the same instant: they are
  in phase, not a quarter cycle apart.
- Switch to circular polarization and follow the field tip spiraling.
- Switch to a standing wave and see the Poynting arrows cancel on
  average: nodes do not transport energy.

### Where this comes from

The plane-wave fields, the $\mathbf B = \hat z\times\mathbf E/c$
relation, and the Poynting vector follow Griffiths, *Introduction to
Electrodynamics*, 5th ed., Chapter 9.

## Physical setup

A monochromatic plane wave propagates along z. `E` oscillates in one
transverse plane, `B` in the orthogonal one, and the Poynting vector
`S = E x B / mu0` points along the propagation direction. Units are
`c = 1`, `mu0 = 1`.

## Governing equations

$$\mathbf E=E_0\cos(kz-\omega t)\,\hat e_{\rm pol},\quad
\mathbf B=\tfrac1c\,\hat z\times\mathbf E,\quad
\mathbf S=\frac{\mathbf E\times\mathbf B}{\mu_0}.$$

Circular: `E = E0[cos(kz-wt) x + sin(kz-wt) y]`. Standing:
`E = 2 E0 sin(kz) sin(wt)`.

## Numerical method

Closed-form evaluation; no integration. A yaw/pitch orthographic
projection renders the field ribbons, Poynting arrows and moving
wavefront planes. Per the Bible stop-condition the renderer is
canvas2d (the physics is pure geometry, no GPU compute needed).

## Controls

- mode selector (linear, circular, elliptical, standing).
- wavelength, amplitude, polarisation-angle sliders; Reset, Pause.
- drag to orbit the camera.

## Expected qualitative features

- E and B ribbons always perpendicular; S along +z.
- Circular: the E tip traces a helix.
- Standing wave: fixed nodes and antinodes, no net flux.

## Invariants and acceptance thresholds

- `E . B = 0` everywhere (transverse) within 1e-12.
- `|E| = c|B|` for the traveling wave within 1e-6.
- `S` parallel to +z for the plane traveling wave.
- Time-averaged `<S> = E0^2 / 2c` for linear within 1%.
- Circular: `|E|` constant `= E0`.
- Standing wave: `|E| = 0` at `kz = n pi` for all t.

## Limiting cases for verification

- Linear at `pol = 0`: classic E_x, B_y wave.
- Standing: superposition of two counter-propagating waves.

Source: Griffiths, *Introduction to Electrodynamics*, 4th ed.,
Sec. 9.2; Jackson, *Classical Electrodynamics*,
Ch. 7.
