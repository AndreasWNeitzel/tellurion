---
title: Tennis Racket Theorem
slug: tennis-racket-theorem
status: verified
audience: portfolio
created: 2026-05-16
primary_uc: FIS1013
supporting_ucs: []
curriculum_year: bsc-y1s1
primary_citation: goldstein-mech
primary_chapter: 5
hook: 'Spin a flat body about its middle axis and it flips, again and again, with energy and angular momentum perfectly conserved.'
one_paragraph: 'A free rigid body integrates Euler equations with principal moments I1 < I2 < I3 and a quaternion for orientation. Rotation about the largest or smallest principal axis is stable; rotation about the intermediate axis is linearly unstable, so a tiny perturbation grows and the body periodically reverses, the tennis-racket / Dzhanibekov effect, while the kinetic energy and the angular-momentum magnitude stay exactly constant. The spin axis, spin rate and perturbation are adjustable; a decaying corner trace makes each flip obvious.'
tags: [mechanics, rigid-body, 3d, animation, live-readout]
difficulty: 4
tier: simple
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 4
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

# Tennis racket theorem (Dzhanibekov effect)

## Explainer

### What you are looking at

Spin a tennis racket, a phone, or a book tossed in the air about its
middle axis and it does not spin cleanly: it flips over, end for end,
and flips back, again and again. Spin it about its long or its short
axis and it spins steadily. Cosmonaut Vladimir Dzhanibekov noticed this
with a wing-nut in orbit in 1985. It is not friction or a wobble; it is
exact rigid-body dynamics.

### The equations

For a rigid body with no torque, the angular velocity in the body frame
obeys Euler's equations, with principal moments of inertia ordered
$I_1 < I_2 < I_3$:

$$I_1\dot\omega_1 = (I_2 - I_3)\,\omega_2\omega_3,$$

$$I_2\dot\omega_2 = (I_3 - I_1)\,\omega_3\omega_1,$$

$$I_3\dot\omega_3 = (I_1 - I_2)\,\omega_1\omega_2.$$

The orientation is carried along by a unit quaternion $q$ updated with
$\dot q = \tfrac12\,q \otimes (0, \boldsymbol\omega_\text{body})$
(quaternions just avoid the gimbal problems of Euler angles). Two
quantities never change: the rotational energy and the magnitude of
angular momentum,

$$E = \tfrac12\sum_k I_k \omega_k^2, \qquad
  |\mathbf L|^2 = \sum_k (I_k\omega_k)^2.$$

### Why the middle axis is unstable

Spin almost purely about axis 1 (smallest $I$) or axis 3 (largest $I$)
and linearizing Euler's equations gives oscillations: small wobbles
stay small, the spin is stable. Do the same about the intermediate
axis 2 and the linearized equation has a *positive* growth rate
instead of an oscillation,

$$\ddot{\delta} \;=\; +\,\Gamma^2\,\delta,
  \qquad \Gamma^2 = \frac{(I_2-I_1)(I_3-I_2)}{I_1 I_3}\,\omega_2^2 > 0,$$

so any tiny disturbance grows exponentially until the body flips. The
two conserved quantities $E$ and $|\mathbf L|$ force that growth to
turn back around, which is why it flips, returns, and repeats forever.
This is the tennis-racket (or intermediate-axis) theorem.

### Things to try

- Start the spin on the long or short axis and watch it hold steady.
- Start it on the middle axis and watch the periodic end-over-end
  flips, with the energy and $|\mathbf L|$ readouts staying constant
  through every flip.
- Note the flip is regular, not random: same physics, conserved
  quantities intact.

### Where this comes from

Euler's equations, the stability analysis of the three principal axes,
and the intermediate-axis instability follow Goldstein, Poole and
Safko, *Classical Mechanics*, 3rd ed., Section 5.6.

## Physical setup
A torque-free rigid body with principal moments of inertia
$I_1 < I_2 < I_3$. The angular velocity in the body frame obeys
Euler's equations; the orientation is carried by a unit quaternion.

## Governing equations
$$I_1\dot\omega_1 = (I_2-I_3)\,\omega_2\omega_3,\quad
I_2\dot\omega_2 = (I_3-I_1)\,\omega_3\omega_1,\quad
I_3\dot\omega_3 = (I_1-I_2)\,\omega_1\omega_2,$$
$$\dot q = \tfrac12\,q\otimes(0,\boldsymbol\omega_{\rm body}).$$
Conserved: $E=\tfrac12\sum I_k\omega_k^2$ and
$|\mathbf L|^2=\sum (I_k\omega_k)^2$. Linearising about the
intermediate axis gives a positive growth rate, hence the flip.

## Numerical method
RK4 on $\boldsymbol\omega$ at $\Delta t = 1/480\,$s; explicit
quaternion update with renormalisation each step.

## Controls
- `object`: T-handle / tennis racket / smartphone / hardback book
  (each with its true principal moments computed from the geometry).
- `spin axis`: major / intermediate / minor.
- `spin rate` (3..10) and `perturbation` (0.005..0.12).
- Pause / Play, Reset.
- Side panel: body-frame omega(t) with conserved I, E, |L|.

## Expected qualitative features
1. Major- and minor-axis spins are visibly steady.
2. Intermediate-axis spin flips the body end-over-end, periodically.
3. The flip period lengthens as the perturbation shrinks.
4. The energy and |L| readouts stay flat through every flip.

## Invariants and acceptance thresholds
| invariant | threshold | location |
| energy and |L| conserved | rel drift < 1e-3 over 1.2e4 steps | invariants test |
| major-axis spin stable | transverse < 0.6 omega, no sign flip | invariants test |
| minor-axis spin stable | same | invariants test |
| intermediate-axis flips | primary component reverses sign | invariants test |
| quaternion normalized | |q| = 1 to 1e-6 | invariants test |
| visual SSIM | > 0.92 on five deterministic frames | visual test |

All confirmed in `invariants.test.mjs` (5 tests passing).

## Limiting cases for verification
- Zero perturbation about a stable axis: pure steady spin.
- Equal moments (not exposed): no flip, any axis stable.
- Energy and |L| stay on their conserved values through a flip.

## Visual fallback
The caption states the conservation laws and the instability so the
figure is legible without Canvas2D.

## Citations
- Goldstein, Poole, Safko, *Classical Mechanics*, 3e, Sec. 5.6
  (`goldstein-mech`).

## Stretch goals
- Polhode/herpolhode trace on the inertia ellipsoid.
- Add a thrown-handle racket mesh and a body-frame omega arrow.

## Risk register
- Explicit quaternion integration drifts slowly; renormalisation each
  step keeps |q| = 1 within the gate threshold over the capture run.
