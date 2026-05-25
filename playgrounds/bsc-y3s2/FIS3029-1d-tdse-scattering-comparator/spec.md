---
title: 1D TDSE Wavepacket Scattering
slug: 1d-tdse-scattering-comparator
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS3029
primary_citation: chen1984
supporting_ucs: [FIS2018]
curriculum_year: bsc-y3s2
hook: 'Throw a quantum wavepacket at a barrier and watch part of it tunnel through and part reflect, with total probability conserved to machine precision.'
one_paragraph: 'This solves the time-dependent Schrodinger equation for a Gaussian wavepacket hitting a rectangular barrier, a step, or a square well, integrated with the Crank-Nicolson scheme that is unconditionally stable and conserves the norm exactly. You watch the packet split into reflected and transmitted parts, tunnel through a barrier taller than its mean energy, and resonate inside a well. The live norm readout stays at 1, the headline check that the numerical scheme is unitary. Reference: Griffiths, Introduction to Quantum Mechanics, Ch. 2; Crank and Nicolson 1947.'
tags: [quantum, atomic-molecular, animation, live-readout]
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
references:
  - "Chen, Introduction to Plasma Physics and Controlled Fusion, 2nd ed."
---

# 1D TDSE wavepacket scattering off a barrier

## Explainer

### What you are looking at

Fire a quantum particle at a barrier and it does not simply bounce or
pass: part of the wavefunction reflects and part tunnels through,
even when the particle has less energy than the barrier is tall. The
playground launches a Gaussian wavepacket at a barrier, step, or well
and shows the probability splitting into reflected and transmitted
parts in real time.

### The time-dependent Schrodinger equation

The packet evolves under

$$i\hbar\,\frac{\partial\psi}{\partial t}
  = -\frac{\hbar^2}{2m}\,\frac{\partial^2\psi}{\partial x^2}
  + V(x)\,\psi,$$

starting as a minimum-uncertainty Gaussian of mean momentum $k_0$.
Its norm $\int|\psi|^2dx = 1$ is conserved (probability is never lost),
and $|\psi(x)|^2$ is the probability density of finding the particle.

### Tunnelling and the transmission coefficient

When the packet meets a rectangular barrier of height $V_0$ and width
$a$ with particle energy $E<V_0$, the wavefunction does not vanish
inside; it decays exponentially, and a reduced-amplitude oscillation
emerges on the far side. The transmitted fraction is, to leading
exponential order,

$$T \;\sim\; \exp\!\big(-2\kappa a\big),
  \qquad
  \kappa = \frac{\sqrt{2m\,(V_0 - E)}}{\hbar},$$

so transmission is exponentially sensitive to the barrier width and
height: this is quantum tunnelling, the mechanism behind alpha decay,
the scanning tunnelling microscope, and tunnel diodes. At $E\gtrsim
V_0$ you instead see resonant transmission (Ramsauer-Townsend dips
and peaks) from interference of the reflections at the two edges. The
playground integrates with Crank-Nicolson (unitary, norm-preserving
by construction) and reports the reflected and transmitted
probabilities as the packet scatters.

### Things to try

- Send a packet with $E<V_0$ at a thin barrier and watch a small but
  nonzero transmitted packet emerge (tunnelling).
- Widen the barrier and watch transmission collapse exponentially.
- Raise the energy above the barrier and watch resonant
  transmission/reflection oscillations appear.

### Where this comes from

The time-dependent Schrodinger equation, tunnelling, and the
Crank-Nicolson scheme follow Griffiths, *Introduction to Quantum
Mechanics*, Chapter 2, and Press et al., *Numerical Recipes*, on the
Crank-Nicolson method.

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
- Griffiths and Schroeter 2018, Introduction to Quantum Mechanics, 3e, Section 2.5.
- Press et al. Numerical Recipes 3e, Section 2.4 (Thomas algorithm).

## Stretch goals

- Add a static analytic T(E) overlay (the green theory curve in the index.html intro).
- Add the absorbing boundary condition to remove wrap-around artifacts at very long times.
- Add a 2D version with a slit (catalog entry 2d-tdse-double-slit-buildup).

## Risk register

- Norm drift: floating-point limit of the Thomas algorithm allows 1e-7 norm drift over 1000 steps. Acceptable for visualization.
- Group velocity dispersion: at large k_0 the finite-difference kinetic term mis-models the dispersion; the test allows 2 dx tolerance on packet position.
- Hard-wall boundary causes a faint reflection when the packet reaches |x| > 35; absorbing BCs would be better for very long runs.
