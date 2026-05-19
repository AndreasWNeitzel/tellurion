---
title: Spin on the Bloch Sphere
slug: spin-bloch-sphere-dynamics
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Drive a spin-1/2 on resonance and watch it sweep pole to pole, a pi-pulse inverting the qubit while the norm readout sits at exactly 1.000000.'
one_paragraph: 'A pure spin-1/2 state is a unit Bloch vector obeying the torque equation dS/dt = Omega(t) x S, with a static field along z (Larmor precession at w0) plus a circularly polarized RF drive of Rabi strength w1 at frequency w_rf. With a circularly polarized drive the effective field is static in the rotating frame, so the generalized Rabi solution is exact (no rotating-wave approximation needed). The scene is a 3D Bloch sphere showing the spin vector, its trajectory, the drive axis and the |0>, |1>, |+>, |i> reference states. On resonance the vector flops between the poles (a pi-pulse inverts the spin, a pi/2-pulse builds an equal superposition); detuned, the maximum inversion is capped at w1^2 / (w1^2 + Delta^2), the Rabi resonance lineshape. Reference: Sakurai and Napolitano, Modern Quantum Mechanics, Chapter 3; Nielsen and Chuang, Quantum Computation and Quantum Information, Chapter 4.'
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

## Explainer

### What you are looking at

Every two-level quantum system (a spin, a qubit) is a unit arrow on a
sphere, the Bloch sphere: north pole is state |0>, south pole is |1>,
the equator is equal superpositions. A magnetic field makes that arrow
precess; a resonant radio pulse tips it from pole to pole. This is the
geometry behind NMR, MRI, and every gate on a qubit.

### The equation of motion

A static field $B_0\hat z$ plus a transverse RF field of amplitude
$B_1$ rotating at $\omega_\text{rf}$ drives the Bloch vector
$\mathbf S$ by

$$\frac{d\mathbf S}{dt} = \boldsymbol\Omega(t)\times\mathbf S,
  \qquad \boldsymbol\Omega = (\omega_1\cos\omega_\text{rf}t,\
  \omega_1\sin\omega_\text{rf}t,\ \omega_0),$$

with the Larmor frequency $\omega_0 = \gamma B_0$ and the Rabi
frequency $\omega_1 = \gamma B_1$. Because the right side is a cross
product, it is always perpendicular to $\mathbf S$, so $|\mathbf S|$ is
exactly conserved: the state stays a pure state on the sphere, it only
rotates.

### Rabi oscillations and resonance

Go into the frame rotating at $\omega_\text{rf}$ and the messy
time-dependent field becomes a static effective field
$(\omega_1, 0, \Delta)$ with detuning $\Delta = \omega_0 -
\omega_\text{rf}$. Starting from the north pole, the population
oscillates as

$$S_z(t) = \frac{\Delta^2 + \omega_1^2\cos(\Omega_R t)}{\Omega_R^2},
  \qquad \Omega_R = \sqrt{\omega_1^2 + \Delta^2}.$$

On resonance ($\Delta = 0$) this is simply $S_z = \cos(\omega_1 t)$:
the spin flips fully between |0> and |1> at the Rabi frequency, a
clean qubit rotation. Off resonance the flip is incomplete and faster.
A pulse of the right duration is a quantum gate (a $\pi$ pulse flips
the bit, a $\pi/2$ pulse makes a superposition).

### Things to try

- Tune to resonance and watch the Bloch vector swing pole to pole
  (full Rabi flopping).
- Add detuning and watch the precession tighten into a small cone that
  never reaches the south pole.
- Stop an on-resonance drive after a quarter period: a $\pi/2$ pulse
  leaving the spin on the equator (a superposition).

### Where this comes from

The Bloch equation, the rotating-frame reduction, and the Rabi
formula follow Sakurai, *Modern Quantum Mechanics* (spin precession and
magnetic resonance), and the standard NMR treatment in Griffiths,
*Introduction to Quantum Mechanics*.

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
- drag on the sphere: orbits the 3D camera (azimuth and elevation).
- Reset (also restores the default view), Pause.

## Expected qualitative features

- The purple curve is the predicted future path S(t); a ring marks
  its start, which is the present state, so the spin arrow tip sits
  on it and travels along it. In the lab frame the path is a Larmor
  + Rabi spiral that follows no fixed arrow (the drive axis itself
  rotates); in the rotating frame it is a clean precession cone
  about the static effective field. An on-canvas line states this.
- The view can be orbited by dragging; the projection is a plain
  Canvas2D azimuth/elevation rotation.
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
