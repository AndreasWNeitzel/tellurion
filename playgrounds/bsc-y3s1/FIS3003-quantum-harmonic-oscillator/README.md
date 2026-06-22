# The quantum harmonic oscillator

The harmonic oscillator is the model every physicist returns to, because almost anything near a stable equilibrium looks like a parabola, and its quantum version is exactly solvable. In the well $V(x) = \tfrac{1}{2}m\omega^2 x^2$ the allowed energies come out perfectly evenly spaced, $E_n = (n + \tfrac{1}{2})\hbar\omega$, a ladder of identical rungs unlike the crowding levels of the finite square well or the hydrogen atom. The lowest rung is not at the bottom: even the ground state carries $\tfrac{1}{2}\hbar\omega$ of zero-point energy, because confinement and the uncertainty principle forbid a particle from sitting still at the minimum. The scene draws the parabolic well with those evenly spaced levels and the chosen eigenstate riding on its own level, oscillating in time, a Hermite-Gauss function $\psi_n(x) = H_n(x)e^{-x^2/2}$ with exactly $n$ nodes and a gentle leak past the classical turning points into the forbidden region.

The bottom panel sets the quantum probability $|\psi_n|^2$ against the classical one, the chance of catching an ordinary oscillating mass at each point, which is largest at the turning points where it moves slowest and so diverges there. For small $n$ the two look nothing alike, the quantum density bunched in the middle for the ground state where the classical curve is lowest. But slide $n$ up and the rapid quantum wiggles begin to average out into the classical curve, the outer humps growing toward the turning points, the correspondence principle emerging level by level: quantum mechanics must reproduce classical physics when the quantum numbers are large.

The level slider walks up the ladder; each step adds a node to the wavefunction and another evenly spaced rung to the well, and the readouts track the energy, the node count, and the turning point that grows as $\sqrt{2E_n}$.

## Reference

Griffiths, *Introduction to Quantum Mechanics*, 2nd ed., Sec. 2.3 (the harmonic oscillator); Shankar, *Principles of Quantum Mechanics*, 2nd ed., Ch. 7.

## Verification

- Strong invariants: the energy levels are equally spaced by $\hbar\omega$ (the ground state at $\tfrac{1}{2}\hbar\omega$); the n-th eigenstate has exactly n nodes; the eigenstates are normalized, orthogonal, and solve the Schrodinger equation $-\tfrac{1}{2}\psi'' + \tfrac{1}{2}x^2\psi = E_n\psi$.
- Visual gate: SSIM against committed golden frames at both folds.
