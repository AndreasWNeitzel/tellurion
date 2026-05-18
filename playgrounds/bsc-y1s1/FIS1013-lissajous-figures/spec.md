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

## Explainer

### What you are looking at

Drive one oscillation horizontally and another vertically and the
combined point traces a curve whose shape encodes the ratio of the
two frequencies and their phase difference. These are Lissajous
figures, the patterns an oscilloscope draws and the classic way to
compare two frequencies.

### The curve

The point follows two perpendicular harmonic motions:

$$x(t) = A\sin(\omega_x t + \delta),
  \qquad
  y(t) = B\sin(\omega_y t).$$

What you see depends on two things: the frequency ratio
$\omega_x/\omega_y$ and the phase offset $\delta$.

### Reading the pattern

- A rational ratio $\omega_x/\omega_y = p/q$ gives a closed curve
  that repeats; the number of lobes touching each side counts $p$ and
  $q$, so the figure literally displays the frequency ratio. An
  irrational ratio never closes and slowly fills a box (a precursor
  of quasiperiodicity).
- The phase $\delta$ morphs the shape continuously: at equal
  frequencies, $\delta=0$ is a diagonal line, $\delta=\pi/2$ is an
  ellipse (a circle if $A=B$), $\delta=\pi$ the opposite diagonal.
  Watching the figure rotate and "breathe" is watching $\delta$
  advance.

This is exactly how you tune two signals to a known ratio (lock the
pattern until it stops drifting) and why $x$-$y$ phase plots reveal
relative phase at a glance, from oscilloscopes to coupled-oscillator
phase space. The playground lets you set $\omega_x:\omega_y$ and
$\delta$ and watch the curve form and evolve.

### Things to try

- Set a $1:1$ ratio and sweep $\delta$ from 0 to $\pi$: line to
  ellipse to circle to line.
- Set $1:2$, $2:3$, $3:4$ and count the lobes that read off $p$ and
  $q$.
- Detune one frequency very slightly and watch the closed figure
  slowly precess (a beat in the phase).

### Where this comes from

Superposition of perpendicular harmonic motions and the Lissajous
construction follow French, *Vibrations and Waves*, Chapter 2, and
Crawford, *Waves* (Berkeley Physics Course, Vol. 3).

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
