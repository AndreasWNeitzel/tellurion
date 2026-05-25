---
title: "Quantum vs Classical Random Walk"
slug: quantum-random-walk
status: verified
audience: portfolio
created: 2026-05-15
primary_uc: FIS3029
primary_citation: chen1984
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
  - "Chen, Introduction to Plasma Physics and Controlled Fusion, 2nd ed."
---

# Quantum vs Classical Random Walk

Side-by-side: classical (binomial) on the left, Hadamard quantum walk on the right, both on a 101-site 1D lattice. The classical distribution is a Gaussian widening as $\sqrt{N}$; the quantum is the characteristic double-peaked distribution widening as $N$. Quantum amplitudes drawn with hue from phase, brightness from $|\psi|^2$. Bottom panel overlays both histograms for direct comparison.

## Explainer

### What you are looking at

A drunkard's walk: flip a coin, step left or right, repeat. Classically
you end up in a bell curve that spreads slowly. Do it quantum-
mechanically, with a coin that is a superposition, and the walker
spreads far faster and piles up at the *edges* instead of the centre.
Same rule, radically different statistics, the engine behind some
quantum algorithms.

### Classical walk

After $N$ steps the classical position distribution is binomial,

$$P(x, N) = \binom{N}{(N+x)/2}\,2^{-N},$$

a Gaussian whose width grows as $\sqrt N$ (diffusive). The expected
distance from the origin scales as $\sqrt N$.

### Quantum walk

The quantum walker carries a coin qubit. Each step applies a Hadamard
coin then a conditional shift:

$$H = \frac{1}{\sqrt2}\begin{pmatrix}1 & 1\\ 1 & -1\end{pmatrix},
  \qquad
  |\psi_{t+1}\rangle = S\,(H\otimes I)\,|\psi_t\rangle,$$

where $S$ moves the $|R\rangle$ part right and the $|L\rangle$ part
left. The amplitudes (not probabilities) interfere: paths cancel near
the centre and reinforce near the front. The result is the
characteristic twin-peaked distribution whose spread grows *linearly*
in $N$, quadratically faster than classical.

### Why the difference matters

That ballistic ($\propto N$) versus diffusive ($\propto\sqrt N$)
spreading is exactly the speedup quantum walks exploit in search and
graph algorithms. The contrast is purely interference: the coin
amplitudes add as complex numbers and cancel, something the classical
coin-flip probabilities can never do. The playground runs both on the
same lattice, coloring quantum amplitude by phase, so you watch the
Gaussian crawl while the quantum distribution races outward in two
horns.

### Things to try

- Step both forward and compare widths: classical $\sim\sqrt N$,
  quantum $\sim N$.
- Watch the quantum distribution build two peaks at the leading edges,
  a dip in the middle.
- Note the phase coloring: interference (cancellation) is why the
  centre stays dark.

### Where this comes from

The classical binomial walk, the Hadamard-coin quantum walk, and the
linear-vs-root spreading follow Kempe, "Quantum random walks: an
introductory overview", *Contemporary Physics* 44 (2003).

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

Kempe 2003, Contemporary Physics 44, 307.
