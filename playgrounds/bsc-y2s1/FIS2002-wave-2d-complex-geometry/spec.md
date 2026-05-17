---
title: 2D Waves in a Drawable Geometry
slug: wave-2d-complex-geometry
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Send a circular wave at two slits and the textbook interference fan blooms past the wall, the central maximum landing exactly on the axis.'
one_paragraph: 'The scalar wave equation in two dimensions, solved by an explicit leapfrog scheme with rigid walls and an absorbing sponge. Presets give a free circular wavefront, single-slit diffraction, double-slit interference with an on-axis central maximum, and an obstacle that casts a shadow the wave bends into. The primary scene is the physical displacement field with a tanh-compressed water map so the faint transmitted pattern is visible; the side panel reads the screen intensity along a far column. The numerics live in the shared wave engine (extended here with rigid barriers, slits and a sponge); the time step satisfies the 2D CFL bound. The shared engine and the scene layer are gate-tested for wave speed, CFL, damped-energy decay, slit-versus-wall transmission, the symmetric central double-slit maximum, hard-wall phase inversion, and circular-wavefront isotropy.'
tags: [waves, pde, diffraction, interference, animation, live-readout]
difficulty: 4
tier: advanced
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 5
curriculum_year: 'L:F-2Y-1S'
primary_uc: FIS2002
share_state_keys: []
---

# 2D Waves in a Drawable Geometry

## Physical setup

A vibrating membrane (or shallow water) in a 2D box with rigid
obstacles. A monochromatic point source on the left radiates toward a
wall with slits or an obstacle; the far side shows diffraction and
interference. The domain edges are an absorbing sponge so the pattern
is not contaminated by box reflections.

## Governing equations

The damped scalar wave equation

`u_tt = c^2 (u_xx + u_yy) - gamma u_t`,

with rigid (Dirichlet `u = 0`) barriers. Two coherent slits give the
two-source condition `r1 - r2 = m lambda`; on the symmetry axis the
path difference is zero, so a centred double slit is constructive
there in any regime.

## Numerical method

Explicit leapfrog (5-point Laplacian), `dx = 1`, time step at the 2D
CFL bound `c dt < dx / sqrt(2)` (safety 0.9). Rigid cells are held at
zero; a quadratic sponge band absorbs outgoing waves. The engine is
`shared/js/engine/wave-2d-cpu.js`, extended with `makeBarrier`,
`addWallWithSlits`, `makeSponge`, `stepBarriered` and `addSourceRing`;
the original four exports are unchanged so the existing wave heroes do
not regress. Reference: Crawford, *Waves* (Berkeley Physics Course
Vol. 3), Ch. 7 (`crawford-waves`); Hecht, *Optics* (5th ed.), Ch. 10.

## Controls

- preset: free point source, single slit, double slit, obstacle.
- wavelength (cells): sets the source wavelength and the fringe scale.
- damping gamma: attenuates the field with propagation distance.
- Reset, Pause.

## Expected qualitative features

- Free: a circular wavefront expanding at speed `c`.
- Single slit: a single broad diffraction lobe.
- Double slit: a symmetric interference fan with the central maximum
  on the axis and fringes whose spacing follows the two-source law.
- Obstacle: a shadow behind the block that diffraction partly fills.
- Raising `gamma` dims the far field; the readout energy drops.

## Invariants and acceptance thresholds

Engine (`tests/engines/wave-2d-cpu.test.mjs`):
- Disturbance front advances linearly in time (wave speed).
- Bounded at the CFL `dt`, divergent well above it.
- Damped total energy decreases monotonically and exponentially.
- Slitless wall blocks transmission; a slit passes `> 8x` the energy.
- Double slit: central maximum within 6 cells of the axis, mirror
  symmetry `< 0.18`, on-axis amplitude `> 1.5x` the local mean.
- Hard wall inverts the reflected pulse (fixed-end phase flip).

Scene (`invariants.test.mjs`):
- Four named presets; CFL `dt = 0.9 / sqrt(2)` at `c = 1`.
- Free source radiated-amplitude anisotropy `< 0.3` (near ring),
  `< 0.5` farther out (5-point-stencil numerical anisotropy).
- Slitless wall vs single slit transmission ratio `> 6`.
- Double slit symmetric with a strong on-axis maximum.
- Obstacle far energy between 2% and 85% of the unobstructed value.
- Damping drains the scene energy below half within 400 steps.

## Limiting cases for verification

- No barrier: the free source reproduces a circular wavefront.
- `gamma = 0`: energy is conserved up to sponge absorption.

Source: Crawford, *Waves* (Berkeley Physics Course Vol. 3), Ch. 7
(`crawford-waves`); Hecht, *Optics* (5th ed.), Ch. 10 (`hecht2017`).
