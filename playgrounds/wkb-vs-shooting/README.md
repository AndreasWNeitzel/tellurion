# WKB Bohr-Sommerfeld vs exact eigenvalues

Bound-state energies for a particle in V(x) = |x|^p / p. The blue ladder is the Bohr-Sommerfeld quantization (WKB); the orange ladder is the exact analytical value (n + 1/2 for harmonic, Bender-Wu for quartic). For the harmonic case BS is exact; for the quartic case the ground state is off by a factor of 3, a classic illustration that BS fails badly at low quantum numbers when the well is not quadratic.

What to look for: slide p between 2 (harmonic) and 6 (very steep wall). At p = 2 the two ladders agree perfectly. At p = 4 the BS ground state is at 0.34 while exact is 1.06; higher n agree to a few percent.

Controls: p (exponent), nMax (number of levels).

## Reference

Griffiths and Schroeter 2018 QM 3e Sec. 8.1; Bender and Wu 1969 Phys. Rev. 184.

## Verification

- Strong invariants: HO levels exact to 1e-3, monotone in n, quartic ground state in (0.3, 0.5).
- Visual gate: SSIM > 0.92 against committed golden frames at seed 0xC0FFEE.
- Last verified: see `.verified`.
