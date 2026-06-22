---
title: The Variational Method
slug: variational-method
status: verified
audience: portfolio
created: 2026-06-22
primary_uc: FIS3003
curriculum_year: bsc-y3s1
primary_citation: griffiths-qm
primary_chapter: 7
hook: "Guess a wavefunction, compute its energy, and you have an upper bound on the ground state you can never beat. A Gaussian gets hydrogen to -0.424 Ha, just short of -0.5."
one_paragraph: "The variational theorem: for any normalized trial state, <H> is an upper bound on the true ground-state energy E0. For hydrogen with a Gaussian trial e^(-a r^2), the energy functional is <H>(a) = (3/2)a - 2 sqrt(2a/pi), minimized at a* = 8/(9 pi) with <H> = -4/(3 pi) = -0.424 Ha, above the exact -0.5 because a smooth Gaussian cannot reproduce the cusp of the true e^(-r) state. The playground compares the trial and exact wavefunctions, shows the energy against the exact floor, and plots <H>(a), which dips to its minimum and never crosses E0."
tags: [quantum-mechanics, variational-principle, hydrogen, trial-wavefunction, quantum-chemistry, interactive, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [a]
invariants:
  - key: bound
    label: the trial energy is always an upper bound, <H> >= E0
    tolerance: 1e-9
  - key: opt
    label: the minimum is at a* = 8/(9 pi) with <H> = -4/(3 pi)
    tolerance: 1e-9
  - key: virial
    label: at the optimum the virial relation 2<T> = -<V> holds
    tolerance: 1e-9
what_to_try:
  - Sweep the width a; the energy slides but never drops below E0.
  - Jump to a*; the minimum is -0.424 Ha, the best a single Gaussian can do.
  - Look at r=0; the exact cusp the Gaussian flattens is why the bound is loose.
  - Watch the kinetic and potential split; the virial relation holds at the optimum.
references:
  - "Griffiths, Introduction to Quantum Mechanics, 3rd ed., Cambridge, 2018, Ch. 7."
  - "Szabo and Ostlund, Modern Quantum Chemistry, Dover, 1996, Ch. 3."
---

# The variational method

## Physical setup

The hydrogen atom, $H = -\tfrac12\nabla^2 - 1/r$ in atomic units, approximated by a
normalized Gaussian trial wavefunction $\psi_a(r) = (2a/\pi)^{3/4}e^{-a r^2}$.

## Equations

The variational theorem gives $\langle H\rangle = \langle T\rangle + \langle V\rangle \ge E_0$.
For the Gaussian trial,

$$ \langle H\rangle(a) = \tfrac32 a - 2\sqrt{\tfrac{2a}{\pi}}, \qquad a^\ast = \frac{8}{9\pi},\quad \langle H\rangle_\mathrm{min} = -\frac{4}{3\pi} = -0.424\ \mathrm{Ha}, $$

above the exact $E_0 = -0.5$ Ha.

## Numerical method

The energy functional and optimum are closed-form; the wavefunctions and radial
densities are evaluated directly. No integration at run time.

## Controls

- Trial width a; sweep; jump to the optimum a*.

## Expected qualitative features

1. The energy <H> is always at or above E0.
2. The minimum sits at a* = 8/(9 pi), value -0.424 Ha.
3. The exact state has a cusp at r=0 the Gaussian cannot match.
4. The virial relation 2<T> = -<V> holds at the optimum.

## Invariants and acceptance thresholds

- $\langle H\rangle \ge E_0$ for all a.
- Minimum at $a^\ast = 8/(9\pi)$, value $-4/(3\pi)$.
- Virial $2\langle T\rangle = -\langle V\rangle$ at the optimum.

## Citations

Griffiths, Introduction to Quantum Mechanics, 3rd ed., Ch. 7.
Szabo and Ostlund, Modern Quantum Chemistry, Ch. 3.
