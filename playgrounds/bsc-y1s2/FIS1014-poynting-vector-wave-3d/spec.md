---
title: Poynting Vector: a Plane EM Wave in 3D
slug: poynting-vector-wave-3d
status: verified
audience: portfolio
created: 2026-05-17
hook: 'E and B are not just out of phase by ninety degrees in time, they live in perpendicular planes, and their cross product is exactly where the energy goes.'
one_paragraph: 'A plane electromagnetic wave in a 3D oblique-projected scene: the E (red/blue) and B (orange) field ribbons oscillate in perpendicular planes, white Poynting arrows carry the energy along the propagation axis, and ghost wavefront planes move at c. Linear, circular (the E tip traces a helix), elliptical and standing-wave modes; drag to orbit. The exact closed-form fields are gate-tested in the headless sim.js.'
tags: [electromagnetism, 3d, animation, live-readout]
difficulty: 3
tier: advanced
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 4
curriculum_year: 'L:F-1Y-2S'
primary_uc: FIS1004
share_state_keys: []
---

# Poynting Vector: a Plane EM Wave in 3D

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
Sec. 9.2 (`griffithsem2017`); Jackson, *Classical Electrodynamics*,
Ch. 7.
