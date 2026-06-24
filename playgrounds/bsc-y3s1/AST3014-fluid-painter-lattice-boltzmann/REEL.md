# Reel script: Fluid Painter: Lattice Boltzmann Sandbox

Vertical 9:16, about 30 to 40 seconds. Screen-record the playground in portrait (820x1040), voiceover plus on-screen captions. Voice: first person, direct, no hype. No em-dashes, no emoji.

## Beat 1, hook (0 to 3s)
VO: I draw a shape into a moving fluid by dragging, and the flow reroutes around it in real time, dye streaklines and all.
Caption: paint into the flow

## Beat 2, the reveal (3 to 10s)
VO: It is a D2Q9 lattice-Boltzmann solver on a 192 by 96 grid: steady inflow on the left, open outflow on the right, no-slip bounce-back at whatever I paint.
Caption: a lattice-Boltzmann fluid

## Beat 3, the mechanism (10 to 22s)
VO: The method never writes down Navier-Stokes. It just streams and collides particle populations on each cell, relaxing toward equilibrium at a rate set by tau. That single knob fixes the viscosity, nu = (tau minus a half) over three, and so the Reynolds number.
Caption: stream, then collide

## Beat 4, try it (22 to 33s)
VO: The stream stagnates at the upstream face, accelerates around the shoulders, and leaves a low-speed wake. The two plots below measure it: the transverse cut shows the velocity deficit the body carves, and the centreline cut drops to zero at the body and recovers downstream.
Caption: read the wake

## Beat 5, payoff and CTA (33 to 40s)
VO: Switch to the vorticity field and the two shear layers peel off the shoulders in red and blue. Push the Reynolds number and the wake lengthens. Full interactive version at tellurion.dev. Follow for one of these a day.
Caption: tellurion.dev

## On-screen text beats
- paint into the flow
- a lattice-Boltzmann fluid
- stream, then collide
- read the wake
- tellurion.dev

## Source
Kruger et al., The Lattice Boltzmann Method (Springer 2017), Chapters 3 to 5.
