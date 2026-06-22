---
title: The Quantum Harmonic Oscillator
slug: quantum-harmonic-oscillator
status: verified
audience: portfolio
created: 2026-06-22
primary_uc: FIS3003
curriculum_year: bsc-y3s1
primary_citation: griffiths-qm
primary_chapter: 2
hook: "The model every physicist returns to. Its energy levels are a perfect ladder, its ground state never rests, and at high n it remembers the classical oscillator."
one_paragraph: "In the parabolic well V = x^2/2 the quantum oscillator has equally spaced energies E_n = (n + 1/2) hbar omega, a ladder of identical rungs, with the ground state carrying the zero-point energy hbar omega/2. The eigenstates are Hermite-Gauss functions with exactly n nodes, reaching the classical turning points x_t = sqrt(2 E_n) and leaking a little beyond. The playground draws the well with its evenly spaced levels and the selected eigenstate oscillating on its level, and compares the quantum probability |psi_n|^2 with the classical density (which piles up at the turning points): for small n they differ sharply, but at high n the quantum oscillations average into the classical curve, the correspondence principle."
tags: [quantum, harmonic-oscillator, eigenstates, correspondence, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [n]
invariants:
  - key: spacing
    label: the energy levels are equally spaced by hbar omega
    tolerance: 1e-9
  - key: nodes
    label: the n-th eigenstate has exactly n nodes
    tolerance: 0.0
  - key: schrodinger
    label: the eigenstates solve the Schrodinger equation, normalized and orthogonal
    tolerance: 1e-2
what_to_try:
  - Step the level n; each rung adds one node and the levels stay equally spaced.
  - Look at the ground state at hbar omega/2 (the zero-point energy), a nodeless Gaussian.
  - Push n high and watch |psi_n|^2 follow the classical density toward the turning points.
references:
  - "Griffiths, Introduction to Quantum Mechanics, 2nd ed., Sec. 2.3 (the harmonic oscillator)."
  - "Shankar, Principles of Quantum Mechanics, 2nd ed., Ch. 7."
---

# The quantum harmonic oscillator

## Physical setup

A particle in the parabolic potential $V(x) = \tfrac{1}{2}m\omega^2 x^2$ (natural
units $\hbar = m = \omega = 1$), the universal model near a stable equilibrium.

## Equations

The energies are $E_n = (n + \tfrac{1}{2})\hbar\omega$ and the eigenstates are
Hermite-Gauss functions $\psi_n(x) = N_n H_n(x) e^{-x^2/2}$ with n nodes and
turning points $x_t = \sqrt{2E_n}$. The classical density is
$P_\text{cl}(x) = 1/(\pi\sqrt{x_t^2 - x^2})$.

## Numerical method

No engine. The eigenstates are built by a stable normalized recurrence (avoiding
factorial overflow); energies and the classical density are closed form.

## Controls

- Level n (0 to 12).

## Expected qualitative features

1. The levels are equally spaced (unlike the well or the atom).
2. The ground state sits at the zero-point energy; the n-th state has n nodes.
3. At high n the quantum probability tracks the classical density.

## Invariants and acceptance thresholds

- Level spacing $= \hbar\omega$.
- $\psi_n$ has n nodes.
- The eigenstates solve the Schrodinger equation, normalized and orthogonal.

## Citations

Griffiths, Introduction to Quantum Mechanics, 2nd ed., Sec. 2.3. Shankar,
Principles of Quantum Mechanics, 2nd ed., Ch. 7.
