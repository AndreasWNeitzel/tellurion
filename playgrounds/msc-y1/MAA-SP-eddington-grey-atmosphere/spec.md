---
title: Eddington Grey Atmosphere
slug: eddington-grey-atmosphere
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: MAA-SP
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: hansen-kawaler
primary_chapter: 3
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
tags: [stellar, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Eddington grey atmosphere

## Physical setup

A grey (frequency-independent opacity) stellar atmosphere in radiative equilibrium. The temperature profile follows
$$T(\tau) = T_\text{eff} \left[\tfrac{3}{4} (\tau + \tfrac{2}{3})\right]^{1/4}.$$

The Eddington-Barbier limb darkening for a linear source function is $I(\mu)/I(1) = 0.4 + 0.6 \mu$ with $\mu = \cos\theta$ the cosine of the emission angle.

## Numerical method

Closed-form. Left panel plots $T(\tau)$ over $\tau \in [0, 5]$ with the photosphere marked at $\tau = 2/3$. Right panel renders the solar-disk limb darkening as a radial color gradient.

## Controls

- $T_\text{eff}$ from 2500 to 10000 K.

## Expected qualitative features

1. Photosphere at $\tau = 2/3$ where $T = T_\text{eff}$ exactly.
2. Boundary at $\tau = 0$: $T = T_\text{eff} / \sqrt[4]{2} \approx 0.841 T_\text{eff}$.
3. Asymptotic interior: $T \to T_\text{eff} (3\tau/4)^{1/4}$.
4. Solar disk visibly darker at the limb than at the center.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| $T(2/3) = T_\text{eff}$ | within $10^{-9}$ | invariants test |
| $T(0) = T_\text{eff} (1/2)^{1/4}$ | within $10^{-9}$ | invariants test |
| $T(100) \to T_\text{eff} (3 \cdot 100 / 4)^{1/4}$ | within 1 percent | invariants test |
| $T$ monotonic increasing in $\tau$ | strict | invariants test |
| limb $I(1) = 1$ exact | within $10^{-12}$ | invariants test |
| limb $I(0) = 0.4$ exact | within $10^{-12}$ | invariants test |
| limb monotonic in $\mu$ | strict | invariants test |
| photosphere $\tau$ equals $2/3$ | exact | invariants test |

All confirmed in `invariants.test.mjs` (8 tests passing).

## Limiting cases for verification

- $T_\text{eff} = T_\odot = 5778$ K: photosphere at $T = T_\odot$.
- $\tau \to \infty$: $T$ grows as $\tau^{1/4}$.
- $\mu = 1$ (disk center): full brightness; $\mu = 0$ (limb): 40 percent brightness.

## Visual fallback

If KaTeX or Canvas2D is unavailable, the slider still operates.

## Citations

- Hansen-Kawaler-Trimble, *Stellar Interiors*, 2e, Ch. 3 (`hansen-kawaler`).
- Mihalas, *Stellar Atmospheres*, for the rigorous Eddington-Barbier derivation.

## Stretch goals

- Non-grey opacity: depart from the universal Eddington T(tau).
- Allow specifying limb-darkening coefficients (linear, quadratic, four-parameter Claret).
- Coupled atmosphere + stellar interior model.

## Risk register

- The right-panel disk uses a coarse RGB approximation for the limb-darkening color; the readout reports the canonical 0.4 ratio.
