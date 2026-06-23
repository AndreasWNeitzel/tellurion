# Reel script: Lennard-Jones Molecular Dynamics

Vertical 9:16, about 30 to 40 seconds. Screen-record the playground in portrait (820x1040), voiceover plus on-screen captions. Voice: first person, direct, no hype. No em-dashes, no emoji.

## Beat 1, hook (0 to 3s)
VO: Watch a cold dense lattice of Lennard-Jones disks melt into a liquid, the radial distribution function growing its first peak while velocity-Verlet holds the energy flat.
Caption: Watch a cold dense lattice of Lennard-Jon…

## Beat 2, the reveal (3 to 10s)
VO: A two-dimensional fluid of disks interacting through the Lennard-Jones potential V(r) = 4 epsilon[(sigma/r) 12 - (sigma/r) 6] (steeply repulsive core, weak attractive tail), in a periodic box and reduced units.
Caption: what you are seeing

## Beat 3, the mechanism (10 to 22s)
VO: Orbits are advanced with a symplectic (velocity-Verlet) step so the total energy is conserved over long runs. Particles are coloured by kinetic energy; the temperature follows from the kinetic energy by equipartition, the pressure from the virial theorem, and the structure from the pair-correlation function g(r).
Caption: the physics, simply

## Beat 4, try it (22 to 33s)
VO: Raise the temperature: the disks rattle harder, the pressure climbs, and the radial distribution g(r) washes out as liquid order melts toward a gas.
VO: Increase the density: neighbours pack in, g(r) grows sharp shells, and the virial pressure swings as the repulsive core of the Lennard-Jones potential takes over.
VO: Read g(r) below the critical point: a tall first peak and decaying oscillations are the signature of a liquid, structured up close but disordered far away.
Caption: your turn

## Beat 5, payoff and CTA (33 to 40s)
VO: Cold and dense the system freezes into a triangular crystal with sharp g(r) peaks; warm it melts into a liquid and then a gas where g(r) approaches 1, so the equation of state and the phases emerge directly from the microscopic forces.
VO: Full interactive version at tellurion.dev. Follow for one of these a day.
Caption: tellurion.dev

## On-screen text beats
- Watch a cold dense lattice of Lennard-Jon…
- what you are seeing
- the physics
- try it yourself
- tellurion.dev

## Source
Frenkel and Smit, Understanding Molecular Simulation, Chapters 3 to 4; Allen and Tildesley.
