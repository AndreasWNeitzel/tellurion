---
title: Special Relativity Spacetime Lab
slug: special-relativity-spacetime-lab
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Push beta toward 1 and the train shrinks against its own ghost while the travelling twin returns visibly younger than the one who stayed home.'
one_paragraph: 'Special relativity made physical. A rod-train moves at speed beta = v/c and is Lorentz-contracted to L0/gamma against its dashed rest length, while two twin clocks tick: on a round trip the travelling twin returns having aged only 2L/(gamma beta) against the stay-home 2L/beta. The side panel is the Minkowski diagram with the 45-degree light cone, the boosted lines of simultaneity, and the bent twin worldline. Reference: Taylor and Wheeler, Spacetime Physics, 2nd ed., Chapters 3 to 4.'
tags: [relativity, spacetime, animation, multi-panel, live-readout]
difficulty: 4
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 5
curriculum_year: 'L:F-2Y-2S'
primary_uc: FIS2003
share_state_keys: []
---

# Special Relativity Spacetime Lab

## Explainer

### What you are looking at

Nothing outruns light, and the price is that length and time are not
absolute. The playground sends a rod-train on a round trip near light
speed: it visibly contracts, and the twin who rode it returns younger
than the one who stayed home. The Minkowski diagram shows why.

### The Lorentz boost

Moving between frames at speed $\beta=v/c$ (units $c=1$) uses the
Lorentz boost

$$t' = \gamma\,(t-\beta x),\qquad
  x' = \gamma\,(x-\beta t),\qquad
  \gamma=\frac{1}{\sqrt{1-\beta^2}},$$

with the Lorentz factor $\gamma\ge 1$. It leaves the spacetime
interval invariant:

$$s^2 = t^2 - x^2 = t'^2 - x'^2.$$

That single invariant is the geometry of spacetime; everything else
follows from it.

### Contraction, dilation, and the twins

A moving rod of rest length $L_0$ is measured shorter,
$L=L_0/\gamma$; a moving clock runs slow by $1/\gamma$. On a round
trip to coordinate distance $L$ and back, the stay-home twin ages
$2L/\beta$ while the traveller ages only $2L/(\gamma\beta)$, so the
traveller returns younger with no paradox: their worldline is bent at
the turnaround and is the shorter path through spacetime. Velocities
do not simply add but compose as $(u+v)/(1+uv)$, which keeps $c$
invariant in every frame.

### Things to try

- Push $\beta$ toward 1 and watch the solid rod shrink against its
  dashed rest length while $\gamma$ blows up.
- Read the two clocks after a round trip: the traveller shows
  home$/\gamma$.
- Watch the Minkowski lines of simultaneity tilt toward the light cone
  as $\beta$ grows (the relativity of simultaneity).

### Where this comes from

The Lorentz boost, the invariant interval and the twin result follow
Taylor and Wheeler, Spacetime Physics, 2nd ed., Chapters 3 to 4.

## Physical setup

A rigid rod (a train) of rest length L0 makes a round trip out to a
coordinate distance L and back at speed beta (units c = 1). A twin
rides the train; the other stays at the home station at x = 0.

## Governing equations

The Lorentz boost `t' = gamma (t - beta x)`, `x' = gamma (x - beta t)`
with `gamma = 1/sqrt(1 - beta^2)` leaves `s^2 = t^2 - x^2` invariant.
A moving rod measures `L = L0/gamma`; a moving clock runs slow by
`1/gamma`. On the round trip the home twin elapses `2L/beta` while the
traveller's proper time is `2L/(gamma beta)`. Velocities compose as
`(u+v)/(1+uv)` (and `c` stays `c`). The relativistic Doppler factor is
`sqrt((1 +/- beta)/(1 -/+ beta))`.

## Numerical method

Closed-form relativity (no integration). The round trip is animated
over a fixed cycle; the rod is drawn at `L0/gamma` against its dashed
rest length, the clock hands advance by the home and proper times, and
the Minkowski panel draws the light cone, the simultaneity grid (slope
beta) and the bent twin worldline at a panel-fitted scale. Reference:
Taylor and Wheeler, *Spacetime Physics* (2nd ed.), Ch. 3-4
(`taylor-wheeler`); Eisberg and Resnick, *Quantum Physics*, Ch. 1.

## Controls

- speed beta (v/c): sets gamma, the contraction and the dilation.
- trip distance L: the round-trip length and the twin gap.
- Reset, Pause.

## Expected qualitative features

- The solid rod is shorter than its dashed rest length by `1/gamma`;
  the gap widens sharply as `beta -> 1`.
- The travelling clock falls behind the home clock and returns
  reading `home/gamma`.
- The Minkowski simultaneity lines tilt with beta toward the light
  cone; the twin worldline is bent at the turnaround.
- Outbound the train recedes (redshift); inbound it approaches
  (blueshift).

## Invariants and acceptance thresholds

- `gamma(0)=1`, `gamma(0.6)=1.25`, `gamma(sqrt3/2)=2`.
- `s^2 = t^2 - x^2` invariant under any boost within 1e-10.
- `L(beta=0.866) = L0/2` within 0.1%; monotone decreasing in beta.
- Time dilation by gamma exactly; the moving clock runs at `1/gamma`.
- Twin: `travel = 2L/(gamma beta)`, gap `= home - travel`, traveller
  ages half at `beta = 0.866` within 0.1%.
- Velocity addition `< c`, `addVelocity(1, v) = 1`, antisymmetric.
- Doppler approach `> 1`, recede `< 1`, product `= 1`.
- Same-time events get `delta t' = -gamma beta delta x` after a boost.

## Limiting cases for verification

- `beta = 0`: no contraction, no dilation, gamma = 1.
- `addVelocity(1, v) = 1`: the speed of light is frame-invariant.

Source: Taylor and Wheeler, *Spacetime Physics* (2nd ed.), Ch. 3-4
(`taylor-wheeler`).
