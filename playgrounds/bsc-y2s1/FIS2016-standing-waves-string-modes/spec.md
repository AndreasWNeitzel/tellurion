---
title: Standing Waves on a String
slug: standing-waves-string-modes
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2016
supporting_ucs: []
curriculum_year: bsc-y2s1
hook: 'Pluck a clamped string and only special shapes survive: the harmonics, each fitting a whole number of half-waves between the fixed ends.'
one_paragraph: 'A string clamped at both ends can oscillate only in its normal modes, the sin(n pi x / L) standing patterns with frequencies f_n = n c / (2L). Mode n has n antinodes and n - 1 interior nodes, and any motion of the string is a sum of these harmonics. The playground animates a chosen mode (or a superposition) in time, marking the nodes and antinodes, so the quantized set of allowed shapes and the evenly spaced harmonic ladder are explicit. This is the mechanical archetype for every boundary-value spectrum, from organ pipes to atomic orbitals. Reference: French, Vibrations and Waves.'
tags: [waves, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Standing waves on a fixed-end string

## Physical setup

A uniform string of length L is fixed at both ends. The normal modes of
small transverse oscillation are
  y_n(x, t) = sin(n pi x / L) cos(2 pi f_n t),  f_n = n c / (2 L).

Mode n has n antinodes and n - 1 interior nodes.

## Governing equations

Wave equation y_tt = c^2 y_xx with y(0, t) = y(L, t) = 0. Separation of
variables gives the modes above.

## Numerical method

None. Closed-form evaluation.

## Controls

- mode n: 1 to 5.
- speed: animation step.
- superpose 1 + 3: toggle a 1.0 sin(pi x) + 0.5 sin(3 pi x) superposition.
- Reset / Pause / Play.

## Expected qualitative features

1. Mode n: n antinodes (orange dots), n - 1 interior nodes + 2 endpoints.
2. Mode 1: smooth half-sine.
3. Mode 5: tight cushion with rapid oscillation.
4. Superposition 1 + 3: composite shape; the constituent modes are drawn
   faintly underneath.

## Invariants and acceptance thresholds

1. y(0, t) = y(L, t) = 0 for all t and n within 1e-12.
2. f_1 = c / (2 L) exact.
3. f_n = n f_1 exact.
4. Mode n has exactly n antinodes and n - 1 interior nodes.
5. Antinode positions x_k = (2 k - 1) L / (2 n).
6. Parity: y_n(L - x, t) = (-1)^(n - 1) y_n(x, t).

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- n = 1: fundamental, single half-sine.
- n large: rapid oscillation, requires fine spatial resolution.

## Visual fallback

Canvas2D only. String displayed horizontally with envelope (dashed) and
current displacement (solid). Antinode dots in orange, nodes as vertical
ticks, fixed-end pegs as white dots.

## Citations

- French, Vibrations and Waves Ch. 5 (`french-vibrations`).
- Crawford, Waves and Oscillations Ch. 2 (alternate).

## Stretch goals

- Mass-loaded string (point masses break degeneracy).
- Two-end-free or open-closed string variants.
- Audible playback of modes.

## Risk register

- Mode 5 at high speed can briefly alias the rendering if the display
  refresh rate is below 60 Hz; not an issue at default speed.
