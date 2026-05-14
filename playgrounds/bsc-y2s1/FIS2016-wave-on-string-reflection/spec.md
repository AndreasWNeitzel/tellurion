---
title: Wave on a String: Fixed vs Free End Reflection
slug: wave-on-string-reflection
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2016
supporting_ucs: []
curriculum_year: bsc-y2s1
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
tags: [waves, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Wave on a string: fixed vs free-end reflection

## Physical setup

Two parallel 1D strings of length L = 4 with c = 1, each with a Gaussian
pulse launched moving rightward. Top string: fixed ends (y = 0 at both
boundaries). Bottom string: free ends (y_x = 0 boundary, i.e. the
neighbor mirrors at the boundary). Pulse reflects when it reaches each
boundary.

## Governing equations

Wave equation y_tt = c^2 y_xx, discretized by the three-point stencil
  y_new = 2 y - y_old + (c dt / dx)^2 (y_{i+1} - 2 y_i + y_{i-1}).
CFL: c dt / dx <= 1.

## Numerical method

Explicit FD with 200 grid points; c dt / dx = 0.5 (safe).

## Controls

- speed: steps per render frame.
- Reset / Pause / Play.

## Expected qualitative features

1. Pulse propagates rightward at c = 1.
2. Fixed-end: at right boundary, pulse inverts (downward bump returns).
3. Free-end: at right boundary, pulse preserves sign (upward bump
   returns).
4. Both pulses re-reflect off the left boundary the same way.

## Invariants and acceptance thresholds

1. Fixed-end: y(0) = y(L) = 0 throughout (1e-12).
2. Free-end: y(0) = y(1) and y(L) = y(L-1) throughout (1e-12).
3. After right-boundary hit (fixed): peak amplitude negative.
4. After right-boundary hit (free): peak amplitude positive.
5. CFL satisfied.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- Single-end fixed and other free: hybrid behavior.
- Damped wave: pulses decay; reflection rules still hold qualitatively.

## Visual fallback

Canvas2D only. Two stacked panels, each showing one boundary type with
its current pulse profile.

## Citations

- French, Vibrations and Waves Ch. 7 (`french-vibrations`).
- Crawford, Waves and Oscillations Ch. 2.

## Stretch goals

- Mixed boundaries (one fixed, one free).
- Impedance-matched termination (no reflection).
- Cylindrical or spherical wave equivalents.

## Risk register

- Initial yOld is set so the pulse moves rightward; if reversed, the
  pulse would head left and the demo would be confusing.
