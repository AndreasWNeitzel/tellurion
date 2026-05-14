---
title: Saha-Boltzmann Hydrogen Ionization
slug: saha-boltzmann-ionization
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: AST2004
supporting_ucs: [MAA-SP]
curriculum_year: bsc-y2s1
primary_citation: carroll-ostlie
primary_chapter: 8
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
tags: [stellar, exoplanets, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Saha-Boltzmann hydrogen ionization

## Physical setup

Pure-hydrogen plasma in local thermodynamic equilibrium. Charge balance ($n_e = n_+$) and total nucleon conservation ($n_\text{tot} = n_+ + n_0$) plus the Saha equation give a closed-form quadratic for the ionization fraction $x = n_+ / n_\text{tot}$:

$$x^2 / (1 - x) = \mathrm{Saha}(T) / n_\text{tot}.$$

The Saha factor is

$$\mathrm{Saha}(T) = \frac{2 Z_+}{Z_0} \left(\frac{2 \pi m_e k_B T}{h^2}\right)^{3/2} \exp\left(-\frac{\chi}{k_B T}\right),$$

with $\chi = 13.6$ eV and $Z_+/Z_0 = 1/2$ for hydrogen.

## Governing equations

Solving the quadratic: $x = (-R + \sqrt{R^2 + 4 R})/2$ where $R = \mathrm{Saha}(T)/n_\text{tot}$. In the limit $R \ll 1$, $x \to \sqrt{R}$ (Boltzmann tail). In the limit $R \gg 1$, $x \to 1$ (fully ionized). The half-ionization temperature $T_\text{ion}$ (where $x = 0.5$) is roughly $0.05 \, \chi / k_B$ for stellar-photosphere densities, much lower than the naive $\chi/k_B = 158000$ K because the phase-space prefactor $T^{3/2}/n$ favours dissociation.

## Numerical method

Closed-form for $x$ given $T$ and $n$. $T_\text{ion}$ is found by bisection (80 iterations, tolerance 1 K).

## Controls

- $\log_{10}(n_\text{tot} / \mathrm{m}^{-3})$ from 18 (low corona) to 28 (sub-stellar core).
- Temperature $T$ from 2000 to 100000 K.

## Expected qualitative features

1. $x(T)$ is monotonic increasing.
2. The crossover from $x \ll 1$ to $x \approx 1$ happens within a factor 2-3 in $T$ around $T_\text{ion}$.
3. Increasing $n$ shifts $T_\text{ion}$ upward (the density penalty from $R \propto 1/n$).
4. At solar photosphere ($n \sim 10^{23}$ m$^{-3}$, $T = 5800$ K), $x \sim 10^{-4}$; the photosphere is mostly neutral.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| $x(T, n)$ monotonic in $T$ | strict | invariants test |
| high $T$ gives $x > 0.99$ | strict | invariants test |
| low $T$ gives $x < 10^{-3}$ | strict | invariants test |
| quadratic identity $x^2 + R x - R = 0$ exact | within $10^{-12} \cdot \max(1, R)$ | invariants test |
| bisection finds $T_\text{ion}$ with $x \approx 0.5$ | within 0.005 | invariants test |
| higher $n$ shifts $T_\text{ion}$ upward | strict | invariants test |
| Saha ratio grows by $10^{10}$ from 5000 K to 20000 K | strict | invariants test |
| solar-photosphere $T_\text{ion}$ in (7000, 20000) K | strict | invariants test |

All confirmed in `invariants.test.mjs` (8 tests passing).

## Limiting cases for verification

- $T \to 0$: $x \to 0$, exponential suppression.
- $T \to \infty$: $x \to 1$, fully ionized.
- $n \to 0$: any photon ionizes; $x$ saturates at any T with enough photons.

## Visual fallback

If KaTeX or Canvas2D is unavailable, sliders still control the readout.

## Citations

- Carroll-Ostlie, *An Introduction to Modern Astrophysics*, 2e, Ch. 8 (`carroll-ostlie`).
- Hansen-Kawaler-Trimble, *Stellar Interiors*, 2e, Ch. 3 (`hansen-kawaler`) for the stellar-atmosphere chemical mixture.

## Stretch goals

- Multi-species Saha (hydrogen + helium + metals).
- Departures from LTE (NLTE rates).
- Coupled to the Stark broadening of the Balmer lines to show hydrogen disappears from spectra above $T \sim 10000$ K.

## Risk register

- The bisection range (1000-1000000 K) might miss $T_\text{ion}$ outside this band for extreme densities; defaults are chosen to keep $T_\text{ion}$ inside the slider range.
