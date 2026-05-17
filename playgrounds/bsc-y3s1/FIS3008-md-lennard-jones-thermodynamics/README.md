# Lennard-Jones Molecular Dynamics

This is molecular dynamics from scratch: 300 disks in a periodic box,
each pair pulling and pushing through the Lennard-Jones potential,
moved by velocity-Verlet (the same verified symplectic integrator the
orbit playgrounds use). Particles are coloured by how fast they are
moving. The right panel is the radial distribution function g(r), the
probability of finding another particle a distance r away relative to
an ideal gas: it is the fingerprint of the phase.

What to look for: at the default settings the system is a liquid, so
g(r) has one strong peak just past one diameter and a couple of
decaying ripples before it flattens to one. Turn the temperature down
and the density up and the box freezes into a triangular crystal, g(r)
splitting into sharp lattice peaks. Heat it up and it becomes a gas,
g(r) going featureless. Throughout, the dE/N readout barely moves: the
shifted-force cutoff keeps the force continuous so the integrator
conserves energy, the headline check of any MD code.

Controls: the temperature slider sets a thermostat target (the
velocities are gently rescaled toward it); the density slider rebuilds
the box at a new packing; steps per frame trades speed for smoothness;
Reset returns to the default liquid and Pause freezes it. Changing
temperature or density re-equilibrates a fresh box so the effect is
immediate.

## Reference

Primary citation: Allen and Tildesley, *Computer Simulation of
Liquids* (2nd ed.), Ch. 1-3 (`allen-tildesley`).

## Verification

- Strong invariant: velocity-Verlet conserves energy to better than
  1e-3 per particle over the run; momentum stays zero; the repulsive
  core prevents overlap; g(r) shows the correct excluded core, first
  peak near 2^(1/6), and decays to 1; and P = rho T exactly in the
  no-interaction limit. The integrator is the shared symplectic
  engine, gate-tested in tests/engines.
- Visual gate: SSIM > 0.92 against committed golden frames at seed
  0xC0FFEE.
- Last verified: see `.verified`.
