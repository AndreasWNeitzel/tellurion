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

# Particle-mesh 2D self-gravitating disk

## Explainer

### What you are looking at

A flat disk of 1500 stars, each pulling on every other by gravity. Done
naively that is 1500-squared force calculations per step. The
particle-mesh trick does it in near-linear time by routing gravity
through a grid, and the disk it evolves spontaneously grows spiral
arms, the same way model galaxies do.

### The physics

Each particle obeys Newtonian gravity sourced by the collective mass
distribution:

$$\boxed{\;m_i\,\ddot{\mathbf x}_i = -\nabla\phi(\mathbf x_i),
       \qquad \nabla^2 \phi = 4 \pi G \rho.\;}$$

A direct sum over pairs costs $O(N^2)$ per step; for $N = 1500$ that
is 2.25 million force evaluations every step. The particle-mesh
method drops the cost to $O(N + N_g \log N_g)$ where $N_g$ is the
grid resolution.

### The particle-mesh algorithm

Four cheap steps per timestep:

1. *Mass deposition* (cloud-in-cell). For each particle at position
   $\mathbf x_i$, distribute its mass to the four nearest grid nodes
   by bilinear weights:

   $$\rho_g = \frac{1}{\Delta x^2}\,\sum_i m_i\,W(\mathbf x_i - \mathbf x_g),$$

   where $W$ is the CIC kernel $W(\mathbf r) = (1 - |r_x|/\Delta x)(1 - |r_y|/\Delta x)$
   for $|r| < \Delta x$ and zero otherwise.

2. *Solve Poisson by FFT*. In Fourier space $\nabla^2 \to -k^2$, so

   $$\hat\phi(\mathbf k) = -\,\frac{4 \pi G\,\hat\rho(\mathbf k)}{k^2},
   \qquad k = |\mathbf k|.$$

   The $k = 0$ mode is set to zero (the mean density does not
   gravitate in a periodic box). One forward FFT + one division by
   $k^2$ + one inverse FFT and the potential is everywhere on the
   grid.

3. *Differentiate*. The gravitational acceleration is the gradient,
   computed by centred finite differences:

   $$\mathbf g_g = -\nabla\phi_g \approx -\frac{1}{2\,\Delta x}
   \left[\phi_{g+\hat x} - \phi_{g-\hat x},\;
         \phi_{g+\hat y} - \phi_{g-\hat y}\right].$$

4. *Interpolate back* to each particle (CIC again, same weights), then
   advance positions with a kick-drift-kick leapfrog:

   $$\mathbf v^{n+1/2} = \mathbf v^n + \tfrac{1}{2}\,\Delta t\,\mathbf g^n,\quad
   \mathbf x^{n+1} = \mathbf x^n + \Delta t\,\mathbf v^{n+1/2},\quad
   \mathbf v^{n+1} = \mathbf v^{n+1/2} + \tfrac{1}{2}\,\Delta t\,\mathbf g^{n+1}.$$

The leapfrog is second-order accurate and symplectic, so energy
drift is bounded over long integrations.

### Why a cold disk grows spiral arms: Toomre's Q and swing amplification

The local stability of a thin self-gravitating disk against axisymmetric
perturbations is set by the Toomre (1964) parameter

$$\boxed{\;Q = \frac{\sigma_R\,\kappa}{3.36\,G\,\Sigma},\;}$$

where $\sigma_R$ is the radial velocity dispersion, $\kappa$ the
epicyclic frequency, $\Sigma$ the surface mass density, and $G$
Newton's constant. $Q < 1$ collapses; $Q > 1$ is axisymmetrically
stable. But for $1 < Q \lesssim 2$ the disk is still NON-axisymmetrically
unstable: trailing density perturbations get sheared into a tighter
pitch, and during the brief window when the pattern is sheared in
phase with self-gravitational response, the amplitude is boosted by
factors of 30 to 100 (Goldreich and Lynden-Bell 1965, Toomre 1981).
This is *swing amplification*. The arms are transient, recurrent,
and "flocculent" rather than rigid grand-design patterns.

### Symbols, at a glance

- $\mathbf x_i$, $\mathbf v_i$, $m_i$, particle position, velocity,
  mass.
- $\rho(\mathbf x, t)$, mass density; $\phi(\mathbf x, t)$, gravitational
  potential.
- $G = 6.674 \times 10^{-11}\,\mathrm{m^3\,kg^{-1}\,s^{-2}}$.
- $\Delta x$, grid spacing; $\Delta t$, timestep.
- $\Sigma$, disk surface density (mass per area).
- $\sigma_R$, radial velocity dispersion.
- $\kappa = \sqrt{R\,d\Omega^2/dR + 4\Omega^2}$, the epicyclic
  frequency, set by the rotation curve $\Omega(R)$.
- $Q$, Toomre stability parameter.

### Things to try

- Watch transient spiral patterns grow and shear away, not a rigid
  fixed spiral.
- Note the arms are a collective gravitational instability, not stars
  on fixed tracks.
- Recall the cost: this is N-body gravity made affordable by the grid.

### Bibliographic origin

Particle-mesh + leapfrog with PM Poisson: Hockney and Eastwood,
*Computer Simulation Using Particles* (2nd ed., CRC 1988), Ch. 5, 6.
The Toomre Q criterion: Toomre, *Astrophys. J.* **139** (1964) 1217.
Swing amplification: Goldreich and Lynden-Bell, *Mon. Not. R. Astron.
Soc.* **130** (1965) 125, and the modern treatment in Toomre, in
*The Structure and Evolution of Normal Galaxies*, ed. Fall and
Lynden-Bell (Cambridge 1981), 111. Modern galactic-dynamics textbook:
Binney and Tremaine, *Galactic Dynamics* (2nd ed., Princeton 2008),
Ch. 6 (instabilities), Sec. 3.2 (Poisson solver).

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
