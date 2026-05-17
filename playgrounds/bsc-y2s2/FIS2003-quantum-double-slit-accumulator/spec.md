---
title: Quantum Double Slit, One Particle at a Time
slug: quantum-double-slit-accumulator
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Each particle lands as one random dot, yet ten thousand of them paint the interference fringes; switch on the which-path detector and the pattern dissolves.'
one_paragraph: 'Particles arrive at the screen one at a time, each a single dot whose position is drawn by the Born rule from the far-field probability density. Individually random, together they accumulate into the double-slit interference fringes of spacing lambda L / d under the single-slit envelope. A which-path detector continuously erases the fringes as it is turned up: full which-path information leaves only the envelope. The primary scene is the physical detection screen building the pattern dot by dot; the side panel is the running histogram against the analytic |psi|^2 with the live visibility. The headless sim.js is gate-tested for the fringe spacing, the visibility going from 1 to 0 with the detector, Born-rule convergence (KS), the envelope zeros, the symmetry, and the lambda/L/d scaling.'
tags: [quantum, interference, stochastic, animation, multi-panel, live-readout]
difficulty: 4
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 5
curriculum_year: 'L:F-2Y-2S'
primary_uc: FIS2003
share_state_keys: []
---

# Quantum Double Slit, One Particle at a Time

## Physical setup

A source emits particles one at a time toward a barrier with two
slits; each is detected as a single localised dot on a screen. An
optional which-path detector at the slits records which path was
taken.

## Governing equations

The far-field probability density is the single-slit envelope times
the two-slit fringe term, modulated by the which-path coherence
`gamma` in `[0, 1]`:

`P(y) ~ sinc^2(pi a y / (lambda L)) (1 + gamma cos(2 pi d y / (lambda L)))`.

`gamma = 1` (detector off) gives full-visibility fringes of spacing
`dy = lambda L / d`; `gamma = 0` (full which-path) erases them,
leaving the envelope. Each detection is an independent draw from
`P(y)` (the Born rule).

## Numerical method

A seeded inverse-CDF sampler draws screen positions from the
normalised `P(y)`; the dots accumulate deterministically (fixed seed,
so the capture is reproducible). The analytic `P(y)` and the
binning-free CDF are computed by trapezoidal integration. Reference:
Eisberg and Resnick, *Quantum Physics of Atoms* (2nd ed.), Ch. 3
and 5 (`eisberg-resnick`).

## Controls

- which-path detector (0 = off to 1 = full): erases the fringes.
- slit separation d: sets the fringe spacing.
- wavelength: sets the fringe and envelope scale.
- Reset, Pause.

## Expected qualitative features

- Single dots look random; thousands build the fringe pattern.
- Detector off: sharp fringes, visibility 1; detector full: no
  fringes, only the envelope, visibility 0.
- Wider slit separation packs the fringes closer; longer wavelength
  spreads them.
- The running histogram tracks the analytic `|psi|^2`.

## Invariants and acceptance thresholds

- Fringe spacing (zero-to-zero, envelope-bias-free) `= lambda L / d`
  within 1%.
- Visibility `> 0.98` at `gamma = 1`, `< 0.02` at `gamma = 0`,
  monotone, `V ~ gamma` within 0.05.
- Born sampling: KS statistic vs the analytic CDF `< 0.02` at
  N = 60000; identical for the same seed, different across seeds.
- The single-slit envelope vanishes at `y = m lambda L / a`.
- `P(y)` is symmetric with a central maximum.
- Fringe spacing scales linearly in `lambda` and `L`, inversely in
  `d`.

## Limiting cases for verification

- `gamma = 0`: the fringe term is constant, only the envelope remains.
- Large N: the empirical distribution converges to `|psi|^2`.

Source: Eisberg and Resnick, *Quantum Physics of Atoms* (2nd ed.),
Ch. 3 and 5 (`eisberg-resnick`).
