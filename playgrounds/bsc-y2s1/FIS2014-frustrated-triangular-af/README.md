# Frustrated triangular antiferromagnet

Antiferromagnetic Ising spins on a triangular lattice. Each spin wants to be opposite to its 6 neighbors. The triangular geometry makes this impossible (on every triangle, at least one pair must be aligned). Wannier 1950: no phase transition; even at T = 0 the system has extensive residual entropy.

The spins are drawn as up (gold) and down (blue) discs on a proper equilateral
triangular lattice, with the fully frustrated triangles (all three spins equal)
flagged in red. A view toggle swaps to the three-sublattice chirality domains,
the order that emerges from disorder. The diagnostic tracks the satisfied-bond
fraction, which climbs only to its 2/3 ceiling because one bond per triangle is
always frustrated, alongside the magnetization, which stays near zero.

What to look for: drag T low and the system never freezes into a clean ordered
pattern. The red frustrated triangles thin out but never vanish, the satisfied
fraction stalls at 2/3, and |M| stays near zero.

Controls: T (temperature), L (lattice size), speed (sweeps/frame), the
spins/domains view toggle, and cold-stripe / hot-random initialization.

## Reference

Wannier 1950, Phys. Rev. 79, 357; Newman and Barkema 1999, Monte Carlo Methods in Statistical Physics, Section 5.4.

## Verification

- Strong invariants: m and e bounds, high-T disorder, cold-start stripe energy, frustrated-plaquette fraction non-trivial.
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
