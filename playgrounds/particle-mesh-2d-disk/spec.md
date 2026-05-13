---
title: Particle-Mesh Self-Gravitating 2D Disk
slug: particle-mesh-2d-disk
status: verified
audience: portfolio
created: 2026-05-13
---

# Particle-mesh 2D self-gravitating disk

## Physical setup

A flat 2D disc of 1500 self-gravitating particles in an exponential surface-density profile. Gravity solved via particle-mesh on a 32 x 32 periodic grid using cloud-in-cell (CIC) deposit and interpolation.

## Governing equations

  m_i d^2 x_i / dt^2 = -grad phi(x_i)
  laplacian phi = 4 pi G rho

Units G = 1.

## Numerical method

PM scheme:
1. CIC deposit onto NGRID x NGRID grid.
2. Solve 2D Poisson via separable 1D DFTs (NGRID^3 total cost).
3. Centered finite difference for grad phi.
4. CIC interpolate to particles; leapfrog push.

NGRID = 32, L = 8.0, NPARTICLES = 1500.

## Controls

- disc R (scale radius): 0.4 - 2.0, default 1.0
- speed: PM steps per render frame, 1 - 5, default 1
- Reset / Pause / Play

## Expected qualitative features

1. Initial: exponential disc rotating with omega(r) ~ 1/r.
2. After t ~ 1: density wakes from self-gravity.
3. After t ~ 3: transient spiral arms.
4. Long times: disc heats up.

## Invariants and acceptance thresholds

- Total mass exact to 1e-12.
- Angular momentum drift < 30 percent over 30 steps.
- Particles remain in [0, L).
- Initial Lz > 0.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- M = 0: free streaming.
- R large: uniform density, no gravity gradient.

## Visual fallback

Canvas2D only.

## Citations

- Hockney and Eastwood 1988, Computer Simulation Using Particles, Chapters 5 - 7 (`hockneyeastwood1988`).
- Binney and Tremaine 2008, Galactic Dynamics 2e, Chapter 6 (numerical methods).

## Stretch goals

- Real 2D FFT for larger NGRID.
- Cold collapse, bar instability presets.
- Fixed dark-matter halo.

## Risk register

- 32x32 grid is coarse; spiral structure is washed out.
- Periodic BC: edge effects when the disc is too large.
