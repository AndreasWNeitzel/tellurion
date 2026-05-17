---
title: Biot-Savart 3D Field Explorer
slug: biot-savart-3d-explorer
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Two coils at exactly one radius apart make a pocket of perfectly uniform field. Drag them apart and watch it collapse.'
one_paragraph: 'The magnetic field of arbitrary current loops computed directly from the Biot-Savart law and shown as a 3D lattice of arrow glyphs coloured by |B| with traced field lines and an on-axis Bz profile. Presets give the straight wire, circular loop, Helmholtz coils and a solenoid; current and coil radius are sliders; drag to orbit. The headless sim.js is gate-tested against the analytic closed forms.'
tags: [electromagnetism, 3d, field-visualization, animation]
difficulty: 3
tier: advanced
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 4
curriculum_year: 'L:F-1Y-2S'
primary_uc: FIS1004
share_state_keys: []
---

# Biot-Savart 3D Field Explorer

## Physical setup

Current-carrying wires (a straight wire, a loop, Helmholtz coils, a
solenoid) sit in 3D. The magnetic field is computed at a lattice of
sample points and drawn as arrow glyphs coloured by `|B|`, with field
lines traced by integrating along `B` and the on-axis `Bz(z)` profile
in a side panel. The wire is dashed and animated to show the current.

## Governing equations

$$\mathbf B(\mathbf r)=\frac{\mu_0 I}{4\pi}\oint
\frac{d\boldsymbol\ell\times(\mathbf r-\mathbf r')}{|\mathbf r-\mathbf r'|^3}.$$

## Numerical method

Each wire is a polyline discretized into dl elements; the field is the
direct Biot-Savart sum (units `mu0/4pi = 1`). Field lines are
normalized-step Euler integrations of `B`.

## Controls

- preset selector (straight wire, loop, Helmholtz, solenoid).
- current and coil-radius sliders; field-lines on/off; Reset, Pause.
- drag to orbit the camera.

## Expected qualitative features

- Straight wire: purely azimuthal field encircling the wire.
- Loop: dipolar field, `Bz(z)` peaked at the centre.
- Helmholtz (separation = R): a uniform central region.
- Solenoid: nearly uniform interior, weak exterior.

## Invariants and acceptance thresholds

- Straight wire `|B| = 2I/s` (1/s law) within 1.5%, azimuthal.
- Loop on axis `Bz = 2 pi I R^2/(R^2+z^2)^{3/2}` within 0.5%.
- Helmholtz: `dBz/dz = d2Bz/dz2 = 0` at the centre.
- Finite solenoid centre matches the closed form within 5% and is
  >0.8 of the ideal; field weak outside.
- `div B = 0` at off-wire points (no monopoles).

## Limiting cases for verification

- Long wire: Ampere `B = mu0 I / 2 pi s`.
- Helmholtz at separation R: maximally flat central field.

Source: Griffiths, *Introduction to Electrodynamics*, 4th ed.,
Sec. 5.2 (`griffithsem2017`); Jackson, *Classical Electrodynamics*,
Sec. 5.3.
