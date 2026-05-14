---
title: Matter-Radiation Equality
slug: matter-radiation-equality
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: MAA-CS
supporting_ucs: [AST3017]
curriculum_year: msc-y1
primary_citation: liddle-cosmology
primary_chapter: 4
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
tags: [cosmology, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Matter, radiation, and dark energy: equality and dominance

## Physical setup

A flat Friedmann universe with three energy components: matter ($\rho_m \propto a^{-3}$), radiation ($\rho_r \propto a^{-4}$), and a cosmological constant ($\rho_\Lambda$ = const). The playground plots all three on a log-log scale against the scale factor $a$ (today $a = 1$) and marks the matter-radiation equality at $a_\text{eq} = \Omega_r / \Omega_m$.

## Governing equations

Equality: $\rho_m(a_\text{eq}) = \rho_r(a_\text{eq})$ gives $a_\text{eq} = \Omega_r / \Omega_m$ and $1 + z_\text{eq} = \Omega_m / \Omega_r$. For standard LCDM ($\Omega_m = 0.315$, $\Omega_r = 9.24 \times 10^{-5}$), $z_\text{eq} \approx 3410$ and $a_\text{eq} \approx 2.9 \times 10^{-4}$.

Hubble parameter for a flat universe:
$$H(a)/H_0 = \sqrt{\Omega_r a^{-4} + \Omega_m a^{-3} + \Omega_\Lambda}.$$

## Numerical method

Closed-form. The plot samples each density at 200 logarithmically-spaced scale factors from $10^{-8}$ to $10^2$.

## Controls

- $\Omega_m$ (0.05 to 0.60). Sets $\Omega_\Lambda = 1 - \Omega_m - \Omega_r$.
- $\Omega_r$ ($10^{-5}$ to $5 \times 10^{-4}$).

## Expected qualitative features

1. Three log-linear lines with slopes $-4$ (radiation), $-3$ (matter), and $0$ (Lambda).
2. Vertical dashed line at $a_\text{eq}$.
3. Vertical dotted line at $a = 1$ (today).
4. Decreasing $\Omega_r$ shifts $a_\text{eq}$ leftward (later in cosmic history radiation dominated for shorter).

## Invariants and acceptance thresholds

| invariant | threshold | location |
| $\rho_m / \rho_r = a / a_\text{eq}$ | within $10^{-12}$ | invariants test |
| $z_\text{eq}$ for LCDM in (3300, 3500) | strict | invariants test |
| $H/H_0 = 1$ today (flat) | within $10^{-12}$ | invariants test |
| $H/H_0 \to \sqrt{\Omega_r} / a^2$ at small $a$ | within 1 percent | invariants test |
| $H/H_0 \to \sqrt{\Omega_\Lambda}$ at large $a$ | within $10^{-6}$ relative | invariants test |
| at $a = a_\text{eq}$, $\rho_m = \rho_r$ | within $10^{-12}$ | invariants test |
| Lambda dominates over matter today | strict | invariants test |

All confirmed in `invariants.test.mjs` (7 tests passing).

## Limiting cases for verification

- $\Omega_r \to 0$: no radiation era, $a_\text{eq} \to 0$.
- $\Omega_m \to 0$ (Lambda-dominated): no matter era.
- $\Omega_m + \Omega_r > 1$: $\Omega_\Lambda < 0$; unphysical for late acceleration but mathematically the curves still compute. Slider keeps $\Omega_m \le 0.6$ and $\Omega_r \le 5 \times 10^{-4}$ so $\Omega_\Lambda \gtrsim 0.4$ always.

## Visual fallback

If KaTeX or Canvas2D is unavailable, sliders still operate.

## Citations

- Liddle, *An Introduction to Modern Cosmology*, 3e, Ch. 4 (`liddle-cosmology`).
- Mukhanov, *Physical Foundations of Cosmology*, Ch. 1 (`mukhanov-cosmology`) for the rigorous derivation.

## Stretch goals

- Add curvature $\Omega_k$ (open / closed universes).
- Integrate the Friedmann equation forward in time and plot $a(t)$.
- Show the speed-of-sound horizon (for BAO physics).

## Risk register

- The Lambda line at $\Omega_\Lambda \to 0$ falls off the plot bottom; visually flagged by the legend but no explicit warning.
