# TDSE Wavepacket Sculptor

This playground integrates the time-dependent Schroedinger equation
for a wavepacket in a potential you choose. The cloud is the
probability density |psi(x)|^2, coloured by the local phase of psi,
so the rainbow stripes show the wavefunction winding faster the more
momentum the packet carries. The potential V(x) is drawn behind it
and the strip below traces the mean position over time.

The integrator is Crank-Nicolson, whose Cayley form is exactly
unitary: the norm readout sits at 1.000000 no matter how long it
runs, the numerical statement of probability conservation. Fire the
packet at the barrier and it splits, most of it reflecting while a
faint lobe tunnels through, with the transmission rising as you raise
the momentum. Switch to the harmonic well and the packet becomes a
coherent state sloshing back and forth; the double well lets
probability tunnel between the two minima; the lattice spreads it
into band-like structure.

The potential selector chooses the scene; the momentum slider sets
the launched wavenumber; the V0/well slider sets the barrier height
or the harmonic frequency. Reset returns to the tunnelling barrier
and Pause freezes the evolution. The numerics reuse the shared
complex Thomas tridiagonal solver.

## Reference

Primary citation: Griffiths, *Introduction to Quantum Mechanics*
(3rd ed.), Ch. 1-2 (`griffiths-qm`).

## Verification

- Strong invariant: Crank-Nicolson conserves the norm to better than
  1e-6 over thousands of steps and is unconditionally stable; energy
  is conserved and tunnelling obeys R + T = 1.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
