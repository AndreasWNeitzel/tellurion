---
title: Transmission Line Impedance Matching
slug: transmission-line-impedance-matching
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2013
supporting_ucs: []
curriculum_year: bsc-y2s1
primary_citation: jackson1998
primary_chapter: 8
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
tags: [electromagnetism, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Transmission line impedance matching

## Physical setup

A coaxial transmission line of characteristic impedance $Z_0 = 50\,\Omega$ terminated by a resistive load $Z_L$. The forward and reflected voltage waves superpose into a standing pattern whose amplitude envelope depends on the mismatch.

## Governing equations

Reflection coefficient: $\Gamma = (Z_L - Z_0) / (Z_L + Z_0)$. VSWR: $(1 + |\Gamma|)/(1 - |\Gamma|)$. Power delivered: $1 - |\Gamma|^2$. Return loss (dB): $-20 \log_{10}|\Gamma|$.

Three special loads:
- $Z_L = Z_0$ (matched): $\Gamma = 0$, VSWR $= 1$, full power transfer.
- $Z_L \to \infty$ (open): $\Gamma \to 1$, VSWR $\to \infty$.
- $Z_L = 0$ (short): $\Gamma = -1$, VSWR $\to \infty$.

## Numerical method

Closed-form. The animation samples $V(x, t) = V_\text{inc}(\cos(\omega t - k x) + \Gamma \cos(\omega t + k x))$ at the rAF frame time; the dashed envelope is $|V(x)| = \sqrt{1 + \Gamma^2 + 2\Gamma\cos(2 k x)}$.

## Controls

- Load impedance $Z_L$ in ohms (1 to 500).

## Expected qualitative features

1. Matched load gives a flat envelope (uniform amplitude).
2. Open / short give a pure standing wave (envelope touches zero at the appropriate nodes).
3. Intermediate $Z_L$ gives a partial standing wave (envelope ripples between two nonzero levels).
4. VSWR readout grows from 1 (matched) toward infinity (open or short).

## Invariants and acceptance thresholds

| invariant | threshold | location |
| matched $Z_L = Z_0$: $\Gamma = 0$ | within $10^{-15}$ | invariants test |
| open $Z_L \to \infty$: $\Gamma \to 1$ | $> 0.999$ | invariants test |
| short $Z_L = 0$: $\Gamma = -1$ | within $10^{-15}$ | invariants test |
| VSWR $= 1$ at matched load | within $10^{-12}$ | invariants test |
| 100 Ohm into 50 Ohm: $|\Gamma| = 1/3$, VSWR $= 2$ | within $10^{-12}$ | invariants test |
| power balance $P_\text{deliv} + \Gamma^2 = 1$ | within $10^{-12}$ | invariants test |
| return-loss infinite at perfect match | exact | invariants test |
| return-loss for VSWR $= 2$ is $\approx 9.54$ dB | within 0.001 | invariants test |
| isMatched within 1 percent tolerance | exact | invariants test |

All confirmed in `invariants.test.mjs` (9 tests passing).

## Limiting cases for verification

- $Z_L = Z_0$: textbook matched-line condition.
- $Z_L = 0$ or $\infty$: textbook standing wave with nodes at quarter-wave distances.
- $Z_L = R \pm j X$ (not modeled here): would land off the real-axis Smith chart.

## Visual fallback

If KaTeX or Canvas2D is unavailable, the slider still works.

## Citations

- Jackson, *Classical Electrodynamics*, 3e, Ch. 8 (`jackson1998`).
- Pozar, *Microwave Engineering*, for the engineering Smith-chart variant.

## Stretch goals

- Complex $Z_L = R + jX$ with Smith-chart overlay.
- Add a quarter-wave transformer demo to match arbitrary loads to $Z_0$.
- Stub-tuner with sliding-short geometry.

## Risk register

- Pure-resistive loads only; the playground deliberately limits to real $Z_L$ to keep the visualization clean. The Smith-chart extension is a stretch goal.
