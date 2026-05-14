---
title: Slow-Roll Inflation
slug: inflation-slow-roll
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: AST3017
supporting_ucs: [MAA-CS]
curriculum_year: bsc-y3s2
primary_citation: mukhanov-cosmology
primary_chapter: 5
---

# Slow-roll inflation: $n_s$ vs $r$

## Physical setup

A scalar inflaton field $\phi$ with potential $V(\phi)$ in slow-roll regime ($\epsilon, |\eta| \ll 1$). The slow-roll parameters are $\epsilon = (M_\text{Pl}^2 / 2)(V'/V)^2$ and $\eta = M_\text{Pl}^2 V''/V$. Observables to leading order:

$$n_s = 1 - 6\epsilon + 2\eta, \qquad r = 16\epsilon.$$

Four models tracked, each yielding $(n_s, r)$ trajectories parameterized by the number of e-folds $N$ before the end of inflation:

- $\phi^2$ chaotic: $n_s = 1 - 4/N$, $r = 8/N$. Strongly excluded by Planck.
- $\phi^4$ chaotic: $n_s = 1 - 5/N$, $r = 16/N$. Far excluded.
- Natural inflation (for $f = 2 M_\text{Pl}$): $n_s = 1 - 2/N - 1/f^2$, $r = 8/N$.
- Starobinsky $R^2$ inflation: $n_s = 1 - 2/N$, $r = 12/N^2$. Comfortably within Planck.

## Numerical method

Closed-form. Plot $(n_s, r)$ on the standard $\le 0.3$ tensor-ratio plane with the Planck 2018 $2\sigma$ box ($n_s = 0.9649 \pm 0.0042$, $r < 0.064$) overlaid.

## Controls

- Number of e-folds $N$ (40 to 80).
- Model selector (4 options).

## Expected qualitative features

1. Starobinsky trajectory hugs $n_s \approx 0.96$, $r \to 0$; lands inside Planck box.
2. $\phi^4$ trajectory at $r \approx 0.2$-$0.3$; firmly excluded.
3. $\phi^2$ at $r \approx 0.13$, marginal.
4. All trajectories converge toward $n_s \to 1$ as $N$ grows.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| Starobinsky at $N = 60$ within Planck box | strict | invariants test |
| $\phi^4$ at $N = 60$ excluded by Planck | strict | invariants test |
| $\phi^2$ at $N = 60$: $r \in (0.10, 0.15)$ | strict | invariants test |
| $r \propto 1/N$ for $\phi^2$ | within $10^{-12}$ | invariants test |
| $n_s \to 1$ as $N \to \infty$ for all models | strict | invariants test |
| Starobinsky $r \propto 1/N^2$ | within $10^{-12}$ | invariants test |
| Planck $n_s$ central value 0.9649 | within $10^{-4}$ | invariants test |
| MODELS list contains 4 entries | exact | invariants test |

All confirmed in `invariants.test.mjs` (8 tests passing).

## Limiting cases for verification

- $N \to \infty$: every model gives $n_s \to 1$, $r \to 0$ (de Sitter limit).
- $\phi^p$ models with $p$ small enough: still slow-roll, but excluded.
- Starobinsky $R^2$: original 1980 inflation model, now in favor.

## Visual fallback

If KaTeX or Canvas2D is unavailable, sliders still operate.

## Citations

- Mukhanov, *Physical Foundations of Cosmology*, Ch. 5 (`mukhanov-cosmology`).
- Planck 2018 results VI: Cosmological parameters (A&A 641, A6).
- Starobinsky 1980; Linde 1982 chaotic inflation; Freese, Frieman, Olinto 1990 natural inflation.

## Stretch goals

- Plot $\phi^n$ trajectories for general $n$ (slider).
- Hill-top inflation models.
- Add running of $n_s$ (running spectral index).

## Risk register

- The natural-inflation formula here is a simplified large-$f$ limit; small-$f$ is more complex but qualitatively similar.
