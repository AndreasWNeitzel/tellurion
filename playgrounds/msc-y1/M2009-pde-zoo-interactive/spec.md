---
title: "PDE Zoo: Wave, Heat, Laplace, Schrodinger and Burgers"
slug: pde-zoo-interactive
status: verified
audience: portfolio
created: 2026-05-18
primary_uc: M2009
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: leveque2007
hook: 'Five of the most important equations in physics, solved on the same grid so you can see what each one does to a shape: the wave equation swings it back and forth, the heat equation smooths it away, Laplace finds the resting shape, Schrodinger spreads a quantum packet, and Burgers steepens into a shock. Where the exact answer is known it is drawn behind the computed one so you can watch the error.'
one_paragraph: 'Pick an equation and watch the same finite-difference grid behave completely differently. The wave equation conserves energy and oscillates; the heat equation only ever smooths and fades; the Laplace/Poisson equation skips time entirely and jumps to the steady shape; the Schrodinger equation keeps its total probability fixed while the wavepacket spreads; and Burgers, the one-dimensional cousin of Navier-Stokes, sharpens a smooth wave into a shock that viscosity then rounds off. For the cases with a known exact solution the analytic curve is drawn behind the numeric one and the gap between them is plotted as the error, so you can see how good the numerical method is. A Crank-Nicolson scheme advances each equation, and where an exact solution exists the analytic curve is drawn behind the numeric one so the discretisation error is visible. Reference: LeVeque, Finite Difference Methods for Ordinary and Partial Differential Equations, Chapters 9 to 10.'
tags: [math-methods, pde, finite-difference, numerics, live-readout]
difficulty: 5
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 6
share_state_keys: [eq, p]
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
references:
  - "LeVeque, Finite Difference Methods for Ordinary and Partial Differential Equations: Steady-State and Time-Dependent Problems."
---

# PDE Zoo: Wave, Heat, Laplace, Schrodinger and Burgers

## Explainer

### What you are looking at

Almost all of classical and quantum physics is one of a handful of
partial differential equations. The playground runs five of them on
the same 1D grid so you can watch, side by side, how each one moves
information: waves travel, heat smears, Laplace relaxes, Schrodinger
disperses, Burgers steepens into a shock.

### The five canonical equations

Each PDE has a distinct character (its type) that dictates its
behavior and the right numerical scheme:

- Wave equation (hyperbolic, energy-conserving): a disturbance
  propagates at fixed speed without losing shape,
$$\partial_t^2 u = c^2\,\partial_x^2 u.$$
- Heat equation (parabolic, dissipative): gradients smooth out,
  sharp features decay fastest,
$$\partial_t u = D\,\partial_x^2 u.$$
- Laplace / Poisson (elliptic, steady): no time at all, the solution
  is the smoothest field matching the boundaries,
$$\partial_x^2 u = -\rho.$$
- Schrodinger (dispersive, unitary): a complex wavepacket whose
  norm is conserved but whose components travel at different speeds,
$$i\hbar\,\partial_t \psi = -\frac{\hbar^2}{2m}\,\partial_x^2 \psi
  + V\psi.$$
- Burgers (nonlinear, shock-forming): the 1D analogue of fluid flow,
  where the solution carries itself and steepens into a shock,
$$\partial_t u + u\,\partial_x u = \nu\,\partial_x^2 u.$$

### Why the scheme must match the type

The lesson is that you cannot use one solver for all of them. The
wave equation needs a scheme that conserves energy (an explicit
leapfrog respecting the CFL limit $c\,\Delta t \le \Delta x$); the
heat equation needs one that is stable under diffusion
($D\,\Delta t \le \tfrac12\Delta x^2$ explicitly, or an implicit
step); Laplace is solved by iterative relaxation to a fixed point;
Schrodinger needs a unitary (norm-preserving) integrator or the
probability leaks; Burgers needs an upwind/conservative scheme or the
shock smears or blows up. Where an exact solution exists the
playground overlays it and plots the error, so you see each scheme
succeed only on its own equation.

### Things to try

- Switch equations and watch the same initial bump do five
  completely different things (travel, decay, relax, disperse,
  shock).
- Push the time step past the CFL/diffusion limit and watch the
  unstable scheme blow up.
- Check the Schrodinger norm and the wave energy staying constant
  while the heat solution's energy decays.

### Where this comes from

The classification of PDEs and the matched numerical schemes follow
Strauss, *Partial Differential Equations: An Introduction*, and
LeVeque, *Finite Difference Methods for Ordinary and Partial
Differential Equations*.

## Physical setup

One shared 1D grid on [0, 1] solving five canonical partial differential equations, each with the numerical scheme that suits it: the wave equation (hyperbolic, energy-conserving), the heat equation (parabolic, dissipative), the Laplace/Poisson equation (elliptic, steady), the time-dependent Schrodinger equation (dispersive, unitary) and Burgers' equation (nonlinear, shock-forming, the 1D Navier-Stokes analogue). Where a closed-form solution exists it is shown behind the numeric solution and the error between them is plotted.

## Governing equations

Wave u_tt = c^2 u_xx (fixed ends; standing mode m has u = sin(m pi x) cos(m pi c t)). Heat u_t = alpha u_xx (mode m decays as e^{-alpha (m pi)^2 t}). Poisson u_xx = -f, Dirichlet 0 (for f = sin(m pi x) the solution is sin(m pi x)/(m pi)^2). Free Schrodinger i psi_t = -1/2 psi_xx (the norm integral of |psi|^2 is conserved; a Gaussian packet spreads). Burgers u_t + u u_x = nu u_xx, periodic (the integral of u is conserved, the integral of u^2 is dissipated).

## Numerical method

Wave: explicit leapfrog, CFL c dt/dx <= 1. Heat and Schrodinger: Crank-Nicolson via the shared complex tridiagonal solver (cn-tridiag), unconditionally stable. Poisson: a direct tridiagonal solve. Burgers: an explicit conservative flux plus diffusion. The animation loops cleanly per equation (one wave period; heat until the mode is gone; the packet reset; the Burgers shock dissipated). Deterministic; no RNG.

## Controls

- `eq`: which equation (wave / heat / Laplace-Poisson / Schrodinger / Burgers).
- `p`: the mode number m (wave, heat, Poisson), the wavepacket momentum (Schrodinger) or the viscosity (Burgers).
- Reset, Pause/Play. Pause freezes the time stepping; Laplace is steady so it does not animate.

## Expected qualitative features

- Wave: the numeric curve sits exactly on the analytic standing mode; the error is tiny.
- Heat: the shape smooths and decays at the analytic rate; the error stays small.
- Poisson: the numeric and analytic curves coincide; the error is ~1e-5.
- Schrodinger: |psi|^2 spreads; the norm trace is a flat line at 1 (unitary).
- Burgers: a smooth wave steepens into a shock and the energy decays with viscosity.

## Invariants and acceptance thresholds

`invariants.test.mjs` (vitest, offline):

1. Wave: numeric vs analytic standing mode max error < 5e-3; CFL <= 1; energy bounded (< 5 percent drift).
2. Heat: monotone decay (no growth), max error < 3e-3, Dirichlet ends 0.
3. Poisson: max error < 1e-4, exact Dirichlet 0, small interior residual.
4. Schrodinger: norm conserved to 1e-9 over 300 steps; a stationary packet spreads (variance grows).
5. Burgers: integral of u conserved to 1e-8; energy non-increasing; more viscosity dissipates faster at equal time.
6. Determinism: identical setups reproduce every PDE bit-for-bit.

Visual gate: SSIM > 0.92 against committed golden frames at 60 fps.

## Limiting cases for verification

- Wave at t = 0: equals the initial standing mode exactly.
- Heat as t -> infinity: the solution -> 0.
- Poisson: a steady BVP, no time dependence, equals sin(k x)/k^2.
- Free Schrodinger: norm exactly constant (unitary CN).
- Burgers with large nu: the shock is rounded off quickly.

## Visual fallback

Every panel (solution, error, conserved quantity) is a static read; the time stepping is animation only and Laplace is fully static.

## Stack note

The backlog lists this as a WebGL2 hero. It is plain Canvas2D line plots, per the project stack constraint (hard rule 8): 1D plots make the analytic-versus-numeric-versus-error comparison far clearer than a GPU field would, the result is deterministically gate-verifiable, and it reuses the shared CPU tridiagonal engine rather than duplicating a GPU solver. It cross-links to the standalone Laplace, TDSE and Navier-Stokes hero playgrounds for the full-resolution GPU versions.

## Citations

- LeVeque, R. J., Finite Difference Methods for Ordinary and Partial Differential Equations (2007): leapfrog, Crank-Nicolson, CFL and von Neumann stability for all five equation types.

## Stretch goals

- Add user-painted initial and boundary conditions.
- Add a 2D mode reusing the shared 2D wave and Chorin engines.

## Risk register

- Schrodinger and Burgers have no simple closed form shown, so their panels display the conserved quantity (norm, energy) instead of an analytic overlay; the conserved-quantity plot uses a fixed physical y-range so a truly conserved norm reads as a flat line rather than amplified machine noise (a defect found and fixed during review).
