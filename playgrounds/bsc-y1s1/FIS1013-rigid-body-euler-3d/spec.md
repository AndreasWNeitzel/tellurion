---
title: Torque-Free Rigid Body (Euler's Equations) 3D
slug: rigid-body-euler-3d
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Spin a brick about its middle axis and it flips itself over, again and again, with no torque at all.'
one_paragraph: 'A Phong-shaded inertia ellipsoid tumbles under Euler''s torque-free equations, integrated with RK4 and a unit quaternion. The angular-velocity vector traces the polhode on the body and the herpolhode in space while the angular momentum stays fixed. Spinning about the intermediate principal axis triggers the Dzhanibekov (tennis-racket) flip.'
tags: [mechanics, 3d, animation, live-readout]
difficulty: 3
tier: hero
hero_candidate: false
renderer: webgl2
estimated_engagement_minutes: 5
curriculum_year: 'L:F-1Y-1S'
primary_uc: F1006
share_state_keys: []
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

Classical RK4 on the 7-vector `(omega, q)` with `dt = 0.005`, the
quaternion renormalised each step. The polhode is the omega-tip
history in the body frame (painted on the body); the herpolhode is
the omega-tip history in the world frame (it lies in the invariable
plane perpendicular to L).

## Controls

- I1, I3 sliders (reshape the ellipsoid and reseed the trace).
- Dzhanibekov preset (I = 1,2,4 spinning about the intermediate axis).
- Reset, Pause.
- Drag to orbit the camera, wheel to zoom.

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

Source: Landau and Lifshitz, *Mechanics*, 3rd ed., Sec. 37
(`landau-mechanics`); Marion and Thornton, *Classical Dynamics*, Ch. 11.
