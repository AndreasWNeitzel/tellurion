---
title: "Wave on a String: Fixed vs Free End Reflection"
slug: wave-on-string-reflection
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2016
primary_citation: ashcroft-mermin
supporting_ucs: []
curriculum_year: bsc-y2s1
hook: 'Send a pulse down a string: it flips upside-down when it hits a clamped end, and bounces back upright from a free one.'
one_paragraph: 'A travelling pulse reflects when it reaches a boundary, and the boundary condition sets its sign. A fixed end (y = 0) forces an inverted reflection; a free end (zero slope) reflects it upright. The playground launches the same Gaussian pulse on two strings, one with fixed ends and one with free ends, so you watch them reflect side by side and see the inversion appear only on the clamped string. This is the same sign rule that sets the half-wave phase change on optical reflection and the open-versus-closed-pipe harmonics. Reference: French, Vibrations and Waves.'
tags: [waves, animation, live-readout]
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
references:
  - "Ashcroft, Mermin, Solid State Physics."
---

# Wave on a string: fixed vs free-end reflection

## Explainer

### What you are looking at

A pulse running down a string bounces off the end, but how it bounces
depends entirely on what the end is attached to. A fixed end flips the
pulse upside down; a free end reflects it upright. The playground runs
both cases on parallel strings so the difference is unmistakable.

### The wave and its boundary conditions

Each string carries the 1D wave equation
$\partial_t^2 y = c^2\,\partial_x^2 y$, so a pulse travels
undistorted at speed $c$. What happens at the end is set by the
boundary condition there:

- Fixed end: the displacement must stay zero, $y(L,t)=0$. The only
  way an incoming pulse $f(x-ct)$ can keep the end pinned is if a
  reflected, inverted, reversed pulse $-f(\,-x-ct)$ is added. The
  pulse comes back upside down (reflection coefficient $-1$, a
  $\pi$ phase flip).
- Free end: the slope must vanish, $\partial_x y(L,t)=0$ (nothing
  resists transverse motion). The matching reflected pulse is
  upright (reflection coefficient $+1$, no phase flip), and the end
  briefly swings to twice the pulse amplitude.

### Why it matters

This sign is the whole story behind standing waves and resonance: a
fixed-fixed string forces a node at each end (hence $f_n=n c/2L$,
the harmonic series of a guitar), while a fixed-free pipe (like a
clarinet) forces a node at one end and an antinode at the other,
giving only odd harmonics $f_n=(2n-1)c/4L$. The same hard-vs-soft
boundary logic governs impedance mismatch on transmission lines and
optical reflection off denser vs rarer media (the half-wave loss).
The playground sends identical pulses into a fixed and a free end so
you watch the inversion appear on one and not the other.

### Things to try

- Send a pulse at the fixed end and watch it return inverted (the
  $\pi$ phase flip).
- Send the same pulse at the free end and watch it return upright,
  with the end overshooting to ~2x amplitude.
- Let pulses reflect repeatedly and see the fixed-end string build a
  node-ended standing pattern.

### Where this comes from

Reflection at fixed and free boundaries, the reflection coefficient,
and the resulting harmonic series follow French, *Vibrations and
Waves*, Chapter 7, and Crawford, *Waves* (Berkeley Physics Course,
Vol. 3).

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

- French, Vibrations and Waves Ch. 7.
- Crawford, Waves and Oscillations Ch. 2.

## Stretch goals

- Mixed boundaries (one fixed, one free).
- Impedance-matched termination (no reflection).
- Cylindrical or spherical wave equivalents.

## Risk register

- Initial yOld is set so the pulse moves rightward; if reversed, the
  pulse would head left and the demo would be confusing.
