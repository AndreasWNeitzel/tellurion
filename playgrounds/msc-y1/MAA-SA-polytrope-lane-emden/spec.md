---
title: Lane-Emden Polytrope
slug: polytrope-lane-emden
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: MAA-SA
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: hansen-kawaler
primary_chapter: 7
---

# Lane-Emden polytrope

## Physical setup

A self-gravitating sphere with equation of state $P = K \rho^{1 + 1/n}$. The dimensionless density profile $\theta(\xi) = (\rho/\rho_c)^{1/n}$ satisfies the Lane-Emden equation

$$\frac{d^2\theta}{d\xi^2} + \frac{2}{\xi} \frac{d\theta}{d\xi} + \theta^n = 0$$

with $\theta(0) = 1$, $\theta'(0) = 0$. The first zero $\xi_1$ marks the stellar surface.

## Governing equations

Closed-form solutions:
- $n = 0$: $\theta = 1 - \xi^2/6$, $\xi_1 = \sqrt{6}$.
- $n = 1$: $\theta = \sin\xi / \xi$, $\xi_1 = \pi$.
- $n = 5$: $\theta = 1/\sqrt{1 + \xi^2/3}$, $\xi_1 = \infty$ (infinite-radius limit; total mass finite).

Numerical solutions for arbitrary $n$. Two stellar-physics standards:
- $n = 1.5$: degenerate non-relativistic gas (low-mass MS, brown dwarfs), $\xi_1 \approx 3.6537$.
- $n = 3$: ultra-relativistic degenerate gas (Chandrasekhar-limit WD), $\xi_1 \approx 6.8969$.

## Numerical method

RK4 with $d\xi = 10^{-3}$, special-cased small-$\xi$ Taylor series to avoid the $1/\xi$ singularity. Trajectory truncates at the first zero crossing.

## Controls

- Polytropic index $n$ (dropdown selector: 0, 1, 1.5, 3, 5).

## Expected qualitative features

1. All curves start at $\theta = 1$ with zero slope and decrease.
2. The selected $n$ is bolded; other indices are drawn faded for context.
3. $\xi_1$ marker drops the dashed accent line at the surface.
4. $n = 5$ never crosses zero in the plotted range.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| $n = 0$: $\xi_1 = \sqrt{6}$ | within 1 percent | invariants test |
| $n = 1$: $\xi_1 = \pi$ | within 1 percent | invariants test |
| $n = 1.5$: $\xi_1 \approx 3.654$ | within 1 percent | invariants test |
| $n = 3$: $\xi_1 \approx 6.897$ | within 1 percent | invariants test |
| analytic $n = 0$: $\theta = 1 - \xi^2/6$ exact | within $10^{-15}$ | invariants test |
| analytic $n = 1$: $\theta = \sin\xi/\xi$ exact | within $10^{-12}$ | invariants test |
| analytic $n = 5$: $\theta = 1/\sqrt{1+\xi^2/3}$ exact | within $10^{-12}$ | invariants test |
| numerical $n = 1$ at $\xi = 1$ matches $\sin(1)/1$ | within $10^{-3}$ | invariants test |

All confirmed in `invariants.test.mjs` (8 tests passing).

## Limiting cases for verification

- $n = 0$: uniform-density sphere (incompressible).
- $n = 1$: somewhat artificial but exactly solvable.
- $n = 5$: marginally bound; mass is finite but radius infinite.
- $n = 3/2, 3$: physical white-dwarf branches.

## Visual fallback

If KaTeX or Canvas2D is unavailable, the dropdown still operates.

## Citations

- Hansen-Kawaler-Trimble, *Stellar Interiors*, 2e, Ch. 7 (`hansen-kawaler`).
- Chandrasekhar, *Introduction to the Study of Stellar Structure*, classical reference.

## Stretch goals

- Mass-radius relation derived from $M \propto \xi_1^2 |\theta'(\xi_1)|$.
- Add the Lane-Emden function table to the readout.
- Hybrid EOS: polytrope at low $\rho$, different polytrope at high $\rho$.

## Risk register

- RK4 with $d\xi = 10^{-3}$ accumulates only ~$10^{-9}$ error over the integration range; precision is fine for the 1 percent invariants.
- The "M proxy" in the readout is dimensionless; useful for relative comparisons but not for physical mass.
