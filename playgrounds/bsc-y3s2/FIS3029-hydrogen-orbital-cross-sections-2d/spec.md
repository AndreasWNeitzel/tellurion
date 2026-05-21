---
title: Hydrogen Orbital Cross Sections in the (x, z) Plane
slug: hydrogen-orbital-cross-sections-2d
status: deprecated
superseded_by: hydrogen-orbitals-3d
audience: portfolio
created: 2026-05-13
primary_uc: FIS3029
supporting_ucs: [FIS2017]
curriculum_year: bsc-y3s2
hook: 'Slice the hydrogen atom through the nucleus and the (n, l, m) orbitals show their real shapes: shells, lobes, and angular nodes.'
one_paragraph: 'The bound states of hydrogen are psi_nlm = R_nl(r) Y_l^m(theta, phi). The playground plots the probability density |psi_nlm|^2 in the x-z plane through the nucleus, the standard textbook orbital cross section, as you pick n, l, m. You see the n - l - 1 radial nodes, the angular nodes from the spherical harmonic, and how s, p, d shapes emerge. It turns the quantum numbers into something concrete instead of abstract labels. Reference: Griffiths, Introduction to Quantum Mechanics, Ch. 4.'
tags: [quantum, atomic-molecular, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
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
---

# Hydrogen orbital cross sections in the (x, z) plane

## Explainer

### What you are looking at

The hydrogen atom's electron does not orbit; it occupies standing-wave
clouds set by three integers. The playground slices the probability
cloud through the nucleus so you see the real shapes, spherical shells,
dumbbells, cloverleaves, and where they have nodes, as you dial the
quantum numbers.

### The wavefunction

Each stationary state factors into a radial part and an angular part:

$$\psi_{n\ell m}(r,\theta,\phi)
  = R_{n\ell}(r)\,Y_\ell^m(\theta,\phi),$$

with

$$R_{n\ell}(r) \propto e^{-r/n}\,(2r/n)^\ell\,
  L^{2\ell+1}_{n-\ell-1}(2r/n),$$

where $L$ is an associated Laguerre polynomial and $Y_\ell^m$ a (real)
spherical harmonic. The displayed image is the probability density
$|\psi_{n\ell m}|^2$ in the plane $y=0$ that contains the $z$ axis, the
standard textbook cross section.

### Reading the quantum numbers off the picture

Every feature is one quantum number:

- $n$ (principal): sets the overall size ($\langle r\rangle\sim n^2$)
  and the total node count.
- $\ell$ (orbital): the number of angular lobes. $\ell=0$ is spherical
  ($s$), $\ell=1$ two lobes ($p$), $\ell=2$ four ($d$).
- $m$ (magnetic): how those lobes are oriented about the $z$ axis.

The number of radial nodes is $n-\ell-1$ and the number of angular
nodes is $\ell$; their sum is always $n-1$. So the quantum numbers are
not abstract labels, they are literally the count of spherical and
planar nodes you can see in the slice. This node structure is what sets
chemical bonding and spectral selection rules. The playground lets you
step $(n,\ell,m)$ and watch the shells and lobes appear.

### Things to try

- Fix $\ell=0$ and raise $n$: concentric spherical shells, $n-1$
  radial nodes.
- Set $\ell=1$ ($p$ orbital): two lobes with a planar node through the
  nucleus.
- Increase $\ell$ toward $n-1$: pure angular structure, no radial
  nodes (the circular states).

### Where this comes from

The hydrogen wavefunctions $R_{n\ell}Y_\ell^m$, the Laguerre radial
part, and the node-counting rules follow Griffiths, *Introduction to
Quantum Mechanics*, Chapter 4, and Sakurai, *Modern Quantum
Mechanics*, Section 3.6.

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
