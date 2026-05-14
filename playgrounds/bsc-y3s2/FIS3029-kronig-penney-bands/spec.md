---
title: Kronig-Penney Band Structure
slug: kronig-penney-bands
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS3029
supporting_ucs: [FIS3020]
curriculum_year: bsc-y3s2
hook: 'STATUS: needs_hook'
one_paragraph: 'STATUS: needs_paragraph'
tags: [quantum, atomic-molecular, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Kronig-Penney band structure

## Physical setup

A 1D crystal with delta-function spikes on a periodic lattice (period a, dimensionless strength P). The energy spectrum splits into allowed bands and forbidden gaps. The simplest textbook model in solid-state physics that produces a band structure.

## Governing equations

  cos(k a) = cos(q a) + (P / q a) sin(q a),  q = sqrt(2 m E) / hbar.

In dimensionless form with hbar^2 / (2 m a^2) = 1, the energy is epsilon = (q a)^2.

f(qa) = cos(qa) + (P / qa) sin(qa) must lie in [-1, +1] for a real Bloch wave-vector k a to exist. Otherwise the energy is in a band gap.

## Numerical method

Sample f(qa) on a 4000-point uniform epsilon grid. Locate boundaries of allowed bands by sign-change in (|f| - 1). Refine each boundary to machine precision by bisection. Build dispersion curves epsilon(ka) inside each band using k a = arccos f.

## Controls

- P (strength): dimensionless lattice strength, 0.5 - 20, default 4.0
- eps max: maximum displayed energy, 20 - 120, default 60

## Expected qualitative features

1. P = 0: no periodic potential; f reduces to cos(qa); all energies allowed.
2. Small P: narrow gaps open at qa = pi, 2 pi (Brillouin zone boundaries).
3. Large P: gaps widen, bands narrow; in the tight-binding limit the bands flatten.

## Invariants and acceptance thresholds

- f(0, P) = 1 + P exact.
- f(pi, P) = -1 exact.
- P = 0: total allowed-band length > 95 percent of eps range.
- P = 12: at least 3 distinct bands in [0, 80].
- Band edges satisfy |f| = 1 within 0.02.
- Inside a gap, kaForEnergy returns NaN.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- P -> 0: free-electron parabola, no gaps.
- P -> infinity: tight-binding limit, very narrow bands centered on the free-atom levels.
- qa = n pi (Brillouin boundaries): f = +/- 1, on the band edge.

## Visual fallback

Canvas2D only.

## Citations

- Shankar 1994, Principles of Quantum Mechanics, 2e, Section 19.3 (`shankar1994`).
- Ashcroft and Mermin 1976, Solid State Physics, Chapter 8.
- Sakurai and Napolitano 2017, Modern QM 3e, Section 5.7.

## Stretch goals

- Add a finite-well "Kronig-Penney with square barriers" toggle (more realistic than delta combs).
- Add a density-of-states plot derived from the dispersion.
- Add a chemical-potential cursor that highlights which bands are occupied.

## Risk register

- For very large P (> 30) the recurrence-based dispersion sampling can miss narrow bands; the slider is capped at 20.
- Below P = 0.5 the gaps are very narrow and the bisection might land on either side of the boundary; visually unaffected.
