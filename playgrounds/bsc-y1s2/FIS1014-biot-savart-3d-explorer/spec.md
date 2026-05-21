---
title: Biot-Savart 3D Field Explorer
slug: biot-savart-3d-explorer
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Two coils at exactly one radius apart make a pocket of perfectly uniform field. Drag them apart and watch it collapse.'
one_paragraph: 'The magnetic field of arbitrary current loops computed directly from the Biot-Savart law and shown as a 3D lattice of arrow glyphs coloured by |B| with traced field lines and an on-axis Bz profile. Presets give the straight wire (B falling as 1/r), the single circular loop, a Helmholtz pair (the central region where the field is most uniform), and a solenoid (a nearly uniform interior with return flux outside); current and coil radius are sliders and you drag to orbit. Reference: Griffiths, Introduction to Electrodynamics, Chapter 5.'
tags: [electromagnetism, 3d, field-visualization, animation]
difficulty: 3
tier: advanced
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 4
curriculum_year: 'L:F-1Y-2S'
primary_uc: FIS1004
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

# Biot-Savart 3D Field Explorer

## Explainer

### What you are looking at

Run a current through a wire and it wraps space in a magnetic field.
The playground lets you pick the wire (a straight wire, a single loop,
a Helmholtz pair, a solenoid) and shows the field as colored arrows and
traced field lines, with the on-axis strength in a side panel. It is
the rule that connects electric current to magnetism made visible.

### The one law: Biot-Savart

Every short piece of current-carrying wire $d\boldsymbol\ell$ adds a
small magnetic field, and you sum the contributions along the whole
wire:

$$\mathbf B(\mathbf r) = \frac{\mu_0 I}{4\pi}
  \oint \frac{d\boldsymbol\ell \times (\mathbf r - \mathbf r')}
  {|\mathbf r - \mathbf r'|^3}.$$

Read the pieces: the field of each element is perpendicular to both the
current direction $d\boldsymbol\ell$ and the line to the field point
(that is the cross product), it falls off as one over distance squared,
and it circles the wire (right-hand rule). $\mu_0$ is just the constant
that sets the units.

### What each wire shape gives

- Straight wire: the integral gives $B = \mu_0 I / (2\pi d)$, circles
  around the wire that weaken with distance $d$.
- Single loop: on the axis, $B_z(z) = \mu_0 I R^2 / [2(R^2+z^2)^{3/2}]$,
  peaked at the center.
- Helmholtz pair (two loops one radius apart): the two on-axis profiles
  add so the field is almost uniform in the middle, the standard way
  to make a known, flat field.
- Solenoid: the loops stack and the interior field becomes nearly
  uniform, $B \approx \mu_0 n I$, with $n$ turns per length.

The playground computes the sum directly over a polyline of $d\ell$
elements, so the same one law produces all four cases.

### Things to try

- Switch from a single loop to a Helmholtz pair and watch the on-axis
  profile flatten in the middle.
- Build up the solenoid and see the inside field straighten and the
  outside field nearly vanish.
- Note the field always encircles the wire, never points along it.

### Where this comes from

The Biot-Savart law and the loop, Helmholtz, and solenoid results
follow Griffiths, *Introduction to Electrodynamics*, 5th ed.,
Chapter 5 (magnetostatics).

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
