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
---

# Drake equation explorer

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

- Carroll-Ostlie, *An Introduction to Modern Astrophysics*, 2e, Ch. 7 (`carroll-ostlie`).
- Drake, F. 1961: original Green Bank meeting formulation.

## Stretch goals

- Allow per-factor distribution shape (uniform vs log-normal vs delta).
- Couple to the habitable-zone playground: $n_e$ derived from the HZ width.
- Time evolution: $L$ as a function of cosmic time.

## Risk register

- The Monte Carlo redraws on every rAF frame with the same seed, so it is deterministic. Increasing the trial count is cheap.
