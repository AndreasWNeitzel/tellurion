---
title: Drake Equation Explorer
slug: drake-equation-explorer
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: MAA-AB
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: carroll-ostlie
primary_chapter: 7
hook: 'Multiply seven uncertain numbers and you estimate how many civilizations we could hear right now: the Drake equation, with the uncertainty made explicit.'
one_paragraph: 'The Drake equation multiplies a star-formation rate by a chain of fractions (planets, habitability, life, intelligence, communication, lifetime) to estimate the number of currently detectable civilizations in the Galaxy. The factors span many orders of magnitude and are deeply uncertain, so a single product is meaningless. The playground runs a 2000-trial Monte Carlo, drawing each factor log-uniformly around the slider settings, and shows the resulting distribution of N rather than one point estimate. It makes the spread, not the headline number, the real lesson. Reference: Drake 1961.'
tags: [exoplanets, animation, live-readout]
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
---

# Drake equation explorer

## Explainer

### What you are looking at

The Drake equation is not a prediction; it is a bookkeeping device
that turns the question "how many civilizations could we talk to" into
a product of seven factors you can argue about one at a time. The
playground lets you set each factor and watch the estimate swing over
many orders of magnitude, which is the real lesson.

### The equation

The number of communicating civilizations in the Galaxy is the chain
product

$$N = R_* \cdot f_p \cdot n_e \cdot f_l \cdot f_i \cdot f_c \cdot L,$$

reading left to right:

- $R_*$: the rate of suitable star formation (stars per year).
- $f_p$: the fraction of those stars with planets.
- $n_e$: the number of habitable planets per such system.
- $f_l$: the fraction of habitable planets where life starts.
- $f_i$: the fraction of those where intelligence arises.
- $f_c$: the fraction that develop detectable communication.
- $L$: how long, in years, such a civilization broadcasts.

The first three factors are now constrained by astronomy (Kepler and
radial-velocity surveys pinned $f_p$ near 1 and $n_e$ to order unity);
the last four are essentially unknown and span many decades each.

### Why the answer is a range, not a number

Because $N$ is a product, the total uncertainty is the product of the
individual uncertainties: multiply seven factors each uncertain by an
order of magnitude and $N$ is uncertain by many orders. The single
term that dominates the modern estimate is $L$: if civilizations last
decades, $N$ is tiny; if millennia, $N$ is large. The playground makes
this concrete by letting you drag each factor on a log scale and
watching $N$ slide from "we are alone" to "the Galaxy is crowded". The
value of the equation is not its output but the structure it imposes
on the debate.

### Things to try

- Hold the astronomically-known factors fixed and sweep only $L$:
  watch $N$ track it almost linearly (the dominant unknown).
- Set the biological factors pessimistically and watch $N$ collapse
  below 1 (the "rare Earth" regime).
- Note how a one-decade change in any single factor moves $N$ by a
  full decade: the multiplicative uncertainty.

### Where this comes from

The Drake equation and its factor decomposition follow Drake's 1961
formulation as presented in Shklovskii and Sagan, *Intelligent Life
in the Universe*, and the modern factor constraints in current
exoplanet-occurrence reviews.

## Physical setup

The Drake equation
$$N = R_\star \cdot f_p \cdot n_e \cdot f_l \cdot f_i \cdot f_c \cdot L$$
estimates the number of currently detectable civilizations in our galaxy. Each factor is a probability or rate. Sliders set the most uncertain factors; a 2000-trial Monte Carlo draws each factor log-uniformly within $\pm 0.5$ dex of the slider center and computes the resulting distribution of $N$.

## Numerical method

Closed-form Drake equation; Monte Carlo with the project's seeded RNG (`shared/js/render/rng.js`). 2000 trials per render. Histogram in 44 bins from $\log_{10}N = -10$ to $+12$.

## Controls

- $\log_{10} R_\star$ (-1 to 2; default 0.18, $R_\star \approx 1.5$/yr).
- $\log_{10} f_l$ (-6 to 0; default -0.3, $f_l = 0.5$).
- $\log_{10} f_i$ (-6 to 0; default -1, $f_i = 0.1$).
- $\log_{10} L$ (2 to 9 yr; default 4, $L = 10^4$ yr).

## Expected qualitative features

1. Default sliders yield $N \approx 30$ (point estimate).
2. The MC median across 2000 trials sits within a factor of a few of the point estimate.
3. Reducing $f_i$ or $L$ collapses $N$ below 1.
4. The Fermi paradox is the gap between the optimistic central value and our observed null detections.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| canonical default $N$ = 30 exact | within $10^{-6}$ | invariants test |
| any factor zero gives $N$ = 0 | exact | invariants test |
| doubling $L$ doubles $N$ | within $10^{-12}$ | invariants test |
| Monte Carlo returns positive array of correct length | strict | invariants test |
| DRAKE_LABELS has all 7 factors | exact | invariants test |
| Monte Carlo spans many decades for wide ranges | factor $>1000$ | invariants test |

All confirmed in `invariants.test.mjs` (7 tests passing).

## Limiting cases for verification

- All factors at canonical Carroll-Ostlie: $N = 30$.
- Pessimistic $f_i = 10^{-6}$: $N$ drops below 1 even with optimistic other factors.
- Optimistic $L = 10^9$: $N$ jumps by 5 dex above the central estimate.

## Visual fallback

If KaTeX or Canvas2D is unavailable, sliders still operate.

## Citations

- Carroll-Ostlie, *An Introduction to Modern Astrophysics*, 2e, Ch. 7.
- Drake, F. 1961: original Green Bank meeting formulation.

## Stretch goals

- Allow per-factor distribution shape (uniform vs log-normal vs delta).
- Couple to the habitable-zone playground: $n_e$ derived from the HZ width.
- Time evolution: $L$ as a function of cosmic time.

## Risk register

- The Monte Carlo redraws on every rAF frame with the same seed, so it is deterministic. Increasing the trial count is cheap.
