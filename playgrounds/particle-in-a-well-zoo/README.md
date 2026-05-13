# Particle in a well: a quantum zoo

Three of the standard textbook 1D bound-state problems on one axis: infinite square well, finite square well, harmonic oscillator. Pick a well, pick a level, see the wavefunction sitting on its energy line above the potential.

What to look for: the infinite well has levels at E_n = n^2 pi^2 / (2 L^2), spaced as n^2. The harmonic oscillator has equally spaced levels (n + 1/2) hbar omega. The finite well has only a finite number of bound states and the wavefunctions visibly leak past +/- a with exponential decay (the "tail" region). Each psi_n has exactly n - 1 nodes inside the well (infinite, finite) or n nodes (oscillator).

Controls: well dropdown selects the potential. Level n picks the eigenstate. V_0 and a are the finite-well depth and half-width.

## Reference

Griffiths and Schroeter 2018, Introduction to Quantum Mechanics, 3e, Sections 2.2 - 2.6; Sakurai and Napolitano 2017, Modern Quantum Mechanics, 3e, Section 2.3.

## Verification

- Strong invariants: closed-form energies, normalization, orthogonality, node count, finite-well bound-state count, tail decay.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
