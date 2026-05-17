---
title: TDSE Wavepacket Sculptor
slug: tdse-wavepacket-sculptor
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Fire a wavepacket at a barrier and watch part of it leak through while the norm holds at exactly 1.000000: quantum tunnelling, integrated unitarily.'
one_paragraph: 'The 1D time-dependent Schroedinger equation (units hbar = m = 1) integrated by the Crank-Nicolson scheme, which is exactly unitary so the norm is conserved to machine precision. The primary scene is the physical probability cloud |psi(x)|^2 coloured by the local phase arg(psi), evolving over a chosen potential: a free packet spreads, a rectangular barrier splits it into reflected and tunnelled parts, a harmonic well drives a coherent oscillation, a double well lets it tunnel between minima, a periodic lattice gives band-like spreading. The strip below traces the mean position. Numerics reuse the shared complex Thomas tridiagonal solver. The headless sim.js is gate-tested for norm conservation, unconditional stability, the lattice group velocity and Ehrenfest, the coherent-state oscillation, energy conservation, the stationary ground state and tunnelling probability conservation.'
tags: [quantum, pde, animation, multi-panel, live-readout]
difficulty: 4
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 6
curriculum_year: 'L:F-3Y-1S'
primary_uc: FIS3003
share_state_keys: []
---

# TDSE Wavepacket Sculptor

## Physical setup

A Gaussian wavepacket of chosen mean momentum launched into a chosen
1D potential: free space, infinite box, harmonic well, double well,
periodic lattice, rectangular tunnelling barrier, or a delta spike.

## Governing equations

`i dpsi/dt = [ -1/2 d^2/dx^2 + V(x) ] psi` (hbar = m = 1), solved by
Crank-Nicolson `(I + i dt/2 H) psi^{n+1} = (I - i dt/2 H) psi^n`.
The Cayley operator is exactly unitary, so `integral |psi|^2 dx` is
conserved. The free group velocity is `k0`; in a harmonic well a
coherent state obeys `<x>(t) = x0 cos(omega t)`; a barrier of height
`V0 > E` transmits with `0 < T < 1` and `R + T = 1`.

## Numerical method

Second-order central differences for the kinetic term; the CN linear
system is tridiagonal and complex, solved with the shared
`cn-tridiag` Thomas solver. N = 640 points (512 in the headless
tests), Dirichlet ends with the box wide enough that packets do not
reach the walls. Reference: Griffiths, *Introduction to Quantum
Mechanics* (3rd ed.), Ch. 1-2 (`griffiths-qm`); Press et al.,
*Numerical Recipes* (3rd ed.), Sec. 20.2 (`press2007`).

## Controls

- potential: barrier, free, harmonic, double well, box, lattice,
  delta.
- momentum k0: the launched mean wavenumber.
- barrier V0 / well: the barrier height (or harmonic omega).
- Reset, Pause.

## Expected qualitative features

- Free: the packet glides and broadens, phase stripes winding faster
  for larger k0.
- Barrier: the packet splits; with `E < V0` most reflects, a small
  tunnelled lobe appears beyond it; `T` rises with `k0`.
- Harmonic: a coherent state sloshes back and forth at omega.
- Double well: probability tunnels between the two minima.
- The norm readout stays at 1.000000 throughout.

## Invariants and acceptance thresholds

- Crank-Nicolson conserves the norm to `< 1e-6` over thousands of
  steps (free, harmonic, barrier).
- Unconditionally stable: a huge dt does not blow up the norm.
- Free packet moves at the lattice group velocity `sin(k0 dx)/dx`
  (within 1.5% of the continuum `k0`); Ehrenfest `d<x>/dt = <p>`.
- Harmonic coherent state returns to `+x0` after one period.
- Energy conserved within 2e-3 for a stationary potential.
- Harmonic ground state is stationary with `E = omega/2`.
- Tunnelling: `R + T = 1` (norm unitary to 1e-5); `T` increases with
  energy; the analytic rectangular-barrier `T` is monotone in `E`.

## Limiting cases for verification

- Free particle: a Gaussian disperses with `<x> = x0 + k0 t`.
- Harmonic ground state: time-independent `|psi|^2`, `E = omega/2`.

Source: Griffiths, *Introduction to Quantum Mechanics* (3rd ed.),
Ch. 1-2 (`griffiths-qm`).
