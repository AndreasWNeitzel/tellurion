---
title: Particle-Mesh Self-Gravitating 2D Disk
slug: particle-mesh-2d-disk
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: AST3015
supporting_ucs: [MAA-GD]
curriculum_year: bsc-y3s1
hook: 'A thousand particles pull on each other through a grid, not pair by pair; the disk they form grows the swing-amplified spiral patterns galaxies show.'
one_paragraph: 'Computing gravity between N particles pair by pair costs order N^2; the particle-mesh method instead deposits mass onto a grid by cloud-in-cell, solves Poisson once with an FFT, and interpolates the force back, for near-linear cost. The playground evolves a flat exponential disk of 1500 self-gravitating particles this way on a periodic grid, and the disk spontaneously grows transient spiral arms through swing amplification, the same mechanism invoked for real galactic spirals. It is the cheap N-body scheme behind cosmological simulations. Reference: Hockney and Eastwood, Computer Simulation Using Particles; Binney and Tremaine, Galactic Dynamics.'
tags: [exoplanets, numerics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Particle-mesh 2D self-gravitating disk

## Explainer

### What you are looking at

A flat disk of 1500 stars, each pulling on every other by gravity. Done
naively that is 1500-squared force calculations per step. The
particle-mesh trick does it in near-linear time by routing gravity
through a grid, and the disk it evolves spontaneously grows spiral
arms, the same way model galaxies do.

### The physics

Each particle obeys Newtonian gravity from the collective potential:

$$m_i\,\ddot{\mathbf x}_i = -\nabla\phi(\mathbf x_i),
  \qquad \nabla^2\phi = 4\pi G\rho.$$

Solving Poisson's equation for every particle pair is the expensive
part.

### The particle-mesh method

Instead of summing pairs, four cheap steps:

1. Deposit each particle's mass onto a grid by cloud-in-cell (each
   particle smeared over its 4 nearest cells).
2. Solve $\nabla^2\phi = 4\pi G\rho$ on the grid in one shot with
   FFTs (Poisson is trivial in Fourier space: $\hat\phi_k =
   -4\pi G\hat\rho_k / k^2$).
3. Finite-difference the grid potential to get the force.
4. Interpolate the force back to the particles and leapfrog them
   forward.

Cost scales as $N + N_\text{grid}\log N_\text{grid}$ instead of
$N^2$, which is why cosmological simulations use this scheme for
billions of particles. The trade-off is resolution: forces are softened
at the grid scale.

### Why spiral arms appear

A cold, rotating, self-gravitating disk is not perfectly stable. Small
density ripples get sheared by differential rotation and amplified by
self-gravity (swing amplification), so the disk spontaneously grows
transient trailing spiral arms, the same mechanism invoked for real
galactic spirals. The playground evolves the disk and you watch arms
form, wind up, and dissolve.

### Things to try

- Watch transient spiral patterns grow and shear away, not a rigid
  fixed spiral.
- Note the arms are a collective gravitational instability, not stars
  on fixed tracks.
- Recall the cost: this is N-body gravity made affordable by the grid.

### Where this comes from

The particle-mesh Poisson solve follows Hockney and Eastwood,
*Computer Simulation Using Particles*; the swing-amplification origin
of spiral arms follows Binney and Tremaine, *Galactic Dynamics*, 2nd
ed.

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
