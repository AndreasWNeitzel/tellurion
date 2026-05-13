# Frustrated triangular antiferromagnet

Antiferromagnetic Ising spins on a triangular lattice. Each spin wants to be opposite to its 6 neighbors. The triangular geometry makes this impossible (on every triangle, at least one pair must be aligned). Wannier 1950: no phase transition; even at T = 0 the system has extensive residual entropy.

What to look for: drag T low and the system never freezes into a clean checkerboard. Patches of three same-spin "frustrated" plaquettes always exist; the readout shows their fraction.

Controls: T (temperature), L (lattice size), speed (sweeps/frame), cold-stripe / hot-random init.

## Reference

Wannier 1950, Phys. Rev. 79, 357; Newman and Barkema 1999, Monte Carlo Methods in Statistical Physics, Section 5.4.

## Verification

- Strong invariants: m and e bounds, high-T disorder, cold-start stripe energy, frustrated-plaquette fraction non-trivial.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
