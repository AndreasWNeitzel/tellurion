---
title: Floating-Point Precision Pitfalls
slug: floating-point-precision-pitfalls
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: CC1017
supporting_ucs: [FIS2018]
curriculum_year: bsc-y1s1
primary_citation: newman2013
primary_chapter: 4
---

# Catastrophic cancellation in 1 - cos(x)

## Physical setup

A pure-numerical playground that contrasts two algebraically identical formulae for $1 - \cos(x)$:

- Naive: `Math.cos(x)` is computed in full IEEE-754 double, then subtracted from `1`. For $x \ll 1$, $\cos(x) \approx 1 - x^2/2$ rounds to within machine epsilon of 1 and the subtraction loses almost all significant digits ("catastrophic cancellation").
- Stable: $1 - \cos(x) = 2 \sin^2(x/2)$ computes the small quantity directly via the half-angle identity, with no near-equal subtraction.

## Governing equations

$$1 - \cos x = 2 \sin^2(x/2).$$

For $x = 10^{-8}$, naive returns $\sim 4.9 \times 10^{-17}$ instead of the exact $5 \times 10^{-17}$, an error of order 2 percent. For $x = 10^{-10}$, naive returns 0 while the true value is $5 \times 10^{-21}$.

## Numerical method

Closed-form. The plot samples 400 logarithmically-spaced points from $10^{-16}$ to $1$ for both formulae and plots the relative error against a truncated Taylor reference ($x^2/2 - x^4/24$).

## Controls

- $\log_{10}(x)$ slider from $-16$ to $0$.

## Expected qualitative features

1. The stable curve stays near machine epsilon ($\sim 10^{-16}$) across the full $x$ range.
2. The naive curve climbs from machine epsilon (at $x \sim 1$) up to nearly 100 percent error around $x = 10^{-15}$.
3. The slope of the naive error is $\sim x^{-1}$ until it saturates at the no-significant-digits floor.
4. The crossover at $x \sim \sqrt{\epsilon_\text{mach}} = 10^{-8}$ is the rule of thumb for when cancellation begins to matter.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| naive vs stable agreement at $x = 1$ | within $10^{-14}$ relative | invariants test |
| stable accurate at $x = 10^{-8}$ | rel err $< 10^{-12}$ vs Taylor | invariants test |
| naive inaccurate at $x = 10^{-8}$ | rel err $> 10^{-3}$ | invariants test |
| naive returns 0 at $x = 10^{-15}$ | exact | invariants test |
| stable positive at $x = 10^{-15}$ | $> 0$, $< 10^{-29}$ | invariants test |
| quadratic naive vs stable diverge on small root | rel err naive $> 10^{-4}$, stable $< 10^{-10}$ | invariants test |
| both formulae return 0 at $x = 0$ | exact | invariants test |

All confirmed in `invariants.test.mjs` (7 tests passing).

## Limiting cases for verification

- $x \to 1$: cancellation is irrelevant; both formulae agree to machine epsilon.
- $x \to 0$: stable hits the smallest-positive double normally; naive truncates to zero.
- Reformulation rule: always rewrite $a - b$ when $a \approx b$ if you can.

## Visual fallback

If KaTeX or Canvas2D is unavailable, the figure caption still reads as a paper sentence.

## Citations

- Newman, *Computational Physics*, Ch. 4 (`newman2013`).
- Goldberg, "What every computer scientist should know about floating-point arithmetic," ACM Computing Surveys 23 (1991), is the canonical reference.

## Stretch goals

- Add quadratic-formula visualizer side panel.
- Show subtractive-cancellation cliff in derivatives via finite differences.
- Toggle to single precision to demonstrate the cliff at $\sqrt{\epsilon_\text{single}} \sim 3 \times 10^{-4}$.

## Risk register

- The Taylor reference $x^2/2 - x^4/24$ is good to many digits for $x \le 1$ but loses precision at $x = 1$; tolerance is set conservatively.
