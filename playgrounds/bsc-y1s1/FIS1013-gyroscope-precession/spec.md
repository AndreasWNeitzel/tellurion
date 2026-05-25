---
title: Gyroscope Precession
slug: gyroscope-precession
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS1013
primary_citation: taylor-mech
supporting_ucs: [FIS2021]
curriculum_year: bsc-y1s1
hook: "A spinning top should fall over, but it does not: gravity's torque, instead of toppling it, swings its axis sideways in a slow circle. Spin it faster and it precesses slower. That is angular momentum refusing to point where the force pushes."
one_paragraph: "A fast-spinning gyroscope tilted from the vertical has a large spin angular momentum L along its axis. Gravity applies a torque tau = r x W (weight times the lever arm to the pivot) that points perpendicular to L, so instead of changing L's length it swings its direction: the axis sweeps a cone at the precession rate Omega_p = M g r / (I_s omega_s). Counter-intuitively, a faster spin gives a slower precession (the 1/omega_s curve in the side panel). The scene draws the spinning disc, the spin axis (L, gold), the weight (W, red), the gravitational torque (tau, green) and the cone the axis traces; the readout gives omega_s, the tilt, Omega_p and the precession period. This steady-precession picture (valid when the spin is fast compared with the precession) is why a bicycle stays up, how a gyrocompass finds north, and why bullets and footballs are spun."
tags: [mechanics, animation, live-readout]
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
  - "Taylor, Classical Mechanics."
---

# Gyroscope precession

## Explainer

### What you are looking at

A spinning top tilted away from vertical does not fall over. Instead
its axis sweeps slowly around a cone. Gravity is pulling it down, yet
the response is sideways. That sideways response is precession, and it
is the most counterintuitive everyday consequence of angular momentum.

### Why it goes sideways instead of falling

A fast-spinning top has a large angular momentum $\mathbf L$ pointing
along its spin axis. Gravity acting at the centre of mass, a distance
$r$ from the pivot, applies a torque

$$\boldsymbol\tau = \mathbf r \times M\mathbf g,$$

of magnitude $M g r \sin\theta$. The key law is that torque changes
angular momentum, $\boldsymbol\tau = d\mathbf L/dt$. The torque points
horizontally, perpendicular to both gravity and the axis, so it does
not pull $\mathbf L$ down; it swings $\mathbf L$ sideways. The axis
chases $\mathbf L$ and the whole top circles.

### The precession rate

In the fast-spin limit (spin rate $\omega_s$ much larger than the
precession rate) the tilt $\theta$ stays constant and the axis goes
around in azimuth at

$$\Omega_p = \frac{M g r}{I_s\,\omega_s}.$$

Read off the physics: more spin or more spin-inertia means slower
precession (a fast top precesses lazily); more weight or a longer lever
arm means faster precession. Strikingly, $\theta$ cancels out of the
rate in this limit. The playground advances the tilt, azimuth, and
spin by these analytic rates so you can watch the cone and change
$\omega_s$ to see the $1/\omega_s$ law.

### Things to try

- Increase the spin $\omega_s$ and watch the precession slow down.
- Tilt the top more and confirm the precession rate barely changes
  (the $\theta$ independence of $\Omega_p$).
- Notice the axis never falls; gravity only moves it around.

### Where this comes from

The torque-equals-rate-of-change-of-angular-momentum argument and the
steady-precession formula $\Omega_p = M g r / (I_s\omega_s)$ follow
Marion and Thornton, *Classical Dynamics of Particles and Systems*,
5th ed., Chapter 11; the full Lagrangian treatment (with nutation) is
in Goldstein, *Classical Mechanics*, Chapter 5.

## Physical setup

Heavy symmetric top of mass M = 1, with pivot fixed at one end and center
of mass at distance r = 0.5 along the body axis. Spin moment of inertia
I_s = 0.1. Gravity g = 9.81 along -z.

## Governing equations

In the steady-precession (omega_s >> Omega_p) limit:
  Omega_p = M g r / (I_s omega_s)

Tilt theta is constant. Azimuth phi advances at Omega_p. Spin psi
advances at omega_s.

## Numerical method

Direct kinematic update of (theta, phi, psi) by dt times the analytic
rate.

## Controls

- omega_s: spin rate, 10 to 200.
- theta: tilt from vertical, 0.1 to 1.2 rad.
- speed: integrator steps per render frame.
- Reset / Pause / Play.

## Expected qualitative features

1. Higher omega_s -> slower precession.
2. Tilt theta is constant; tip traces a horizontal circle.
3. Right panel shows the 1 / omega_s scaling.

## Invariants and acceptance thresholds

1. Omega_p formula exact.
2. Monotonic in omega_s.
3. Tilt constant.
4. Tip traces a circle of constant radius.
5. Precession period closes.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- omega_s -> infinity: Omega_p -> 0 (gyroscopic stiffness).
- omega_s = 0: leading-order model invalid (top would fall over).

## Visual fallback

Canvas2D only. Left: pseudo-3D scene with vertical axis (dashed),
ground circle, cone of precession (faint), and body axis (bold) with
trail. Right: Omega_p vs omega_s curve.

## Citations

- Marion and Thornton, Classical Dynamics 5e Ch. 11.
- Goldstein, Classical Mechanics Ch. 5 (alternate Lagrangian treatment).

## Stretch goals

- Full Euler-equation nutation (theta wobble).
- Gravitational versus torque-free precession.
- Coupled gyroscopes (gimbal mount).

## Risk register

- Leading-order model breaks down at low spin. Slider lower bound at 10.
