---
title: Blackbody Radiation - Planck vs Rayleigh-Jeans
slug: blackbody-planck-vs-rayleigh
status: verified
audience: portfolio
created: 2026-06-21
primary_uc: FIS2003
curriculum_year: bsc-y2s2
primary_citation: eisbergresnick1985
primary_chapter: 1
hook: "Classical physics predicted a hot oven should blaze with infinite ultraviolet light. Planck's quantum cut the catastrophe off, and this plot launched quantum physics."
one_paragraph: "The Rayleigh-Jeans law gives the blackbody spectral radiance as 2 c kB T / lam^4, which diverges as the wavelength shrinks (the ultraviolet catastrophe). Planck's quantisation of the cavity oscillators gives B_lam = (2 h c^2/lam^5)/(exp(hc/lam kB T) - 1), which reduces exactly to Rayleigh-Jeans at long wavelength but turns over and falls at short wavelength, matching experiment. The playground plots both curves at a chosen temperature, marks the Planck peak (Wien's law lam_max T = const), shades the visible band, and shows the total radiated power growing as T^4 (Stefan-Boltzmann). A toggle switches between wavelength and frequency. All curves use the real physical constants."
tags: [modern-physics, quantum, blackbody, spectroscopy, interactive, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [T, axis, probe]
invariants:
  - key: limit
    label: Planck reduces to Rayleigh-Jeans at long wavelength
    tolerance: 1e-2
  - key: wien
    label: the Planck peak satisfies lam_max T = 2.898e-3 m K
    tolerance: 1e-6
  - key: sb
    label: the total power follows Stefan-Boltzmann (doubling T multiplies it by 16)
    tolerance: 1e-3
what_to_try:
  - Raise the temperature: the Planck peak slides to shorter wavelengths, the curve grows, and the colour swatch shifts from red through white to blue (the perceived blackbody colour).
  - Drag the probe: in the visible band and beyond it the RJ/Planck ratio is huge (the ultraviolet catastrophe), but it falls to 1 at long wavelength where the classical law is exact.
  - Switch the x axis to frequency: the visible band is now shaded there too (violet at high frequency), and Rayleigh-Jeans diverges toward high frequency instead of short wavelength.
  - The total radiated power follows a slope-four line on log-log axes (Stefan-Boltzmann).
references:
  - "Eisberg and Resnick, Quantum Physics of Atoms, Molecules, Solids, Nuclei and Particles, 2nd ed., Ch. 1."
  - "Planck 1901, Annalen der Physik 4, 553 (the radiation law)."
---

# Blackbody radiation: Planck vs Rayleigh-Jeans

## Physical setup

The thermal radiation in equilibrium in a cavity at temperature T, described by
its spectral radiance versus wavelength (or frequency).

## Equations

The classical Rayleigh-Jeans law and Planck's law are

$$ B_\lambda^{\mathrm{RJ}} = \frac{2 c k_B T}{\lambda^4}, \qquad B_\lambda^{\mathrm{Planck}} = \frac{2 h c^2}{\lambda^5}\,\frac{1}{e^{hc/\lambda k_B T} - 1}. $$

As $\lambda\to\infty$ the exponential linearises and Planck reduces to
Rayleigh-Jeans; as $\lambda\to 0$ Rayleigh-Jeans diverges while Planck vanishes.
The peak obeys Wien's law $\lambda_\text{max} T = 2.898\times10^{-3}$ m K and the
integral obeys Stefan-Boltzmann, total power $= \sigma T^4$.

## Numerical method

No engine. The closed-form laws are evaluated with the real constants h, c,
k_B, sigma, and the Wien constant; the Stefan-Boltzmann integral is checked
numerically against sigma T^4.

## Controls

- Temperature T (with a live perceived-colour swatch); a dropdown selecting the wavelength or frequency axis; a probe dragged across the spectrum that reads both curves and their ratio. Reset.

## Expected qualitative features

1. Rayleigh-Jeans diverges at short wavelength; Planck peaks and falls.
2. The peak shifts to shorter wavelength as T rises (Wien).
3. The total power grows as T^4 (Stefan-Boltzmann), a slope-four log-log line.

## Invariants and acceptance thresholds

- Planck reduces to Rayleigh-Jeans at long wavelength.
- $\lambda_\text{max} T = 2.898\times10^{-3}$ m K.
- The total power follows $\sigma T^4$.

## Citations

Eisberg and Resnick, Quantum Physics, 2nd ed., Ch. 1. Planck 1901, Annalen der
Physik 4, 553.
