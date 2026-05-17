---
title: Rectangular Waveguide Modes
slug: waveguide-mode-animator
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Drop below the cutoff and the wave simply stops dead in the pipe: no propagation, only an evanescent skin.'
one_paragraph: 'A hollow rectangular waveguide carries only discrete TE and TM modes. Each has a cutoff frequency f_c = (c/2) sqrt((m/a)^2 + (n/b)^2); above it the mode propagates at the guide wavelength lambda_g = 2 pi / beta (longer than free space), below it beta is imaginary and the field is evanescent, carrying no power. The primary scene is physical: the transverse field map of the chosen mode in the a x b cross-section and a longitudinal strip showing the wave travelling down the guide or decaying when below cutoff. The side panel is the mode-cutoff spectrum with the operating frequency, so single-mode operation is visible. The headless sim.js is gate-tested for the cutoff formula, TE10 dominance, the propagating/evanescent transition, the guide-wavelength divergence, the TE/TM existence rules, and the wall boundary conditions.'
tags: [electromagnetism, waveguide, multi-panel, live-readout]
difficulty: 3
tier: advanced
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
curriculum_year: 'L:F-2Y-2S'
primary_uc: FIS2006
share_state_keys: []
---

# Rectangular Waveguide Modes

## Physical setup

A hollow rectangular metallic waveguide of width a and height b
(vacuum filled), excited in a chosen TE or TM mode at a variable
frequency.

## Governing equations

Cutoff frequency `f_c = (c/2) sqrt((m/a)^2 + (n/b)^2)`. Above cutoff
the propagation constant `beta = (2 pi/c) sqrt(f^2 - f_c^2)` is real
and the guide wavelength `lambda_g = 2 pi / beta` exceeds the
free-space wavelength; below cutoff `beta` is imaginary, the field
decaying as `exp(-alpha z)` with `alpha = sqrt(k_c^2 - k_0^2)`. TE
modes need `(m, n)` not both zero; TM modes need `m >= 1` and
`n >= 1`. For `a > b` the dominant (lowest-cutoff) mode is TE10.

## Numerical method

Closed-form cutoff, propagation and field expressions; the
cross-section map samples the modal field on a grid (diverging
colour, animated by `cos(omega t)`), the longitudinal strip draws a
travelling wave at `lambda_g` or an evanescent envelope. Reference:
Jackson, *Classical Electrodynamics* (3rd ed.), Ch. 8
(`jackson1998`).

## Controls

- mode: TE10, TE20, TE01, TE11, TE21, TM11, TM21.
- frequency (GHz): sweeps through the cutoffs.
- broad wall a (mm): rescales every cutoff.
- Reset, Pause.

## Expected qualitative features

- TE10 is a single half-sine across the broad wall, uniform in height.
- Above cutoff the longitudinal strip is a travelling wave; below
  cutoff it is a non-propagating decaying envelope.
- The spectrum panel marks each mode cutoff and the operating
  frequency, showing the single-mode band.
- Widening `a` lowers every cutoff; a narrow guide cuts modes off.

## Invariants and acceptance thresholds

- `f_c` matches the closed form within 0.1%; WR-90 TE10 ~6.557 GHz.
- TE10 is the dominant mode for `a > b`; `f_c(TE20) = 2 f_c(TE10)`.
- Propagating with `beta > 0` above cutoff, evanescent with
  `alpha > 0` below, `beta = 0` at cutoff; `alpha` grows further
  below.
- `lambda_g > lambda_0`, diverging as `f -> f_c`.
- TM needs `m, n >= 1`; TE excludes `(0, 0)`; the lowest TM is TM11.
- Modal fields vanish on the conducting walls.

## Limiting cases for verification

- `f -> f_c+`: `lambda_g -> infinity`, `beta -> 0`.
- Square guide: `TEm0` and `TE0m` become degenerate.

Source: Jackson, *Classical Electrodynamics* (3rd ed.), Ch. 8
(`jackson1998`).
