# 2D Point-Vortex Dynamics

Ideal point vortices in an inviscid 2D fluid, each carrying a fixed
circulation and advected by the velocity the others induce (the 2D
Biot-Savart law). It is a Hamiltonian system: total circulation, the
linear and angular impulse, and the Kirchhoff-Routh Hamiltonian are
all conserved. Warm dots are positive circulation, cool dots negative;
tracer particles ride the induced flow and accumulate into streaklines
that paint the flow structure. The physics is the gate-tested
`sim.js`, integrated with RK4.

What to look for: the dipole preset is a plus/minus pair that shoots
off in a straight line at exactly `v = Gamma/2 pi d`, dragging a
closed recirculation bubble of tracers with it; the co-rotating pair
spins about its centroid at fixed separation; the tripole is bounded,
quasi-periodic motion; the quadrupole is sensitive, chaotic
multi-vortex motion (Aref). The strength slider scales every
circulation, the speed slider sets the time step per frame. Watch the
`H drift` readout: it stays under `10^{-3}`, and the total circulation
and impulse readouts stay fixed, because these are the conserved
quantities of the Hamiltonian system, tracked honestly rather than
assumed.

Controls: the configuration preset, the strength slider, the speed
slider, Reset and Pause. Copy URL shares the current state.

## Reference

Primary citations: Saffman, *Vortex Dynamics*, CUP 1992
(`saffman1992`), for the point-vortex Hamiltonian, the conserved
impulse, and the pair speed `Gamma/2 pi d`; Aref, *Integrable,
Chaotic, and Turbulent Vortex Motion in Two-Dimensional Flows*, Annu.
Rev. Fluid Mech. 15 (1983) 345 (`aref1983`), for the integrable and
chaotic regimes; Batchelor, *An Introduction to Fluid Dynamics*, CUP
1967, sec. 7.3 (`batchelor1967`).

## Verification

- Strong invariants (offline, `sim.js`): total circulation conserved
  exactly; Hamiltonian relative drift `< 1e-3` over 6000 steps;
  linear and angular impulse conserved to `< 1e-6`; the dipole
  translates at `Gamma/2 pi d` to `< 0.2%` in a straight line; an
  equal co-rotating pair keeps its separation to `< 0.1%`.
- Visual gate: SSIM > 0.92 against committed golden frames of the
  deterministic dipole sweep.
- Last verified: see `.verified`.
