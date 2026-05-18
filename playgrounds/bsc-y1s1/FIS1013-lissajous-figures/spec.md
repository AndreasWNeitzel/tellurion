---
title: Lissajous Figures
slug: lissajous-figures
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS1013
supporting_ucs: [FIS1015]
curriculum_year: bsc-y1s1
hook: "Feed one sine wave to the x-axis and another to the y-axis. If their frequencies are in a simple ratio the dot traces a closed figure; nudge the phase and the figure morphs. These are Lissajous curves, the patterns an oscilloscope draws."
one_paragraph: "Two perpendicular harmonic motions, x = A sin(a t + delta) and y = B sin(b t), combine into a Lissajous figure. When the frequency ratio a:b is a ratio of small integers the curve closes into a stable looped pattern (3:5 gives three lobes one way, five the other); an irrational ratio never closes and slowly fills a box. The phase delta continuously morphs the shape, turning a circle into a line through an ellipse. The main panel traces the curve with a moving pen while two side strips show the underlying x(t) and y(t) sinusoids, so you can count how many cycles each axis completes per figure. The readout gives a, b, the phase, the ratio and the period. This is exactly how an XY oscilloscope compares two signals: a still, simple Lissajous figure means the two frequencies are locked in a known ratio."
tags: [mechanics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Lissajous figures

## Physical setup

A point traces out the parametric curve
  x(t) = A sin(a t + delta)
  y(t) = B sin(b t)
on a 2D plane. The shape depends only on the frequency ratio a / b and the
phase delta. Such curves arise whenever two perpendicular harmonic
oscillations are observed simultaneously, as in oscilloscope traces or
optical interference of two-mode beams.

## Governing equations

x(t) = A sin(a t + delta), y(t) = B sin(b t). No ODE.

Closure: for integer ratio a : b in lowest terms, the curve closes after
T = 2 pi / gcd(a, b). For irrational a / b, the curve never closes and is
dense in the bounding box [-A, A] x [-B, B].

## Numerical method

Closed-form evaluation. Period calculated by Euclidean gcd.

## Controls

- a: integer x-frequency, 1 to 9.
- b: integer y-frequency, 1 to 9.
- delta: phase of x-channel, 0 to pi.
- speed: pen advance per frame.
- 6 preset buttons: 1:1, 1:2, 2:3, 3:4, 3:5, 5:7.

## Expected qualitative features

1. 1:1 with delta = pi / 2: circle.
2. 1:1 with delta = 0: line y = x.
3. 1:2: figure-eight (vertical oriented).
4. 2:3: bowtie shape with 3 horizontal lobes, 2 vertical.
5. As ratio gets more complex, curve becomes denser quasi-grid.
6. Phase delta smoothly deforms each figure.

## Invariants and acceptance thresholds

1. Integer-ratio curves close at T = 2 pi within 1e-10.
2. Boundedness: |x| <= A, |y| <= B.
3. 1:1 phase = pi / 2 is exactly a circle: x^2 + y^2 = 1.
4. 1:1 phase = 0 is exactly y = x.
5. Sample arrays have correct length and span.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- a = b, delta = pi / 2: unit circle.
- a = b, delta = 0: line y = x.

## Visual fallback

Canvas2D only. Main square panel shows the curve with current pen position;
two trace strips on the right show x(t) and y(t) separately.

## Citations

- Crawford, Waves and Oscillations Ch. 1 (`crawford-waves`).
- Bowditch, On the Motion of a Pendulum Suspended from Two Points (1815) for
  the historical observation.

## Stretch goals

- Damped Lissajous (curve spirals to origin).
- 3D Lissajous on a Bloch sphere or a torus.
- Phase auto-sweep mode.

## Risk register

- Integer slider only; rational non-integer ratios (3 : 2) work via preset
  rescaling.
