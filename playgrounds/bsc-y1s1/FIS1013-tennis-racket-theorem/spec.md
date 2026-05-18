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
---

# Tennis racket theorem (Dzhanibekov effect)

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
