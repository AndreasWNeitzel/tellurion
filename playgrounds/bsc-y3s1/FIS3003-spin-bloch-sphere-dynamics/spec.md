---
title: Spin on the Bloch Sphere
slug: spin-bloch-sphere-dynamics
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Drive a spin-1/2 on resonance and watch it sweep pole to pole, a pi-pulse inverting the qubit while the norm readout sits at exactly 1.000000.'
one_paragraph: 'A pure spin-1/2 state is a unit Bloch vector obeying the torque equation dS/dt = Omega(t) x S, with a static field along z (Larmor precession at w0) plus a circularly polarized RF drive of Rabi strength w1 at frequency w_rf. Circular polarization makes the rotating-frame effective field exactly static, so the closed-form generalized Rabi solution is exact and no rotating-wave approximation is needed. The scene is a 3D Bloch sphere (Canvas2D projection): the spin vector, its trajectory, the drive axis, and the |0>, |1>, |+>, |i> kets. On resonance the vector flops pole to pole (pi-pulse inverts, pi/2-pulse builds an equal superposition); off resonance the inversion is capped at w1^2/(w1^2 + Delta^2). Each step is an exact Rodrigues rotation so |S| = 1 to machine precision. The headless sim.js is gate-tested for rotation correctness, exact norm conservation, free Larmor invariants, resonant pi and pi/2 pulses, the generalized off-resonance Rabi formula, the deepest-inversion bound and time-reversibility.'
tags: [quantum, spin, 3d, animation, live-readout]
difficulty: 3
tier: advanced
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
curriculum_year: 'L:F-3Y-1S'
primary_uc: FIS3003
share_state_keys: []
---

# Spin on the Bloch Sphere

## Physical setup

A two-level system (spin-1/2, qubit) in a static magnetic field
`B0 z-hat` and a circularly polarized transverse RF field of
amplitude `B1` rotating at `w_rf`. The pure state is the unit Bloch
vector `S = (sin th cos ph, sin th sin ph, cos th)`, with the north
pole `|0>` and the south pole `|1>`.

## Governing equations

`dS/dt = Omega(t) x S`, with
`Omega(t) = (w1 cos w_rf t, w1 sin w_rf t, w0)`, `w0 = gamma B0`
(Larmor), `w1 = gamma B1` (Rabi). The cross product is perpendicular
to `S`, so `|S|` is conserved exactly. In the frame rotating at
`w_rf` the effective field is the static `(w1, 0, Delta)` with
detuning `Delta = w0 - w_rf`; from `S0 = +z`,
`Sz(t) = (Delta^2 + w1^2 cos(OmegaR t)) / OmegaR^2`,
`OmegaR = sqrt(w1^2 + Delta^2)`. On resonance `Sz = cos(w1 t)`.

## Numerical method

Exact rotation per step (Rodrigues' formula) about the midpoint
precession axis `Omega(t + dt/2)`, by angle `|Omega| dt`. For a
constant axis (free Larmor) this is exact; for the time-varying axis
it is third-order in `dt` with `|S|` preserved to machine precision.
`dt = 1/240`. Reference: Sakurai and Napolitano, Modern Quantum
Mechanics (3rd ed.), Sec. 2.1 (`sakurai-qm`); Griffiths,
Introduction to Quantum Mechanics (3rd ed.), Sec. 4.4 (`griffiths-qm`).

## Controls

- Larmor w0: static-field precession rate (`|0> -> |1>` splitting).
- Rabi w1: RF drive amplitude (flop rate on resonance).
- detuning d: `Delta = w0 - w_rf`; zero is resonance.
- frame: lab (spiralling precession) or rotating (static drive axis).
- show trail: the recent trajectory on the sphere.
- pi pulse / pi/2 pulse: instantaneous rotation about the RF axis.
- Reset, Pause.

## Expected qualitative features

- w1 = 0: pure Larmor precession, the cone angle fixed, `Sz` fixed,
  the tip tracing a latitude circle.
- Resonant (d = 0), w1 > 0: the vector spirals pole to pole; a
  pi-pulse inverts `+z -> -z`; a pi/2-pulse reaches the equator.
- Off resonance: the inversion is incomplete, deepest `Sz` equal to
  `(Delta^2 - w1^2)/(Delta^2 + w1^2) > -1`.
- The `|S|` readout stays at `1.000000` throughout.

## Invariants and acceptance thresholds

- Rodrigues rotation correct; `2 pi` rotation is the identity (1e-12).
- `|S|` conserved under a time-varying drive (1e-9 over 6000 steps).
- Free Larmor: `Sz` and cone fixed (1e-9), azimuth `= w0 t` (1e-7).
- Resonant pi-pulse: `Sz < -0.998`; matches `rabiSz` (2e-3).
- Resonant pi/2-pulse: `Sz = 0`, `theta = pi/2` (4e-3).
- Off-resonance `Sz(t)` tracks the generalized Rabi formula (2e-3).
- Deepest inversion matches `(Delta^2 - w1^2)/OmegaR^2` (3e-3).
- Forward then exact-inverse integration recovers `S0` (1e-7).

## Limiting cases for verification

- `w1 -> 0`: free precession, `Sz` and `theta` constant.
- `Delta -> 0`, area `= pi`: full inversion `Sz: +1 -> -1`.

## Visual fallback

Static frame: the Bloch sphere wireframe with the spin vector at the
captured time, its trajectory, and the drive axis.

## Citations

- Sakurai and Napolitano, Modern Quantum Mechanics (3rd ed.),
  Sec. 2.1 (`sakurai-qm`).
- Griffiths, Introduction to Quantum Mechanics (3rd ed.), Sec. 4.4
  (`griffiths-qm`).

## Stretch goals

- T1/T2 relaxation (Bloch equations) shrinking the vector inward.
- Composite pulses (BB1) cancelling a detuning error.

## Risk register

- Large `w_rf` with a coarse `dt` under-resolves the axis rotation;
  `dt = 1/240` keeps `w_rf dt` small over the slider range.
- Frame transform must use each stored sample's own time, else the
  rotating-frame trail smears; handled per-sample.
