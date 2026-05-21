---
title: Tight-Binding Band Structure
slug: band-structure-tight-binding
status: verified
audience: portfolio
created: 2026-05-17
hook: 'One hopping integral makes a band: cosine in 1D, a gap when you dimerize, a van Hove saddle and a square Fermi surface in 2D.'
one_paragraph: 'The tight-binding model: one orbital per site, an on-site energy and a hopping t. Bloch theorem gives E(k) = eps0 - 2t cos(ka) for the 1D chain (width 4t, band-edge effective mass hbar^2/2ta^2); a dimerized (SSH) chain has the 2x2 Bloch Hamiltonian with eigenvalues +-sqrt(t1^2 + t2^2 + 2 t1 t2 cos ka) and a zone-boundary gap 2|t1-t2|; the 2D square lattice has E = -2t(cos kx a + cos ky a) with a van Hove saddle at (pi,0). The scene draws the dispersion with states filled to a draggable Fermi energy and the density of states, or the 2D band as a heatmap with its Fermi-surface contour, so you can see how a single hopping parameter sets the bandwidth, the band gap, the effective mass and (by where E_F falls) whether the solid is a metal or an insulator. Reference: Ashcroft and Mermin, Solid State Physics, Chapter 10; Simon, The Oxford Solid State Basics, Chapter 11.'
tags: [condensed-matter, band-structure, quantum, multi-panel, live-readout]
difficulty: 4
tier: advanced
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 6
curriculum_year: 'L:F-3Y-2S'
primary_uc: FIS3005
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

# Tight-Binding Band Structure

## Explainer

### What you are looking at

Let one electron orbital sit on each atom of a chain and let electrons
hop between neighbors. The allowed energies are no longer sharp atomic
levels but a continuous band. Dimerize the chain and a gap opens with
protected edge states. This tight-binding picture is the simplest route
to band structure, insulators, and topology.

### The 1D chain

With on-site energy $\epsilon_0$ and nearest-neighbor hopping $t$, the
dispersion is a single cosine band:

$$E_{1D}(k) = \epsilon_0 - 2t\cos(ka).$$

Everything physical reads off it: the group velocity is the slope
$v = 2ta\sin(ka)$, the effective mass is set by the curvature
($m^* = \hbar^2/2ta^2$ at the band bottom), and the density of states
$g(E) = 1/[\pi\sqrt{(2t)^2-(E-\epsilon_0)^2}]$ diverges at the band
edges (1D van Hove singularities). The band is exactly $4t$ wide.

### The SSH chain: a gap and topology

Alternate two hoppings $t_1, t_2$ (the Su-Schrieffer-Heeger model) and
the single band splits into two:

$$E(k) = \pm\sqrt{t_1^2 + t_2^2 + 2 t_1 t_2\cos ka},$$

with a gap of $2|t_1 - t_2|$ at the zone boundary. The gap closes only
when $t_1 = t_2$ (back to the uniform chain). Which bond is stronger
distinguishes two topologically different insulators; the
"topological" one carries protected zero-energy states at its ends.
The 2D square lattice generalizes to
$E = -2t(\cos k_x a + \cos k_y a)$, whose Fermi surface morphs from a
pocket to a nested square to an inverted pocket as you fill it.

### Things to try

- Watch the 1D band as a cosine; note the flat spots (zero group
  velocity) at the band edges and the DOS spikes there.
- Dimerize ($t_1 \ne t_2$) and watch a gap open; set $t_1 = t_2$ and
  watch it close.
- Switch to 2D and fill the band: the Fermi surface goes pocket ->
  nested square (at half-filling) -> inverted pocket.

### Where this comes from

The tight-binding dispersion, group velocity and effective mass, the
SSH gap, and the 2D band follow Ashcroft and Mermin, *Solid State
Physics*, Chapter 10, with the SSH model from Su, Schrieffer and
Heeger (1979).

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
- dimerization t2/t1: opens the SSH gap. Shown only for the SSH
  lattice, since it does not enter the 1D-chain or 2D-square
  Hamiltonian; hidden otherwise so no control looks dead.
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
