---
title: Torque-Free Rigid Body (Euler's Equations) 3D
slug: rigid-body-euler-3d
status: verified
audience: portfolio
created: 2026-05-17
hook: 'A free body never spins about a fixed line: its spin axis traces a polhode while the angular momentum stays nailed in place.'
one_paragraph: 'An inertia ellipsoid tumbles under Euler''s torque-free equations (RK4 plus a unit quaternion), drawn in Canvas2D orthographic pseudo-3D with depth-sorted, lambert-shaded faces and the three principal-plane seam rings. The instantaneous spin axis is white, the conserved angular momentum is gold and fixed in space, and the polhode is painted on the body. The diagnostic traces the polhode in the omega1-omega3 principal plane, against the analytic polhode curve for the live energy and angular momentum: a tight closed loop for the major or minor axis, a separatrix bowtie for the intermediate axis, where the body flips end over end.'
tags: [mechanics, 3d, animation, live-readout]
difficulty: 3
tier: hero
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
curriculum_year: 'L:F-1Y-1S'
primary_uc: F1006
primary_citation: marion-thornton
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
  - "Marion, Thornton, Classical Dynamics of Particles and Systems, Fifth ed."
---

# Torque-Free Rigid Body (Euler's Equations) 3D

## Explainer

### What you are looking at

A solid body tumbles in space with nothing pushing on it. The white
arrow is its instantaneous spin axis $\boldsymbol\omega$; the gold
arrow is the angular momentum $\mathbf L$, which stays fixed in space
because there is no torque. Watch the spin axis trace a closed curve
on the body (the polhode) while the body's own axes wander around the
fixed gold arrow. This is the full geometry of free rotation, the
thing that makes tossed objects tumble.

### The equations

In the body frame, with principal moments $I_1, I_2, I_3$, the spin
obeys Euler's equations:

$$I_1\dot\omega_1 = (I_2 - I_3)\,\omega_2\omega_3,$$

$$I_2\dot\omega_2 = (I_3 - I_1)\,\omega_3\omega_1,$$

$$I_3\dot\omega_3 = (I_1 - I_2)\,\omega_1\omega_2.$$

The right-hand sides are the gyroscopic coupling: unless the body spins
exactly about one principal axis, the three components continuously
trade. The body's orientation is carried by a unit quaternion with
$\dot q = \tfrac12\,q \otimes [0, \boldsymbol\omega_\text{body}]$.
Two conserved quantities,

$$E = \tfrac12\sum_k I_k\omega_k^2, \qquad
  |\mathbf L|^2 = \sum_k (I_k\omega_k)^2,$$

constrain $\boldsymbol\omega$ to the intersection of an energy
ellipsoid and a momentum sphere. That intersection is the polhode
curve.

### Polhode and herpolhode

- The polhode is the path of the $\boldsymbol\omega$ tip drawn on the
  body (it is painted on the ellipsoid here). Closed loops around the
  long and short axes, a separatrix through the middle axis.
- The herpolhode is the same tip seen in the fixed lab frame; it lies
  in the invariable plane perpendicular to the constant $\mathbf L$.

Together they say a free body does not spin about a fixed line: the
axis itself moves, on the body and in space, in a fully determined way.

### Things to try

- Spin near the long or short axis: tight closed polhode loop, steady
  tumble.
- Spin near the intermediate axis: the polhode runs along the
  separatrix and the body flips (the same instability as the
  tennis-racket theorem).
- Watch the gold $\mathbf L$ arrow stay rigidly fixed while everything
  else moves: conservation of angular momentum, visible.

### Where this comes from

Euler's equations, the inertia ellipsoid, and the polhode and
herpolhode construction follow Goldstein, Poole and Safko, *Classical
Mechanics*, 3rd ed., Chapter 5 (rigid-body motion).

## Physical setup

A rigid body rotates freely in space with no applied torque. Its
inertia tensor is diagonal in the body frame with principal moments
`I1, I2, I3`. The body is drawn as the corresponding uniform-density
inertia ellipsoid; the three principal axes are colour-coded arrows
(red I1, green I2, blue I3). The angular-velocity vector omega is
white, the conserved angular momentum L is gold and fixed in space.

## Governing equations

Euler's equations in the body frame (torque-free):

$$I_1\dot\omega_1=(I_2-I_3)\omega_2\omega_3,\quad
I_2\dot\omega_2=(I_3-I_1)\omega_3\omega_1,\quad
I_3\dot\omega_3=(I_1-I_2)\omega_1\omega_2.$$

Orientation is carried by a unit quaternion with
$\dot q=\tfrac12\,q\otimes[0,\boldsymbol\omega_{\text{body}}]$.

## Numerical method

Classical RK4 on the 7-vector `(omega, q)` at `dt = 1/240 s`, the
quaternion renormalised each step. Rendering is plain Canvas2D: the
ellipsoid is a lat-long quad mesh transformed by the quaternion and a
fixed orthographic camera, back-face culled, depth-sorted (painter's
algorithm) and lambert-shaded; the three principal-plane seam rings
and the body-frame polhode are drawn front-half only. The diagnostic
overlays the live (omega1, omega3) trace on the analytic polhode,
obtained by sweeping omega2 over its allowed range and solving the two
conserved quadratics for omega1^2 and omega3^2.

## Controls

- `spin axis`: minor / middle / major (sets the initial spin and a
  small transverse nudge).
- `asymmetry`: how triaxial the ellipsoid is, I = (3 - a, 3, 3 + a).
- `spin rate`, `nudge` (the perturbation off the chosen axis).
- Reset, Pause.

## Expected qualitative features

- Stable, near-steady spin about the major or minor axis.
- Dramatic periodic flips about the intermediate axis (Dzhanibekov).
- A fixed gold L direction with omega circulating around it.

## Invariants and acceptance thresholds

- Rotational energy `E = 1/2 sum Ii wi^2` conserved within 1e-4 over
  1e4 steps.
- `|L|^2 = sum Ii^2 wi^2` conserved within 1e-4 over 1e4 steps.
- Quaternion unit-norm within 1e-8.
- Intermediate-axis spin flips sign within 5000 steps.
- Major-axis spin does not flip.

## Limiting cases for verification

- Equal moments (I1=I2=I3): omega constant (free symmetric top).
- Axisymmetric (I1=I2): steady precession of omega about the symmetry
  axis at constant cone angle.

Source: Landau and Lifshitz, *Mechanics*, 3rd ed., Sec. 37; Marion and Thornton, *Classical Dynamics*, Ch. 11.
