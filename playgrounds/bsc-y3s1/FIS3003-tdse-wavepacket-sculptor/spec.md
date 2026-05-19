---
title: TDSE Wavepacket Sculptor
slug: tdse-wavepacket-sculptor
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Fire a wavepacket at a barrier and watch part of it leak through while the norm holds at exactly 1.000000: quantum tunnelling, integrated unitarily.'
one_paragraph: 'A quantum particle in one dimension is a complex wavefunction psi(x,t) whose evolution obeys the time-dependent Schroedinger equation i hbar d_t psi = -(hbar^2/2m) d_xx psi + V(x) psi (here hbar = m = 1). It is advanced by a norm-preserving (unitary) step, so total probability stays exactly one and the dynamics is genuinely quantum. The main view is the probability cloud |psi(x)|^2 coloured by the local phase arg(psi); choosing the potential V(x) shows the textbook behaviours: a free packet spreads and its phase winds, a rectangular barrier splits it into a reflected and a tunnelled part, a harmonic well drives a coherent sloshing state, a double well lets probability tunnel back and forth between the minima, and a periodic lattice produces band-like spreading. A strip below tracks the mean position, illustrating Ehrenfest''s theorem. Reference: Griffiths, Introduction to Quantum Mechanics; Tannor, Introduction to Quantum Mechanics: A Time-Dependent Perspective.'
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

## Explainer

### What you are looking at

A quantum particle is a spread-out wavepacket, not a dot. Launch it
into different potentials, a wall, a box, a spring, a barrier, a
crystal, and watch it disperse, bounce, tunnel, and refocus. The
playground integrates the actual Schrodinger equation, so the
probability stays exactly normalized while all this happens.

### The equation and the scheme

The time-dependent Schrodinger equation (units $\hbar = m = 1$):

$$i\,\frac{\partial\psi}{\partial t}
  = \left[-\tfrac12\frac{\partial^2}{\partial x^2}
  + V(x)\right]\psi.$$

It is stepped with Crank-Nicolson,

$$\left(I + \tfrac{i\,dt}{2}H\right)\psi^{n+1}
  = \left(I - \tfrac{i\,dt}{2}H\right)\psi^{n},$$

whose update (the Cayley transform) is exactly unitary. That matters:
it conserves $\int|\psi|^2 dx = 1$ to machine precision, so the
displayed probability is trustworthy, not slowly leaking, the headline
honesty check for any quantum simulation.

### What the potentials show

- Free space: the packet drifts at its group velocity $k_0$ and
  spreads (dispersion: faster components outrun slower ones).
- Harmonic well: a coherent state sloshes rigidly,
  $\langle x\rangle(t) = x_0\cos(\omega t)$, no spreading, the
  quantum-classical correspondence.
- Barrier higher than the mean energy: part of the packet tunnels
  through ($0 < T < 1$) and part reflects, with $R + T = 1$ exactly.
- Periodic lattice: the packet splits into Bloch-like sub-beams (band
  structure in action).

The live norm readout stays at 1 throughout; that is the proof the
scheme is unitary and the tunneling/reflection you see is physical.

### Things to try

- Fire the packet at a barrier taller than its energy and watch a
  piece tunnel through while the norm stays exactly 1.
- Drop a coherent state into the harmonic well and watch it slosh
  without spreading.
- Free space: watch the packet broaden over time (dispersion), centre
  moving at $k_0$.

### Where this comes from

The TDSE, the unitary Crank-Nicolson (Cayley) propagator, and the
tunneling/coherent-state behavior follow Griffiths, *Introduction to
Quantum Mechanics*, Chapter 2, with the numerical scheme from Press et
al., *Numerical Recipes*, Chapter 19.

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
