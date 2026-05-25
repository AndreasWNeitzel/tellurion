---
title: Cyclotron Motion in a Uniform Magnetic Field
slug: cyclotron-uniform-b
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2013
primary_citation: pathria
supporting_ucs: [MAA-PL]
curriculum_year: bsc-y2s1
hook: 'A charge in a uniform magnetic field never speeds up or slows down; the force only turns it, locking it onto a circle at a frequency that does not depend on its speed.'
one_paragraph: 'The magnetic force q v x B is always perpendicular to the velocity, so it does no work: a charged particle in a uniform field circles at constant speed. The radius r = m v / (q B) grows with speed, but the cyclotron frequency omega = q B / m does not, the property that makes cyclotrons and ion-trap mass spectrometry work. The playground integrates the motion and shows the circular orbit with its live radius and period as you vary the field strength and the launch speed, so you can check directly that doubling v doubles the radius while leaving the period untouched. Reference: Griffiths, Introduction to Electrodynamics, Ch. 5.'
tags: [electromagnetism, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
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
  - "Pathria, Beale, Statistical Mechanics, Fourth ed."
---

# Cyclotron motion in a uniform magnetic field

## Explainer

### What you are looking at

A charged particle moving through a uniform magnetic field does not go
straight and does not speed up: it circles, forever, at a fixed
frequency. That single fact runs particle accelerators, mass
spectrometers, plasma confinement, and the aurora.

### The equation

The magnetic force is always perpendicular to the velocity,
$\mathbf F = q\,\mathbf v \times \mathbf B$. With
$\mathbf B = B\hat z$ out of the page, that gives (for $q=m=1$)

$$\frac{d\mathbf v}{dt} = \frac{qB}{m}\,(v_y,\, -v_x).$$

Because the force is always at right angles to the motion it does no
work, so the speed is constant; it only steers. The result is uniform
circular motion.

### The cyclotron frequency

Solving gives a circle of radius and period

$$r = \frac{m v}{q B}, \qquad
  \omega_c = \frac{q B}{m}, \qquad
  T = \frac{2\pi m}{q B}.$$

The remarkable part: the angular frequency $\omega_c$ does not depend
on the speed. A fast particle traces a big circle, a slow one a small
circle, but both complete a lap in the same time. That speed-independent
timing is what lets a cyclotron accelerate particles with a fixed-
frequency drive. The radius, in contrast, scales with momentum, which
is how a mass spectrometer separates ions.

### Things to try

- Increase the speed and watch the radius grow while the orbit period
  stays the same (constant $\omega_c$).
- Increase $B$ and watch the circle tighten and the frequency rise.
- Note the speed never changes: a magnetic field steers but never
  does work.

### Where this comes from

The Lorentz force, the circular solution, and the cyclotron frequency
$\omega_c = qB/m$ follow Jackson, *Classical Electrodynamics*, 3rd ed.,
Chapter 12.

## Physical setup

A charged particle (q = m = 1) in a uniform, out-of-page magnetic field
B = B z-hat. Initial state: (x, y) = (0, 0), (vx, vy) = (0, v).

## Governing equations

  F = q v x B  =>  m a = q (vy, -vx) B
  d v / dt = (q B / m) (vy, -vx)

Closed form: circular motion at radius r = m v / (q B), angular frequency
omega_c = q B / m, period T = 2 pi m / (q B).

## Numerical method

Fourth-order Runge-Kutta with dt = 0.005.

## Controls

- B: field magnitude, 0.3 to 3.0.
- |v|: initial speed, 0.3 to 2.5.
- speed: integrator steps per render frame.
- Reset / Pause / Play.

## Expected qualitative features

1. Particle traces a circle of radius m v / (q B).
2. Larger B -> tighter circle, but same period scaling differently:
   T = 2 pi m / (q B).
3. Larger v -> bigger circle, same period at fixed B.
4. Cyan dashed circle is the analytic prediction.

## Invariants and acceptance thresholds

1. Speed conserved within 1e-5 over 1000 RK4 steps.
2. Trajectory lies on analytic circle (center (r, 0), radius r) within
   1e-3.
3. Period closure: after T, particle returns to initial position within
   1e-2 (RK4 integration error).
4. r_2 / r_1 = B_1 / B_2 (exact).
5. Reversing B sign reverses orbit direction.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- B -> infinity: r -> 0, T -> 0.
- v -> 0: particle stationary.
- Reversed B sign: clockwise instead of counter-clockwise.

## Visual fallback

Canvas2D only. Particle (warm orange dot) with trail (yellow), analytic
circle (cyan dashed), velocity arrow, dotted B-field background.

## Citations

- Jackson, Classical Electrodynamics 3e Ch. 12.

## Stretch goals

- Helical motion in 3D (with v_par).
- Time-varying B (synchrotron).
- Drift in non-uniform B (grad-B drift).

## Risk register

- For very large B (omega_c >> 1/dt), RK4 may show small phase error.
  Default dt = 0.005 keeps the error below 1 percent for B up to 3.
