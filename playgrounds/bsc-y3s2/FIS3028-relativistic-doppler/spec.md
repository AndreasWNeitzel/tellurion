---
title: Relativistic Doppler Effect
slug: relativistic-doppler
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS3028
supporting_ucs: []
curriculum_year: bsc-y3s2
primary_citation: jackson1998
primary_chapter: 11
---

# Relativistic Doppler effect

## Physical setup

A monochromatic source at rest in frame $K'$ emits frequency $f_s$ and moves at velocity $\beta c$ along the $+x$ axis relative to the observer in frame $K$. The observer sees the photon arriving at angle $\theta$ from the $+x$ axis. The relativistic Doppler factor is

$$\frac{f_\text{obs}}{f_s} = \frac{1}{\gamma (1 - \beta \cos\theta)}, \qquad \gamma = (1 - \beta^2)^{-1/2}.$$

Three named cases:

- Longitudinal approach ($\theta = 0$): $f_\text{obs}/f_s = \sqrt{(1+\beta)/(1-\beta)}$, the maximum blueshift.
- Longitudinal recession ($\theta = \pi$): $f_\text{obs}/f_s = \sqrt{(1-\beta)/(1+\beta)}$, the maximum redshift.
- Transverse ($\theta = \pi/2$): $f_\text{obs}/f_s = 1/\gamma$, pure SR effect.

## Numerical method

Closed-form. Cartesian plot uses 200 samples; polar plot uses 400.

## Controls

- $\beta = v/c$ slider from 0 to 0.99.
- $\theta$ in degrees from 0 to 180 for the marker.

## Expected qualitative features

1. The angular Doppler curve has a single maximum at $\theta = 0$ and a single minimum at $\theta = \pi$.
2. As $\beta \to 1$, the blueshift cone narrows toward the forward direction (relativistic beaming).
3. Transverse redshift: at $\theta = \pi/2$ the observer sees $f_\text{obs} = f_s/\gamma < f_s$, a pure relativistic effect.
4. Crossover from blueshift to redshift happens at $\cos\theta = (1 - 1/\gamma)/\beta$.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| $\gamma(0) = 1$ | within $10^{-12}$ | invariants test |
| $\theta = 0$ longitudinal exact | within $10^{-12}$ | invariants test |
| $\theta = \pi$ longitudinal exact | within $10^{-12}$ | invariants test |
| $\theta = \pi/2$: $f = 1/\gamma$ | within $10^{-12}$ | invariants test |
| crossover at $\theta = \arccos\beta$ gives blueshift | strict | invariants test |
| transverse Doppler is a redshift | $< 1$ | invariants test |
| low-$\beta$: $f \approx 1 + \beta\cos\theta$ | within $10^{-6}$ | invariants test |
| $\beta = 0$ gives no shift at any angle | within $10^{-12}$ | invariants test |

All confirmed in `invariants.test.mjs` (8 tests passing).

## Limiting cases for verification

- $\beta \to 0$: Doppler factor reduces to $1 + \beta\cos\theta$ (Newtonian).
- $\beta \to 1$: blueshift diverges along the forward direction; the polar curve becomes needle-like.

## Visual fallback

If KaTeX or Canvas2D is unavailable, sliders still operate.

## Citations

- Jackson, *Classical Electrodynamics*, 3e, Ch. 11 (`jackson1998`).
- Einstein 1907 / Ives-Stilwell 1938 experimental confirmation of transverse Doppler.

## Stretch goals

- Switch from frequency to wavelength axis for the spectroscopist's view.
- Add the cosmological redshift formula $1+z = a^{-1}$ for comparison.
- Three-source array showing receivers at different angles simultaneously.

## Risk register

- The Cartesian plot uses a log axis to keep the recession side visible; the log range adapts to the current $\beta$.
