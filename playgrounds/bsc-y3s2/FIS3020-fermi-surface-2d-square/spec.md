---
title: Fermi Surface 2D Square Lattice
slug: fermi-surface-2d-square
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS3020
supporting_ucs: []
curriculum_year: bsc-y3s2
primary_citation: ashcroft-mermin
primary_chapter: 8
hook: 'Fill a square-lattice band with electrons and the Fermi surface morphs: a small pocket at low filling, a perfectly nested square at half-filling, an inverted pocket when full.'
one_paragraph: 'Tight-binding electrons on a square lattice have the dispersion E(k) = -2t (cos k_x + cos k_y). The Fermi surface, the constant-energy contour at the filling level, changes shape dramatically as electrons are added: a small closed loop around the zone centre at low filling, the perfectly nested square diagonal at half-filling (the nesting that drives antiferromagnetism in the Hubbard model), then an inverted pocket near the zone corner when nearly full. The playground samples the band and draws the Fermi surface and the density of states as you tune the filling. Reference: Ashcroft and Mermin, Solid State Physics, Ch. 10.'
tags: [solid-state, animation, live-readout]
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

# Fermi surface on a 2D square lattice

## Explainer

### What you are looking at

The Fermi surface is the boundary in momentum space between filled and
empty electron states. Its shape decides almost every electronic
property of a metal. The playground fills a simple square-lattice band
and shows the Fermi surface morph as you add electrons, including the
special nested shape at half filling that drives magnetism.

### The band

Tight-binding electrons hopping between nearest neighbors on a square
lattice have the dispersion

$$E(k_x,k_y) = -2t\big(\cos k_x + \cos k_y\big),$$

a band of total width $8t$ running from $-4t$ at the zone center
($\Gamma$) to $+4t$ at the corner ($M$). Fill states up to the Fermi
energy $E_F$ set by the electron count.

### How the Fermi surface changes with filling

- Low filling: only states near the band bottom are occupied, so the
  Fermi surface is a small closed loop around $\Gamma$, nearly
  circular (free-electron-like).
- Half filling ($E_F = 0$): the Fermi surface is the square joining the
  zone-edge midpoints. It is *perfectly nested*, large parallel
  segments connected by a single wavevector $\mathbf Q = (\pi,\pi)$.
  That nesting makes the electron gas unstable to a
  $(\pi,\pi)$ density modulation, the origin of antiferromagnetism in
  the half-filled Hubbard model and a key idea in cuprate
  superconductivity.
- High filling: the surface inverts to a small closed loop around the
  corner $M$ (now it bounds the empty states, a hole pocket).

The playground sweeps the filling and draws the Fermi surface and the
density of states (which has a logarithmic van Hove spike exactly at
half filling). Reading the Fermi-surface shape is how real metals'
conduction and instabilities are understood.

### Things to try

- Low filling: a small $\Gamma$-centered pocket, free-electron-like.
- Tune to half filling and see the nested square and the van Hove DOS
  spike.
- Overfill and watch the surface flip to an $M$-centered hole pocket.

### Where this comes from

The tight-binding square-lattice dispersion, the Fermi-surface
evolution, nesting, and the van Hove singularity follow Ashcroft and
Mermin, *Solid State Physics*, Chapter 8.

## Physical setup

Tight-binding electrons on a square lattice with nearest-neighbor hopping. Dispersion $E(k_x, k_y) = -2t (\cos k_x + \cos k_y)$ over the Brillouin zone $(k_x, k_y) \in [-\pi, \pi]^2$. The bandwidth is $8t$ from $-4t$ (Gamma point) to $+4t$ (M point).

At low filling the Fermi surface is a closed loop near Gamma; at half-filling it is the square diagonals (perfect nesting; this drives the antiferromagnetic instability in the Hubbard model); at high filling it inverts to closed loops near M.

## Numerical method

Direct sampling of $E(k_x, k_y)$ on an N x N grid, sort to find $E_F$ at the requested filling. Density of states is a histogram on the same grid.

## Controls

- Filling $f$ from 0.01 to 0.99.

## Expected qualitative features

1. Low $f$: occupied (yellow) k-states form a circle around the center; DOS slowly rising from the lower band edge.
2. Half-filling: occupied states form a checkerboard-tilted square; the DOS has a sharp van Hove singularity at $E = 0$.
3. High $f$: occupied states fill all of BZ except for a small region near the corners.
4. $E_F$ runs from $-4t$ to $+4t$ as $f$ goes 0 to 1.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| dispersion bottom at $(0, 0)$ is $-4t$ | within $10^{-12}$ | invariants test |
| dispersion top at $(\pi, \pi)$ is $+4t$ | within $10^{-12}$ | invariants test |
| half-filling $E_F \approx 0$ | $|E_F| \lt 0.1 t$ at $N = 100$ | invariants test |
| empty filling $E_F < -3.9 t$ | strict | invariants test |
| full filling $E_F > 3.9 t$ | strict | invariants test |
| DOS histogram sums to $N^2$ | exact | invariants test |
| continuum Fermi-circle approximation at $f = 0.5$ gives $k_F = \sqrt{2\pi}$ | within $10^{-12}$ | invariants test |

All confirmed in `invariants.test.mjs` (8 tests passing).

## Limiting cases for verification

- $f \to 0$: free-electron continuum, $E_F \to -4t$, Fermi disk small.
- $f = 0.5$: perfect nesting, $E_F = 0$, van Hove peak.
- Hubbard model would add interaction at half-filling.

## Visual fallback

If KaTeX or Canvas2D is unavailable, the slider still operates.

## Citations

- Ashcroft-Mermin, *Solid State Physics*, Ch. 8 (`ashcroft-mermin`).
- Kittel, *Introduction to Solid State Physics*, Ch. 7 (`kittel-cm`).

## Stretch goals

- Add next-nearest-neighbor hopping $t'$ to break particle-hole symmetry and curve the Fermi surface.
- Show the Fermi velocity $v_F = \nabla_k E$ on the Fermi surface.
- 3D extension to cubic lattice.

## Risk register

- The grid resolution $N = 60$ for the BZ display vs $N = 80$ for the DOS keeps the rendering fast; small bias at half-filling but well below the test thresholds.
