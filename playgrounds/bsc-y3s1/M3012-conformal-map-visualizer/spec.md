---
title: Conformal Maps of the Complex Plane
slug: conformal-map-visualizer
status: verified
audience: portfolio
created: 2026-06-22
primary_uc: M3012
curriculum_year: bsc-y3s1
primary_citation: needham-vca
primary_chapter: 4
hook: "An analytic map bends the plane into curves but never tears an angle. Watch a square grid become parabolas that still cross at right angles."
one_paragraph: "An analytic function w = f(z) maps the z-plane to the w-plane, and wherever f'(z) is nonzero it is conformal: it preserves the angle between crossing curves, because locally it is a rotation by arg f'(z) and a uniform scaling by |f'(z)|. At a critical point f'(z) = 0 conformality fails and angles are multiplied. The playground draws a square grid and its image under a gallery of maps (z^2, 1/z, e^z, a Mobius map, the Joukowski map), with a draggable probe whose perpendicular cross stays perpendicular except at critical points, and plots the local magnification |f'(z)| along the probe's row, vanishing at critical points and diverging at poles."
tags: [complex-analysis, conformal, mapping, math-methods, interactive]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [fn]
invariants:
  - key: angle
    label: angles are preserved where f'(z) is nonzero (conformality)
    tolerance: 1e-3
  - key: area
    label: local area scales by |f'(z)|^2
    tolerance: 0.01
  - key: critical
    label: critical points have f'(z) = 0 and double angles
    tolerance: 1e-9
what_to_try:
  - Drag the probe; its perpendicular cross maps to another perpendicular cross, rotated and rescaled but square.
  - On w = z^2, drag toward the origin; the magnification falls to zero and the right angle opens into a straight line.
  - On 1/z or the Mobius map, approach the pole; the image grid stretches without bound and the magnification spikes.
references:
  - "Needham, Visual Complex Analysis, Ch. 4 (conformal mapping)."
  - "Ablowitz and Fokas, Complex Variables, 2nd ed., Ch. 5."
---

# Conformal maps of the complex plane

## Mathematical setup

An analytic function w = f(z) maps the z-plane to the w-plane. We draw a grid and
its image, and probe the local behaviour.

## Equations

Near z0, $f(z) \approx f(z_0) + f'(z_0)(z - z_0)$, so locally f is multiplication
by $f'(z_0)$: a rotation by $\arg f'(z_0)$ and scaling by $|f'(z_0)|$. Angles are
preserved (conformality) and areas scale by $|f'(z_0)|^2$, except at critical
points where $f'(z_0) = 0$ and angles are multiplied.

## Numerical method

No engine. Closed-form complex maps and their derivatives; the image grid is f
applied to a sampled grid; conformality and magnification follow from f'.

## Controls

- Next map (z^2, 1/z, e^z, Mobius, Joukowski); drag the probe in the z-plane.

## Expected qualitative features

1. The image grid bends into curves that still meet at right angles.
2. The probe's perpendicular cross stays perpendicular (rotated and rescaled).
3. At critical points the magnification vanishes and angles double; at poles the
   image stretches without bound.

## Invariants and acceptance thresholds

- Angles preserved where $f' \ne 0$.
- Area scales by $|f'|^2$.
- $f' = 0$ at the critical points.

## Citations

Needham, Visual Complex Analysis, Ch. 4. Ablowitz and Fokas, Complex Variables,
2nd ed., Ch. 5.
