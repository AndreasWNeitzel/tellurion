---
title: 1D TDSE Wavepacket Scattering
slug: 1d-tdse-scattering-comparator
status: verified
audience: portfolio
created: 2026-05-13
---

# 1D TDSE wavepacket scattering off a barrier

## Physical setup

A 1D Gaussian wavepacket initially at x_0 = -15 with momentum k_0 moves to the right and scatters off a potential (rectangular barrier, step, or square well). Computed with Crank-Nicolson on a uniform grid; norm-preserving by construction.

## Governing equations

  i hbar d psi / dt = -(hbar^2 / 2 m) d^2 psi / dx^2 + V(x) psi

with hbar = m = 1.

Crank-Nicolson:
  (I + i dt H / 2) psi^{n+1} = (I - i dt H / 2) psi^n.

Both sides are tridiagonal in psi when the kinetic term is the standard 3-point stencil. We solve via the Thomas algorithm with complex coefficients (`shared/js/engine/cn-tridiag.js`).

## Numerical method

800-point uniform grid, x in [-40, 40], dx = 0.10. Time step dt = 0.05. Hard-wall boundaries psi = 0 at x = +/- 40. The initial Gaussian is normalized to integral|psi|^2 = 1.

## Controls

- potential: rectangular barrier (default) / step / square well
- V_0: barrier height, slider -6 to 10, default 4.0
- k_0: incoming momentum, slider 0.5 to 5, default 2.0
- speed: CN steps per render frame, 1 to 20, default 6
- Reset / Pause

## Expected qualitative features

1. At t = 0 the wavepacket is centered on the left, moving right.
2. As it hits the barrier, part reflects (red bump on left) and part transmits (red bump on right).
3. Inside the barrier you see the evanescent decay structure for E < V_0.
4. The total norm (red curve area) is conserved exactly to many decimals.

## Invariants and acceptance thresholds

- Initial wavepacket normalized to 1 within 1e-10.
- Norm conserved to 1e-6 after 300 CN steps with barrier.
- R + T = 1 to 1e-6 after the wavepacket has fully scattered.
- Free propagation (V = 0) moves at group velocity v_g = k_0 (within 2 grid cells).
- High barrier V_0 = 10 with k_0 = 1 (E = 0.5): T < 0.05 (essentially full reflection).

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- V_0 = 0: free particle; packet propagates without distortion (up to dispersion).
- V_0 -> infinity: full reflection; T -> 0.
- E >> V_0: full transmission; T -> 1.
- Square well V_0 < 0: resonant transmission peaks at E = n^2 pi^2 / (2 m a^2) - |V_0|.

## Visual fallback

Canvas2D only.

## Citations

- Newman 2013, Computational Physics, Chapter 9 Exercise 9.8.
- Griffiths and Schroeter 2018, Introduction to Quantum Mechanics, 3e, Section 2.5 (`griffithsqm2018`).
- Press et al. Numerical Recipes 3e, Section 2.4 (Thomas algorithm).

## Stretch goals

- Add a static analytic T(E) overlay (the green theory curve in the index.html intro).
- Add the absorbing boundary condition to remove wrap-around artifacts at very long times.
- Add a 2D version with a slit (catalog entry 2d-tdse-double-slit-buildup).

## Risk register

- Norm drift: floating-point limit of the Thomas algorithm allows 1e-7 norm drift over 1000 steps. Acceptable for visualization.
- Group velocity dispersion: at large k_0 the finite-difference kinetic term mis-models the dispersion; the test allows 2 dx tolerance on packet position.
- Hard-wall boundary causes a faint reflection when the packet reaches |x| > 35; absorbing BCs would be better for very long runs.
