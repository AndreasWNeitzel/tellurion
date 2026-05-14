---
title: Tautochrone: Cycloid Isochronism
slug: tautochrone-isochronism
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS1013
supporting_ucs: [FIS2021]
curriculum_year: bsc-y1s1
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
tags: [mechanics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Tautochrone: cycloid isochronism

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

- Huygens 1673, Horologium Oscillatorium (`huygens1673`).
- Lemos, Analytical Mechanics Ch. 2 (alternate).

## Stretch goals

- Side-by-side with circular pendulum to show amplitude dependence.
- Pendulum-on-cycloid-cheek (Huygens's original isochronous clock).

## Risk register

- Slider amplitudes max out at 3.5 to keep beads visible; full extension
  would be 4R = 4.
