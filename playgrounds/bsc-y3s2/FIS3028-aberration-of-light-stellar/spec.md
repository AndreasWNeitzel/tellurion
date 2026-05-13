---
title: Stellar Aberration of Light
slug: aberration-of-light-stellar
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS3028
supporting_ucs: [AST2004]
curriculum_year: bsc-y3s2
primary_citation: jackson1998
primary_chapter: 11
---

# Stellar aberration of light

## Physical setup

Stars at uniform angular positions in their rest frame; the observer moves at velocity $\beta c$ along $+x$. Lorentz aberration

$$\cos\theta_\text{obs} = \frac{\cos\theta_\text{rest} + \beta}{1 + \beta \cos\theta_\text{rest}}$$

pulls every observed direction toward the forward axis. For Earth's annual orbital motion ($v = 29.78$ km/s, $\beta \approx 10^{-4}$), the maximum aberration is the classical $\sim 20.5"$ at $\theta = \pi/2$.

## Numerical method

Closed-form. 18 stars sampled at uniform $\theta_\text{rest}$; both rest and observed positions plotted on a single polar diagram.

## Controls

- $\log_{10}\beta$ slider from -6 (planetary) to 0 (ultrarelativistic).

## Expected qualitative features

1. Forward and backward directions ($\theta = 0$ and $\pi$) are fixed under aberration.
2. Maximum shift occurs near $\theta = \pi/2$.
3. As $\beta \to 1$, the entire celestial sphere collapses toward the forward direction (relativistic beaming geometry).
4. At $\beta = 10^{-4}$, the maximum shift is $\sim 20.5"$, matching the constant of aberration measured by Bradley 1729.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| forward direction unchanged | within $10^{-12}$ | invariants test |
| backward direction unchanged | within $10^{-12}$ | invariants test |
| small-beta shift agrees with $\beta \sin\theta$ | within $10^{-3}$ | invariants test |
| Earth annual aberration at $\theta = \pi/2$ is $\approx 20.5"$ | within 1 percent | invariants test |
| high-beta beams light forward | strict $\theta_\text{obs} \lt \theta_\text{rest}$ | invariants test |
| inverse: $\theta_\text{rest}(\theta_\text{obs}(\theta)) = \theta$ | within $10^{-12}$ | invariants test |
| $\beta = 0$ gives no aberration | within $10^{-12}$ | invariants test |
| max shift at $\theta = \pi/2$ (small $\beta$) | strict | invariants test |

All confirmed in `invariants.test.mjs` (8 tests passing).

## Limiting cases for verification

- Bradley 1729: $\sim 20.5"$ annual aberration confirms Earth's motion and finite $c$ together.
- $\beta \to 1$: relativistic beaming squeezes all visible sources into the forward direction (the source of the Doppler beaming companion effect).

## Visual fallback

If KaTeX or Canvas2D is unavailable, the slider still operates.

## Citations

- Jackson, *Classical Electrodynamics*, 3e, Ch. 11 (`jackson1998`).
- J. Bradley 1729: empirical discovery of annual aberration.

## Stretch goals

- Animate Earth's orbit to show the annual ellipse traced by each star.
- Add the relativistic-beaming companion (intensity transformation).
- Switch to galactic-frame coordinates and overlay the secular aberration from the solar motion.

## Risk register

- For $\beta$ very close to 1 the lines all converge near the forward axis and overlap; visually accepted because that is the actual physics.
