---
title: "Tautochrone: Cycloid Isochronism"
slug: tautochrone-isochronism
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS1013
supporting_ucs: [FIS2021]
curriculum_year: bsc-y1s1
hook: "Drop beads onto a cycloid-shaped bowl from wildly different heights. They all reach the bottom at exactly the same instant. The cycloid is the tautochrone: the curve on which the period does not depend on the amplitude."
one_paragraph: "On a circular pendulum the period drifts as the swing grows; on a cycloid it does not. Beads released from rest at different heights on a cycloid track all reach the lowest point after the same time, T/4 = pi sqrt(R/g), independent of where they started. The playground releases five beads from different heights at once: at the quarter period they all pass through the bottom together, and at the full period they all return to their starting points. A progress bar marks the quarter, half and three-quarter points so the simultaneity is unmistakable. This isochronism is why Huygens built cycloidal pendulum clocks: forcing the bob onto a cycloid keeps the clock on time even as the swing decays. The same curve is also the brachistochrone, the path of fastest descent."
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
---

# Tautochrone: cycloid isochronism

## Explainer

### What you are looking at

Release several beads from different heights on the same special
curve, and they all reach the bottom at exactly the same instant,
no matter where they started. That curve is the cycloid, and this
"same-time" property (the tautochrone) is one of the most beautiful
results in mechanics. The playground releases beads from different
points and they arrive together.

### Why a circular bowl is not isochronous

A bead sliding in a bowl is a pendulum. For a circular arc the
restoring force is $\propto\sin\theta$, only approximately linear, so
the period grows with amplitude: beads released higher take longer.
True isochronism needs the restoring force to be exactly linear in
the arc length travelled.

### The cycloid solves it exactly

Parametrize the inverted cycloid by
$x = R(\phi-\sin\phi)$, $y = -R(1-\cos\phi)$. Measure arc length $s$
from the lowest point; one can show

$$s = 4R\cos\frac{\phi}{2}
  \quad\Longrightarrow\quad
  \ddot s = -\frac{g}{4R}\,s.$$

That is a perfect simple-harmonic-oscillator equation in $s$, with no
amplitude dependence at all. So every bead, whatever its starting
point, oscillates with the identical period

$$T = 2\pi\sqrt{\frac{4R}{g}} = 4\pi\sqrt{\frac{R}{g}},$$

and reaches the bottom in the same quarter-period. Huygens used
exactly this to design a pendulum clock whose period does not drift
with swing amplitude (the cycloidal cheeks), and it is the same
"brachistochrone/tautochrone" cycloid of the calculus of variations.
The playground releases beads from different heights and shows them
converging on the bottom simultaneously, with the circular-arc case
for contrast (which does not).

### Things to try

- Release beads from very different heights and watch them all reach
  the bottom at the same instant.
- Switch to a circular bowl and watch the higher beads lag (period
  grows with amplitude).
- Note the motion in arc length $s$ is a pure sinusoid regardless of
  amplitude (perfect SHM).

### Where this comes from

The cycloid tautochrone, the linear $\ddot s = -(g/4R)s$ reduction,
and Huygens's clock follow Taylor, *Classical Mechanics*, Chapter 6,
and Lanczos, *The Variational Principles of Mechanics*.

## Physical setup

Five frictionless beads on a single inverted cycloid bowl, released from
five different starting amplitudes. The bowl is the curve
  x(theta) = R (theta - sin theta)
  y(theta) = R (1 + cos theta)
with bottom at (R pi, 0) (theta = pi).

## Governing equations

Choose arc-length s from the bottom. Geometric identity:
  s(theta) = 4 R sin((theta - pi) / 2).

In s-coordinate the Lagrangian gives exactly simple harmonic motion:
  s'' = -omega^2 s,  omega = sqrt(g / (4 R))

so the period T = 4 pi sqrt(R / g) is independent of release amplitude.

## Numerical method

None. Closed-form s(t) = s_0 cos(omega t), mapped through the
cycloid parametrization.

## Controls

- speed: animation speed (1 to 6).
- Reset / Pause / Play.

## Expected qualitative features

1. Five beads start at different heights.
2. All five reach the bottom at the same instant (t = T / 4).
3. All five return to their initial positions at t = T.
4. Time bar at the bottom shows progress through one full period.

## Invariants and acceptance thresholds

1. Quarter-period to bottom independent of amplitude (all reach y = 0 at
   t = T / 4) within 1e-9.
2. Cycloid bottom at (R pi, 0).
3. Arc-length formula s = 4 R sin((theta - pi) / 2) exact.
4. theta(s) is the inverse of s(theta).
5. Full period T = 4 pi sqrt(R / g) closes the orbit.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- Zero amplitude: bead stays at the bottom.
- Maximum amplitude s_0 = 4 R: bead released at the cusp (singular).

## Visual fallback

Canvas2D only. Cycloid bowl (white), five colored beads with initial-position
ghost markers, time bar at bottom showing progress through T.

## Citations

- Huygens 1673, Horologium Oscillatorium.
- Lemos, Analytical Mechanics Ch. 2 (alternate).

## Stretch goals

- Side-by-side with circular pendulum to show amplitude dependence.
- Pendulum-on-cycloid-cheek (Huygens's original isochronous clock).

## Risk register

- Slider amplitudes max out at 3.5 to keep beads visible; full extension
  would be 4R = 4.
