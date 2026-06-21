---
title: Jeans Instability
slug: jeans-instability
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: AST2004
supporting_ucs: [MAA-GD]
curriculum_year: bsc-y2s1
primary_citation: carroll-ostlie
primary_chapter: 12
hook: 'Gravity wants a gas cloud to collapse; pressure pushes back. Above the Jeans length gravity wins and the cloud runs away into a star.'
one_paragraph: 'Small perturbations of a uniform self-gravitating gas obey the dispersion relation omega^2 = c_s^2 k^2 - 4 pi G rho. Short-wavelength modes (large k) keep omega^2 > 0 and merely oscillate as sound waves; long-wavelength modes flip omega^2 < 0 and grow exponentially, the runaway that starts star formation. The crossover is the Jeans length lambda_J = sqrt(pi c_s^2 / (G rho)). The scene animates a density ripple of the chosen wavelength: below the Jeans length it sloshes as a sound wave, above it it runs away and fragments into clumps. The diagnostic plots the growth rate against wavelength, negative (oscillation) on the short side and rising to a free-fall plateau on the long side, crossing zero exactly at the Jeans length. Temperature and density set the Jeans length and the Jeans mass (tens of solar masses for a cold dense core). Reference: Carroll and Ostlie, An Introduction to Modern Astrophysics, Ch. 12.'
tags: [stellar, exoplanets, animation, live-readout, interactive]
difficulty: 3
tier: hero
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
invariants:
  - key: runs
    label: simulation advances each frame
    tolerance: 1
  - key: bounded
    label: state stays finite
    tolerance: 1
  - key: deterministic
    label: fixed seed reproduces the run
    tolerance: 1
what_to_try:
  - Vary each control and watch the rail readouts respond.
  - Compare the diagnostic plot against the live scene.
references:
  - "Carroll, Ostlie, An Introduction to Modern Astrophysics, Second ed., Ch. 12."
---

# Jeans instability: dispersion relation and length scale

## Explainer

### What you are looking at

A cloud of gas in space is caught between two effects: its own gravity
pulling it inward and its pressure pushing back. The playground shows
which one wins as a function of the size of the disturbance. Small
ripples just bounce as sound waves; ripples larger than a critical
length collapse. That threshold is why gas clouds turn into stars.

### The dispersion relation

Perturb a uniform self-gravitating gas with a wave
$\propto e^{i(kx - \omega t)}$ and linearizing the fluid equations
gives a remarkably simple result:

$$\omega^2 = c_s^2 k^2 - 4\pi G\rho,$$

where $c_s = \sqrt{k_B T/m_p}$ is the sound speed and $\rho$ the
density. The first term is pressure (it resists compression, like a
sound wave); the second is self-gravity (it always pulls in).

### Stable sound versus runaway collapse

Read off the sign of $\omega^2$:

- Short wavelengths (large $k$): pressure dominates, $\omega^2 > 0$,
  so $\omega$ is real and the perturbation oscillates as a stable
  sound wave.
- Long wavelengths (small $k$): gravity dominates, $\omega^2 < 0$,
  so $\omega$ is imaginary and the perturbation grows exponentially,
  gravitational collapse.

The crossover is the Jeans length, where $\omega^2 = 0$:

$$\lambda_J = \sqrt{\frac{\pi c_s^2}{G\rho}}.$$

Any clump bigger than $\lambda_J$ cannot hold itself up and collapses.
The mass inside it, the Jeans mass (about 50 solar masses for a cold
molecular cloud), sets the characteristic scale of star formation.

### Things to try

- Sweep the wavenumber and watch $\omega^2$ cross zero at $k_J$:
  sound on one side, collapse on the other.
- Raise the temperature (higher $c_s$): the Jeans length grows, so it
  takes a bigger cloud to collapse, warm gas resists star formation.
- Raise the density: $\lambda_J$ shrinks, denser gas fragments more
  easily.

### Where this comes from

The linearized dispersion relation, the Jeans length and mass, and the
collapse criterion follow Carroll and Ostlie, *An Introduction to
Modern Astrophysics*, 2nd ed., Chapter 12, and Binney and Tremaine,
*Galactic Dynamics*, 2nd ed., Chapter 4.

## Physical setup

A uniform, self-gravitating, isothermal hydrogen medium with mass density $\rho$ and sound speed $c_s = \sqrt{k_B T / m_p}$. Linear perturbations $\propto \exp(i k x - i \omega t)$ satisfy the dispersion relation

$$\omega^2 = c_s^2 k^2 - 4 \pi G \rho.$$

Modes with $\omega^2 < 0$ grow exponentially (Jeans-unstable, gravitational collapse); modes with $\omega^2 > 0$ oscillate as sound waves. The Jeans length is

$$\lambda_J = \sqrt{\pi c_s^2 / (G \rho)}, \qquad k_J = 2 \pi / \lambda_J.$$

## Governing equations

For canonical molecular-cloud parameters ($n = 10^3$ cm$^{-3}$, $T = 10$ K, pure hydrogen), $c_s \approx 290$ m/s, $\rho \approx 1.7 \times 10^{-18}$ kg/m$^3$, $\lambda_J \approx 1.5$ pc, and the Jeans mass $M_J = (4 \pi/3)(\lambda_J/2)^3 \rho \approx 50 \, M_\odot$.

## Numerical method

Closed-form dispersion relation. Rendering is plain Canvas2D: the scene
draws a density slab rho0(1 + A cos kx) with the amplitude A following
the analytic mode (A0 cosh(Gamma t) when unstable, A0 cos(omega t) when
stable, the visual rate scaled by the actual rate so longer modes grow
faster); the diagnostic samples the signed growth rate over 0.1 to 30 pc
on a log-wavelength axis, scaled to the free-fall growth rate so the
collapse plateau is visible.

## Controls

- temperature T (5 to 80 K), setting the isothermal sound speed.
- density log10(n / cm^-3) (2 to 5), setting the mass density rho = n m_p.
- perturbation wavelength (0.2 to 20 pc): the mode tested in the scene.
- Reset, Pause.

Temperature and density set the Jeans length; the chosen wavelength
relative to it decides whether the scene collapses or oscillates.

## Expected qualitative features

1. The dispersion curve is an upward-opening parabola in $\omega^2$ vs $k$.
2. The unstable band (shaded) extends from $k = 0$ up to $k_J$.
3. Higher density shrinks $\lambda_J$ (square-root dependence) and shifts the unstable band toward smaller wavelengths.
4. Higher temperature increases $c_s$ and stretches $\lambda_J$ linearly.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| $\omega^2 = 0$ at $k = k_J$ | within $10^{-30}$ | invariants test |
| $\omega^2 < 0$ for $k < k_J$ | strict | invariants test |
| $\omega^2 > 0$ for $k > k_J$ | strict | invariants test |
| $\lambda_J \propto c_s / \sqrt{\rho}$ scaling | within $10^{-12}$ | invariants test |
| $\lambda_J \propto c_s$ at fixed $\rho$ | within $10^{-12}$ | invariants test |
| cold cloud $\lambda_J \in (1, 3)$ pc | strict | invariants test |
| cold cloud $M_J \in (10, 200) \, M_\odot$ | strict | invariants test |
| isothermal $c_s$ at 10 K is $\approx$ 287 m/s | within 5 percent | invariants test |

All confirmed in `invariants.test.mjs` (8 tests passing).

## Limiting cases for verification

- $\rho \to 0$: $\lambda_J \to \infty$; medium can never collapse.
- $T \to 0$: $c_s \to 0$, $\lambda_J \to 0$; everything unstable.
- $T \to \infty$: even galactic-scale perturbations are sound waves.

## Visual fallback

If KaTeX or Canvas2D is unavailable, sliders still set $T$ and $n$ and the readout reports $\lambda_J$ and $M_J$.

## Citations

- Carroll-Ostlie, *An Introduction to Modern Astrophysics*, 2e, Ch. 12.
- Binney-Tremaine, *Galactic Dynamics*, 2e, Ch. 4 for the dynamical-friction context.

## Stretch goals

- Add rotation (Jeans-Toomre criterion $Q = \kappa c_s / (\pi G \Sigma)$).
- Magnetic stabilization (Chandrasekhar-Fermi mode).
- Time-domain visualization: density evolution of a perturbation that crosses the Jeans threshold.

## Risk register

- The signed-log axis can be confusing; the zero line is drawn as a thick muted line.
- $\omega^2$ at extreme parameters can be tiny; clamped to $|y| > 10^{-30}$ for log display.
