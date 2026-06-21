---
title: Frustrated Triangular Antiferromagnet
slug: frustrated-triangular-af
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2014
primary_citation: newmanbarkema1999
supporting_ucs: [FIS2018, MAA-NM]
curriculum_year: bsc-y2s1
hook: 'Put antiferromagnetic spins on a triangle and they cannot all disagree at once; that frustration leaves the ground state disordered down to absolute zero.'
one_paragraph: 'On a triangular lattice every small triangle of antiferromagnetic Ising spins is frustrated: at most two of the three bonds can be satisfied, so no arrangement makes every neighbour pair happy. Wannier showed this removes the finite-temperature phase transition entirely and leaves a hugely degenerate ground state with extensive residual entropy. The playground runs single-spin Metropolis dynamics with the spins drawn as up/down discs on a triangular lattice, the fully frustrated triangles flagged in red (a toggle swaps to the three-sublattice chirality domains). The diagnostic shows the satisfied-bond fraction climbing only to its 2/3 ceiling (one frustrated bond per triangle is unavoidable) while the magnetization stays near zero, so the lattice stays disordered and restless even as the temperature falls toward zero, never freezing into a clean pattern the way an unfrustrated antiferromagnet would. It is the cleanest illustration of geometric frustration. Reference: Wannier 1950, Phys. Rev. 79, 357.'
tags: [thermodynamics, statistical-physics, animation, live-readout]
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
  - Cool the lattice and the red frustrated triangles thin out but never vanish.
  - The satisfied-bond fraction rises toward 2/3 and stalls; |M| stays near zero (no ordering).
  - Toggle to chirality domains to see the three-sublattice mosaic emerge from disorder.
references:
  - "Newman, Barkema, Monte Carlo Methods in Statistical Physics."
---

# Frustrated triangular antiferromagnet

## Explainer

### What you are looking at

Put antiferromagnetic spins (each wanting to be opposite its
neighbours) on a triangular lattice and they cannot all be satisfied
at once: every triangle has a built-in conflict. This is geometric
frustration, and the playground shows its strange consequence, a
system that never orders and keeps a huge ground-state degeneracy
even at zero temperature.

### The frustration

Ising spins $s_i=\pm1$ on a triangular lattice with
$E = J\sum_{\langle ij\rangle} s_i s_j$, $J>0$ (antiferromagnetic, so
neighbours prefer to be opposite). On a single triangle you cannot
make all three pairs anti-aligned: if A is up and B is down, C wants
to be opposite to both and fails one. Every elementary triangle
therefore has at least one frustrated (unsatisfiable) bond. There is
no way to tile the plane that satisfies all bonds.

### No ordering, residual entropy

The consequences are profound and exactly known (Wannier 1950):

- There is no finite-temperature phase transition. Unlike the square
  lattice (which orders below $T_c$), the triangular
  antiferromagnet stays disordered down to $T=0$.
- The ground state is massively degenerate: a finite entropy per
  spin survives at $T=0$,
$$\frac{S(0)}{N k_B} = \frac{2}{\pi}\int_0^{\pi/3}
  \ln\!\big(2\cos x\big)\,dx \approx 0.323,$$

  a violation of a naive third law and the hallmark of frustration.
  The system fluctuates forever among an exponentially large set of
  equal-energy configurations.

This is the prototype of frustration that underlies spin ice, spin
glasses, and the order-by-disorder phenomenon. The playground runs
Monte Carlo on the triangular lattice and shows it refusing to order
and the per-triangle frustrated bond that can never be removed.

### Things to try

- Cool the lattice and watch it stay disordered (no ordering
  transition), unlike a square-lattice antiferromagnet.
- Highlight a triangle and confirm one bond is always frustrated, at
  any temperature.
- Estimate the residual entropy: many distinct ground states at the
  same minimum energy.

### Where this comes from

The triangular Ising antiferromagnet, the absence of ordering and the
residual entropy follow Wannier, Phys. Rev. 79, 357 (1950), and
Moessner and Ramirez, Physics Today 59, 24 (2006).

## Physical setup

Antiferromagnetic Ising spins on a 2D triangular lattice with periodic boundaries. Each spin prefers to be opposite to its 6 neighbors. Geometric frustration: on every 3-spin plaquette, you cannot satisfy all three anti-alignments at once. Wannier 1950 showed there is no finite-T phase transition; the T = 0 ground state has extensive residual entropy.

## Governing equations

  E = +J sum_{<i, j>} s_i s_j,   J = 1,  s in {+1, -1}.

Single-spin Metropolis with dE_flip = -2 J s_ij sum_neighbors.

## Numerical method

Pure-JS Int8Array spin grid; PCG64 RNG; one sweep = L^2 attempted updates. Slim per-playground implementation matching ising-triangular's pattern, with sign flip for AF.

## Controls

- T: temperature, 0.05 - 5.0, default 0.5
- L: lattice size 32 - 96, default 64
- speed: sweeps per render frame, 1 - 8, default 3
- Cold (stripe) / Hot (random): initialization choice

## Expected qualitative features

1. Low-T sea of competing domains, never settling to long-range order.
2. Random patches of three same-spin "frustrated" plaquettes always present.
3. No critical slowing-down or order-parameter onset as T decreases.

## Invariants and acceptance thresholds

- |m| bounded by 1, e bounded by +/- 3 J.
- High-T disorder: |m| < 0.05 at T = 5.0 after 200 sweeps.
- Cold-start stripe at T = 0.05: e < -0.8.
- Frustrated-plaquette fraction at T = 1.0: in (0, 0.5).

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- T -> infinity: random spins, m = 0 within O(N^{-1/2}), e -> 0.
- T -> 0: ground-state manifold; single-spin Metropolis gets stuck.
- Ferromagnetic sign (J -> -J) recovers the ising-triangular playground.

## Visual fallback

Canvas2D only.

## Citations

- Wannier 1950, "Antiferromagnetism. The triangular Ising net", Phys. Rev. 79, 357.
- Newman and Barkema 1999, Monte Carlo Methods in Statistical Physics, Section 5.4.
- Diep 2013, Frustrated Spin Systems, Chapter 1 (background only).

## Stretch goals

- Add Wolff cluster algorithm.
- Add a structure-factor plot to show absence of Bragg peaks.

## Risk register

- Single-spin Metropolis has very long autocorrelation at low T; the simulation looks stuck past T < 0.2.
- The displayed row-offset is a visual hint; the underlying lattice is a rectangular array with the standard triangular neighbor map.
