---
title: Hydrogen Orbital Cross Sections in the (x, z) Plane
slug: hydrogen-orbital-cross-sections-2d
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS3029
supporting_ucs: [FIS2017]
curriculum_year: bsc-y3s2
---

# Hydrogen orbital cross sections in the (x, z) plane

## Physical setup

The bound stationary states of the hydrogen atom, parameterized by three quantum numbers (n, l, m). Probability density |psi_nlm|^2 plotted in the plane through the nucleus that contains the z axis (i.e., y = 0). This is the standard textbook visualization for orbital shapes.

## Governing equations

  psi_nlm(r, theta, phi) = R_nl(r) Y_l^m(theta, phi)

  R_nl(r) = sqrt[ (2/n)^3 (n - l - 1)! / (2 n (n + l)!) ]
            * exp(-r / n) * (2 r / n)^l * L^{2 l + 1}_{n - l - 1}(2 r / n)

with associated Laguerre polynomials L^alpha_p and real spherical harmonics Y_l^m in the Condon-Shortley phase convention (Sakurai 3.6).

Energies: E_n = -1 / (2 n^2) Hartree = -13.605 / n^2 eV.

## Numerical method

Closed-form evaluation. Associated Laguerre by recurrence (NR 6.3); associated Legendre by recurrence (Sakurai 3.6.30); real Y_l^m by linear combination of complex Y_l^m. Sample on 256 x 256 grid in (x, z); gamma 0.4 for display.

## Controls

- orbital: dropdown of (n, l, m) tuples (1s, 2s, 2p_z, 2p_x, 3s, 3p_z, 3d_z2, 3d_xz, 4f_z3)
- span: half-width of the displayed box in Bohr radii (6..60)
- gamma: intensity gamma for the heatmap (0.10..1.00)

## Expected qualitative features

1. 1s: single Gaussian-like blob centered on the origin.
2. 2s: inner ball + outer ring with a radial node between.
3. 2p_z: two lobes along z with a node at the origin.
4. 3d_z2: classical "doughnut + two axial lobes" shape.
5. Radial node count = n - l - 1.

## Invariants and acceptance thresholds

- Radial normalization integral R_nl^2 r^2 dr = 1 within 1 percent for (1, 0), (2, 0), (2, 1), (3, 0), (3, 1), (3, 2).
- |psi_100(0)|^2 = 1 / pi exactly.
- Radial node count matches n - l - 1 for the tested orbitals.
- Real Y_lm normalized to 1 within 2 percent on sphere.
- 2p_z (m = 0) has |psi|^2 along z > |psi|^2 along x at the same r.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- Z = 1 (hydrogen): bound-state energy ladder E_n = -13.6/n^2 eV.
- High n at fixed l: orbital extends to many tens of Bohr radii (asymptotic ~ n^2).
- l = n - 1 (the highest-l for a given n): pure radial form, no nodes.

## Visual fallback

Canvas2D only.

## Citations

- Griffiths and Schroeter 2018, Introduction to Quantum Mechanics, 3e, Section 4.2 (`griffithsqm2018`).
- Sakurai and Napolitano 2017, Modern Quantum Mechanics, 3e, Section 3.6 (`sakurai2017`).
- Shankar 1994, Principles of Quantum Mechanics, 2e, Section 13.3 (`shankar1994`).

## Stretch goals

- Add an angular-coloring overlay that shows the sign of psi (red and blue lobes).
- Add a "density-isosurface" radius sphere overlay.

## Risk register

- Associated Laguerre recurrence becomes numerically inaccurate for n > 8 due to cancellation; the dropdown stops at n = 4 to stay safely inside the stable range.
- xz-plane cross section flattens orbitals with phi-dependent angular structure (e.g., 3d_x2-y2 vanishes on the z axis); we restrict the dropdown to m >= 0 forms whose xz cross section is visually informative.
