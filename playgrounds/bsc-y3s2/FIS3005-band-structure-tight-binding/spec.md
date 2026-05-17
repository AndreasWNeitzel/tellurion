---
title: Tight-Binding Band Structure
slug: band-structure-tight-binding
status: verified
audience: portfolio
created: 2026-05-17
hook: 'One hopping integral makes a band: cosine in 1D, a gap when you dimerize, a van Hove saddle and a square Fermi surface in 2D.'
one_paragraph: 'The tight-binding model: one orbital per site, an on-site energy and a hopping t. Bloch theorem gives E(k) = eps0 - 2t cos(ka) for the 1D chain (width 4t, band-edge effective mass hbar^2/2ta^2); a dimerized (SSH) chain has the 2x2 Bloch Hamiltonian with eigenvalues +-sqrt(t1^2 + t2^2 + 2 t1 t2 cos ka) and a zone-boundary gap 2|t1-t2|; the 2D square lattice has E = -2t(cos kx a + cos ky a) with a van Hove saddle at (pi,0). The scene draws the dispersion with states filled to a draggable E_F and the density of states (1D/SSH), or the 2D band heatmap with the Fermi-surface contour. The headless sim.js is gate-tested for the 1D dispersion and bandwidth, BZ periodicity, the group velocity at the band edges, the effective mass, the SSH gap and chiral symmetry, the 2D extrema and saddle, the DOS normalization and divergence, the filling and the 2D Fermi surface.'
tags: [condensed-matter, band-structure, quantum, multi-panel, live-readout]
difficulty: 4
tier: advanced
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 6
curriculum_year: 'L:F-3Y-2S'
primary_uc: FIS3005
share_state_keys: []
---

# Tight-Binding Band Structure

## Physical setup

A single s-band: 1D chain (uniform t), the dimerized SSH chain
(alternating t1, t2), or the 2D square lattice. Units a = hbar = 1.

## Governing equations

`E_1D(k) = eps0 - 2t cos(ka)`; group velocity `2 t a sin(ka)`,
curvature `2 t a^2 cos(ka)`, band-bottom mass `hbar^2/(2 t a^2)`.
SSH: `H(k) = [[0, t1 + t2 e^{-ika}],[h.c., 0]]`,
`E = +-sqrt(t1^2 + t2^2 + 2 t1 t2 cos ka)`, gap `2|t1-t2|`.
`E_2D = -2t(cos kx a + cos ky a)`; 1D DOS
`g(E) = 1/(pi sqrt((2t)^2 - (E-eps0)^2))`; filling
`acos(-(E_F-eps0)/2t)/pi`.

## Numerical method

Closed-form dispersions; the 2D Fermi surface is contoured by
sign-change marching on a `k`-grid. Deterministic, no RNG.
Reference: Kittel, Introduction to Solid State Physics (8th ed.),
Ch. 7-9 (`kittel-cm`); Ashcroft and Mermin, Solid State Physics,
Ch. 10 (`ashcroft-mermin`).

## Controls

- lattice: 1D, SSH, or 2D.
- hopping t: sets the bandwidth.
- dimerization t2/t1: opens the SSH gap.
- Fermi level E_F: fills the band / sizes the Fermi surface.
- Reset.

## Expected qualitative features

- 1D: a cosine band; the filled part (below E_F) is highlighted; the
  DOS diverges at the two band edges (van Hove).
- SSH: two mirror bands with a gap that closes at t1 = t2.
- 2D: a blue-to-red energy map; the green Fermi surface is a
  rounded square that nests to the BZ-boundary square at half
  filling.

## Invariants and acceptance thresholds

- `E = eps +- 2t` at `k = 0, pi/a`; bandwidth `4t`.
- `E(k)` is `2 pi/a` periodic and even.
- Group velocity zero at the band edges; numeric `dE/dk` matches.
- Band-bottom `m* = hbar^2/(2 t a^2)`; hole-like at the top.
- SSH gap `2|t1-t2|`, `E+ = -E-`, gapless at `t1=t2`; closed form
  equals the 2x2 eigenvalue.
- 2D `min -4t (Gamma)`, `max +4t (corner)`, saddle `0 at (pi,0)`.
- 1D DOS zero outside, diverges at the edges, integrates to 1.
- Filling 0 / 1 / 1/2 at `E_F = -2t / +2t / eps0`.

## Limiting cases for verification

- `t -> 0`: a flat band (atomic limit), DOS a delta at `eps0`.
- `t1 = t2`: SSH reduces to the gapless uniform chain (zone-folded).
- 2D half filling: the Fermi surface is the perfect `(pi,0)-(0,pi)`
  square (nesting).

## Visual fallback

Static frame: the dispersion (or 2D map) with the filled states /
Fermi surface at the captured `E_F`.

## Citations

- Kittel, Introduction to Solid State Physics (8th ed.), Ch. 7-9
  (`kittel-cm`).
- Ashcroft and Mermin, Solid State Physics, Ch. 10
  (`ashcroft-mermin`).

## Stretch goals

- Add a second orbital / next-nearest hopping (band warping).
- The SSH winding number and the topological edge state.

## Risk register

- The 1D DOS is integrably singular at the edges; it is clamped for
  display only, the integral test uses the analytic form.
- The 2D Fermi surface is marched on a finite grid; the density of
  contour points scales with the grid, which the tests allow for.
