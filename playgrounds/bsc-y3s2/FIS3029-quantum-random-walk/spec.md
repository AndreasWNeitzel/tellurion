---
title: "Quantum vs Classical Random Walk"
slug: quantum-random-walk
status: verified
audience: portfolio
created: 2026-05-15
primary_uc: FIS3029
supporting_ucs: []
curriculum_year: bsc-y3s2
hook: 'A quantum walk spreads as N while a classical walk spreads as sqrt(N): the quadratic quantum speedup in one picture.'
one_paragraph: 'Two-component |L>/|R> amplitude vector on a 101-site lattice, Hadamard coin every step, position probability summed as |psiL|^2 + |psiR|^2. Side-by-side classical binomial histogram for comparison.'
tags: [quantum, animation, side-by-side-comparator, live-readout]
difficulty: 3
tier: medium
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [steps]
---

# Quantum vs Classical Random Walk

Side-by-side: classical (binomial) on the left, Hadamard quantum walk on the right, both on a 101-site 1D lattice. The classical distribution is a Gaussian widening as $\sqrt{N}$; the quantum is the characteristic double-peaked distribution widening as $N$. Quantum amplitudes drawn with hue from phase, brightness from $|\psi|^2$. Bottom panel overlays both histograms for direct comparison.

## Physical setup

Classical: $P(x, N) = \binom{N}{(N+x)/2} 2^{-N}$. Quantum: $|\psi_{t+1}(x)\rangle = H |\psi_t(x+1)\rangle |R\rangle + H |\psi_t(x-1)\rangle |L\rangle$ with Hadamard coin $H = \tfrac{1}{\sqrt{2}}[[1, 1], [1, -1]]$. Position probability $|\langle x|\psi\rangle|^2$.

## Controls

- $N$ steps (1 to 200)
- Initial coin state slider
- Coin operator toggle (Hadamard vs DFT)

## Invariants

- $\sum |\psi|^2 = 1$ within $10^{-10}$ at every step.
- Classical variance after $N$ steps $\approx N$ within 1%.
- Quantum variance after $N$ steps $> 1.5 N$ for $N > 20$.
- Symmetric distribution for Hadamard from $(|0\rangle + i|1\rangle)/\sqrt{2}$.

## Citations

Kempe 2003, Contemporary Physics 44, 307 (`kempe2003`).
