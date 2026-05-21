---
title: Quantum Double Slit, One Particle at a Time
slug: quantum-double-slit-accumulator
status: superseded
superseded_by: slit-experiment-legend-3d
audience: portfolio
created: 2026-05-17
hook: 'Each particle lands as one random dot, yet ten thousand of them paint the interference fringes; switch on the which-path detector and the pattern dissolves.'
one_paragraph: 'Particles arrive at the screen one at a time, each a single dot whose position is drawn by the Born rule from the far-field probability density. Individually random, together they accumulate into the double-slit interference fringes of spacing lambda L / d under the single-slit envelope. A which-path detector continuously erases the fringes as it is turned up: full which-path information leaves only the envelope. The primary scene is the physical detection screen building the pattern dot by dot; the side panel is the running histogram against the analytic |psi|^2 with the live visibility. Reference: Eisberg and Resnick, Quantum Physics of Atoms, 2nd ed., Chapters 3 and 5; Feynman Lectures on Physics, Volume III, Chapter 1.'
tags: [quantum, interference, stochastic, animation, multi-panel, live-readout]
difficulty: 4
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 5
curriculum_year: 'L:F-2Y-2S'
primary_uc: FIS2003
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

# Quantum Double Slit, One Particle at a Time

## Explainer

### What you are looking at

Fire particles at a double slit one at a time. Each lands as a single
random dot, so a few look like noise. Let thousands accumulate and an
interference pattern emerges, even though every particle went through
alone. Turn on a detector that records which slit was used and the
pattern dissolves. This is the heart of quantum mechanics.

### The Born rule and the pattern

A particle has no definite landing spot; quantum mechanics gives only
a probability density $P(y)=|\psi(y)|^2$ on the screen. The far-field
density is a single-slit envelope times a two-slit fringe term,
damped by a which-path coherence $\gamma\in[0,1]$:

$$P(y)\;\propto\;\operatorname{sinc}^2\!\Big(\frac{\pi a y}{\lambda L}\Big)
  \Big(1+\gamma\cos\frac{2\pi d y}{\lambda L}\Big),$$

with slit width $a$, slit separation $d$, wavelength $\lambda$ and
slit-to-screen distance $L$. Each dot is one independent draw from
$P(y)$ (the Born rule); the histogram of many dots converges to
$P(y)$.

### Complementarity

With the detector off, $\gamma=1$: full-visibility fringes spaced by

$$\Delta y=\frac{\lambda L}{d}.$$

Turn the detector up and $\gamma\to 0$: the cosine term washes out and
only the broad single-slit envelope remains. Knowing the path destroys
the interference. Path information and fringe visibility are
complementary; you cannot have both.

### Things to try

- Let a few dots land (looks random), then thousands (fringes appear).
- Slide the which-path detector from 0 to 1 and watch the visibility
  fall from one to zero.
- Increase the slit separation and see the fringes pack closer as
  $\lambda L/d$.

### Where this comes from

The Born rule, the two-slit density and complementarity follow Eisberg
and Resnick, Quantum Physics of Atoms, 2nd ed., Chapters 3 and 5, and
the Feynman Lectures on Physics, Volume III, Chapter 1.

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
