---
title: Friedmann Cosmography
slug: friedmann-cosmography
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: AST3017
supporting_ucs: [MAA-CS]
curriculum_year: bsc-y3s2
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

# Friedmann cosmography in flat LCDM

## Physical setup

A flat Friedmann-Lemaitre-Robertson-Walker universe with matter density parameter $\Omega_m$, cosmological constant $\Omega_\Lambda = 1 - \Omega_m$, and Hubble constant $H_0$. The dimensionless Hubble function and cosmic age follow from the Friedmann equation.

## Governing equations

$$E(z) = H(z) / H_0 = \sqrt{\Omega_m (1+z)^3 + \Omega_\Lambda},$$
$$t(z) = \frac{1}{H_0} \int_z^\infty \frac{dz'}{(1+z') E(z')} = \frac{1}{H_0} \int_0^{a(z)} \frac{da}{\sqrt{\Omega_m / a + \Omega_\Lambda a^2}}.$$

Comoving distance:
$$D_C(z) = \frac{c}{H_0} \int_0^z \frac{dz'}{E(z')}.$$

Hubble time $1/H_0 = 977.8 / H_0$ Gyr when $H_0$ is in km/s/Mpc.

## Numerical method

Simpson rule for the comoving distance ($n = 2000$); midpoint rule for the age ($n = 2000$). The age integration uses the change of variable $a = 1/(1+z)$ which keeps the integrand finite at $z \to \infty$ ($a \to 0$).

## Controls

- $\Omega_m$ from 0.01 to 1.
- $H_0$ from 50 to 100 km/s/Mpc.

## Expected qualitative features

1. Default $\Omega_m = 0.315$, $H_0 = 67.4$ gives age $\approx 13.8$ Gyr.
2. Einstein-de Sitter ($\Omega_m = 1$): age $= 2/(3 H_0)$ shorter than LCDM at fixed $H_0$.
3. Lambda-dominated ($\Omega_m \to 0$): age diverges.
4. $E(z)$ is monotonically increasing in $z$.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| $E(0) = 1$ for flat LCDM | within $10^{-12}$ | invariants test |
| Hubble time $\approx 14.5$ Gyr at $H_0 = 67.4$ | within 0.1 Gyr | invariants test |
| LCDM age $\approx 13.8$ Gyr | in (13.5, 14.0) | invariants test |
| EdS age $= 2/(3 H_0)$ | within 1 percent | invariants test |
| $D_C(z = 1)$ LCDM $\sim 3300$ Mpc | in (3200, 3500) Mpc | invariants test |
| $D_C$ monotonic in $z$ | strict | invariants test |
| lookback at $z = 1$: 5-10 Gyr | strict | invariants test |
| age decreases with $z$ | strict | invariants test |

All confirmed in `invariants.test.mjs` (8 tests passing).

## Limiting cases for verification

- $\Omega_m = 1$: EdS, $a(t) \propto t^{2/3}$, $t_0 = 2/(3 H_0)$.
- $\Omega_m = 0$: de Sitter, $a(t) \propto e^{H_0 t}$, infinite age.
- $H_0 = 67.4$, $\Omega_m = 0.315$: Planck 2018 best-fit.

## Visual fallback

If KaTeX or Canvas2D is unavailable, sliders still operate.

## Citations

- Liddle, *An Introduction to Modern Cosmology*, 3e, Ch. 4 (`liddle-cosmology`).
- Companion playground: `matter-radiation-equality` (early-universe components).

## Stretch goals

- Add $\Omega_r$ for radiation era, important at high z.
- Curvature $\Omega_k$ for non-flat models.
- $w$-CDM dark energy with variable equation of state.

## Risk register

- The age integral has an integrable singularity at $a = 0$ for $\Omega_m > 0$; the midpoint rule handles it cleanly.
