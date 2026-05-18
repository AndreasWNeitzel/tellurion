---
title: Particle in a Well - A Quantum Zoo
slug: particle-in-a-well-zoo
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS3029
supporting_ucs: [FIS2017]
curriculum_year: bsc-y3s2
hook: 'Three textbook quantum wells side by side: the infinite box, the finite box that leaks, and the harmonic trap with its perfectly even ladder.'
one_paragraph: 'Solving the time-independent Schrodinger equation in a potential well quantizes the energy. The playground puts the three canonical cases on one axis: the infinite square well (E_n proportional to n^2, hard walls, no leakage), the finite well (a few bound states whose wavefunctions tunnel into the walls, found from a transcendental matching condition), and the harmonic oscillator (an exactly evenly spaced ladder, E_n = n + 1/2). Comparing them shows how the well shape sets the spectrum and how a wavefunction penetrates a finite barrier. Reference: Griffiths, Introduction to Quantum Mechanics, Ch. 2.'
tags: [quantum, atomic-molecular, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Particle in a well: a quantum zoo

## Physical setup

Three canonical 1D quantum bound-state problems plotted on the same axes for comparison: infinite square well, finite square well, and harmonic oscillator. In each, V(x) is fixed and we solve the time-independent Schrodinger equation for energy eigenstates.

## Governing equations

TISE: -(hbar^2 / 2 m) psi''(x) + V(x) psi(x) = E psi(x). Code units hbar = m = 1.

- Infinite well on [0, L]: V = 0 inside, infinity outside. psi_n(x) = sqrt(2/L) sin(n pi x / L), E_n = n^2 pi^2 / (2 L^2).
- Finite well on [-a, a] of depth V_0: bound states from transcendental matching k tan(k a) = kappa (even) and -k cot(k a) = kappa (odd), with k = sqrt(2 E), kappa = sqrt(2 (V_0 - E)).
- Harmonic oscillator V = (1/2) x^2 (omega = 1): psi_n(x) = N_n H_n(x) exp(-x^2/2), E_n = n + 1/2.

## Numerical method

Closed-form for infinite well and harmonic oscillator. Bisection on the transcendental equation for finite-well bound-state energies (intervals between poles of tan / cot are unique brackets). Wavefunction normalized numerically via trapezoidal sum.

## Controls

- well: dropdown (infinite, finite, harmonic)
- level n: integer 1..8 (clamped to the available bound states for the finite well)
- depth V0 (finite only): 5..40
- a (finite only): 0.5..2.0

## Expected qualitative features

1. Infinite well: ladder spacing grows as n^2; psi_n has n - 1 interior nodes.
2. Finite well: wavefunctions leak into x < -a, x > a with exponential decay; only a finite number of bound states fit.
3. Harmonic oscillator: equally spaced levels at half-integers; eigenfunctions are Gaussian-times-Hermite.

## Invariants and acceptance thresholds

- Infinite well: E_n / E_1 = n^2 to 10 sig figs.
- Infinite well: psi_n normalized to 1 within 1e-3, orthogonal to within 1e-3.
- Harmonic: E_n = n + 1/2 exact to 12 sig figs.
- Harmonic: |psi_n|^2 normalized within 1e-2; psi_n has exactly n nodes for n = 0..4.
- Finite well: a=1, V0=15 yields 3-5 bound states (consistent with z0/(pi/2) rule).
- All finite-well levels E < V_0.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- Finite well as V_0 -> infinity at fixed a = 1: levels approach infinite-well levels with L = 2 a.
- Harmonic oscillator as omega -> 0: levels collapse to free particle (continuum).
- For (V_0, a) such that z0 < pi/2, only one bound state remains.

## Visual fallback

Canvas2D only.

## Citations

- Griffiths and Schroeter 2018, Introduction to Quantum Mechanics, 3e, Sections 2.2 - 2.6 (`griffithsqm2018`).
- Sakurai and Napolitano 2017, Modern Quantum Mechanics, 3e, Section 2.3 (`sakurai2017`).
- Shankar 1994, Principles of Quantum Mechanics, 2e, Section 5.2 (`shankar1994`).

## Stretch goals

- Add the Kronig-Penney periodic well as a fourth option to show band structure.
- Add a time-dependent superposition (e.g., psi = (psi_1 + psi_2) / sqrt 2) animation.

## Risk register

- Bisection on the finite-well transcendental can fail when V_0 is very small (no bound state for V_0 < (pi/2 / a)^2 / 2, only one for slightly larger). The finder returns an empty array gracefully.
- The harmonic-oscillator Hermite recurrence becomes numerically unstable for very large n (> ~ 20) due to factorial growth. The slider is capped at n = 8 to avoid this.
