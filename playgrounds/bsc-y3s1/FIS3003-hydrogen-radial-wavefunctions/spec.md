---
title: Hydrogen Radial Wavefunctions
slug: hydrogen-radial-wavefunctions
status: verified
audience: portfolio
created: 2026-06-22
primary_uc: FIS3003
curriculum_year: bsc-y3s1
primary_citation: griffiths-qm
primary_chapter: 4
hook: "The electron in hydrogen lives in shells. The radial probability has n-l-1 nodes, swells out as n^2, and the energy depends on n alone."
one_paragraph: "Solving hydrogen splits the wavefunction into angular orbital shapes and a radial part R_nl(r), an associated Laguerre polynomial times a decaying exponential. The radial probability density P(r) = r^2 |R_nl|^2 says where the electron is found in a shell at radius r; it has exactly n-l-1 nodes and a most probable radius that grows roughly as n^2 Bohr radii, while the energy E_n = -13.6 eV / n^2 depends only on n, degenerate in l. The playground shows the orbital as a disk of the radial wavefunction oscillating in time (nodes as dark rings) beside the P(r) curve with its nodes and radii, and the hydrogen energy ladder crowding toward ionization."
tags: [quantum, hydrogen, atomic-orbitals, laguerre, animation, live-readout]
difficulty: 4
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [n, l]
invariants:
  - key: nodes
    label: the radial wavefunction has n-l-1 nodes
    tolerance: 0.0
  - key: energy
    label: E_n = -13.6 eV / n^2, independent of l
    tolerance: 1e-3
  - key: radii
    label: the most probable and mean radii match the known values
    tolerance: 0.5
what_to_try:
  - Step n; the cloud swells and the most probable radius grows roughly as n^2.
  - Step l at fixed n; each smaller l adds a radial node (a dark ring and a zero in P(r)).
  - Watch the energy ladder; all l states of one n share an energy (l-degeneracy of the Coulomb force).
references:
  - "Griffiths, Introduction to Quantum Mechanics, 2nd ed., Sec. 4.2 (the hydrogen atom)."
  - "Bransden and Joachain, Physics of Atoms and Molecules, 2nd ed., Ch. 3."
---

# Hydrogen radial wavefunctions

## Physical setup

The electron bound to a proton by the Coulomb potential; the wavefunction
separates into an angular part and a radial part R_nl(r).

## Equations

$$ R_{nl}(r) \propto (2r/n)^l e^{-r/n} L_{n-l-1}^{2l+1}(2r/n), \qquad E_n = -\frac{13.6\ \text{eV}}{n^2}, $$

with radial probability $P(r) = r^2 |R_{nl}|^2$ having n-l-1 nodes, mean radius
$\langle r\rangle = (3n^2 - l(l+1))/2$, and energy degenerate in l.

## Numerical method

No engine. The radial functions use the associated Laguerre recurrence and are
normalized numerically; the disk colours the radial wavefunction oscillating in
time.

## Controls

- Principal number n (1 to 5), angular number l (0 to n-1).

## Expected qualitative features

1. The radial probability has n-l-1 nodes.
2. The most probable radius grows roughly as n^2.
3. The energy depends only on n (l-degeneracy).

## Invariants and acceptance thresholds

- n-l-1 radial nodes.
- $E_n = -13.6/n^2$ eV.
- The most probable and mean radii match the known values.

## Citations

Griffiths, Introduction to Quantum Mechanics, 2nd ed., Sec. 4.2. Bransden and
Joachain, Physics of Atoms and Molecules, 2nd ed., Ch. 3.
