---
title: WKB Bohr-Sommerfeld vs Exact
slug: wkb-vs-shooting
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS3029
supporting_ucs: [FIS2018]
curriculum_year: bsc-y3s2
---

# WKB Bohr-Sommerfeld vs exact eigenvalues

## Physical setup

Bound-state energies for a 1D particle in a power-law well V(x) = |x|^p / p, hbar = m = 1. Compare the Bohr-Sommerfeld (WKB) approximation to the "exact" reference levels for the harmonic oscillator (p = 2; closed form E_n = n + 1/2) and quartic anharmonic oscillator (p = 4; Bender-Wu 1969 numerical levels).

## Governing equations

Bohr-Sommerfeld quantization: integral_{x_L}^{x_R} sqrt(2 m (E - V(x))) dx = (n + 1/2) pi hbar.

Bisect on E for the BS integral = (n + 1/2) pi.

## Numerical method

Outer bisection on E (80 iterations); inner midpoint-rule integral of the BS form over 400 panels with turning points found by bisection. The "exact" reference is the analytic E_n = n + 1/2 for p = 2 and the tabulated Bender-Wu 1969 numerical eigenvalues for p = 4.

## Controls

- p: exponent of V(x) = |x|^p / p, slider 2 - 6, default 2
- nMax: number of levels to display, 3 - 8, default 6

## Expected qualitative features

1. p = 2: BS exactly recovers the harmonic ladder E_n = n + 1/2.
2. p = 4: BS underestimates the ground state by a factor ~ 3 (canonical BS failure for non-quadratic wells at low n).
3. As n grows, BS converges to the true eigenvalues (correspondence principle).
4. The BS curve shifts upward as p grows.

## Invariants and acceptance thresholds

- HO (p = 2): BS reproduces E_n = n + 1/2 to 1e-3 for n = 0..5.
- BS levels monotone in n for p = 2..6.
- Quartic (p = 4) ground state: BS in (0.3, 0.5) vs Bender-Wu exact 1.06.
- Quartic n = 5: BS in [5, 30].

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- p = 2: BS exact.
- n -> infinity: BS asymptotically exact for any smooth well (correspondence principle).
- p -> infinity: infinite square well; BS levels approach n^2 pi^2 / 2.

## Visual fallback

Canvas2D only.

## Citations

- Griffiths and Schroeter 2018, Introduction to Quantum Mechanics, 3e, Section 8.1 (`griffithsqm2018`).
- Bender and Wu 1969, "Anharmonic oscillator", Phys. Rev. 184, 1231.
- Newman 2013, Computational Physics, Section 6.3 (Numerov method for shooting; teaching reference).

## Stretch goals

- Implement inward-matching shooting (Numerov from xMax inward + match at turning point) so the "exact" curve is computed numerically for any p.
- Add the Langer correction to BS to improve low-n accuracy.

## Risk register

- The slug suggests a full WKB vs shooting comparison; this implementation provides BS plus tabulated Bender-Wu reference for p = 4. A proper shooting method is left as a stretch goal.
