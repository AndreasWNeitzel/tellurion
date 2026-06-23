# Reel script: Wave Heightfield (Clickable)

Vertical 9:16, about 30 to 40 seconds. Screen-record the playground in portrait (820x1040), voiceover plus on-screen captions. Voice: first person, direct, no hype. No em-dashes, no emoji.

## Beat 1, hook (0 to 3s)
VO: Drop a stone in a pond and rings spread, bounce off the edges, and cross through each other without colliding.
Caption: Drop a stone in a pond and rings spread,…

## Beat 2, the reveal (3 to 10s)
VO: This solves the damped two-dimensional wave equation, d2u/dt2 = c 2 (d2u/dx2 + d2u/dy2) minus gamma du/dt, on a 256x256 grid whose edges are clamped to zero (Dirichlet walls, like a drum skin pinned at its rim).
Caption: what you are seeing

## Beat 3, the mechanism (10 to 22s)
VO: Click anywhere on the shaded surface to seed a Gaussian bump of height A and width sigma; it splits into a ring that travels outward at the wave speed c, reflects off the four walls, and passes through earlier ripples, adding where crests meet and cancelling where a crest meets a trough (linear superposition). The gamma slider adds damping, so the energy bleeds away and the surface settles flat; with gamma = 0 the total energy is essentially conserved (the readout tracks it).
Caption: the physics, simply

## Beat 4, try it (22 to 33s)
VO: Drag a control and watch the whole picture change, not just a number on the side.
VO: Push it to an extreme and see where the physics breaks down.
Caption: your turn

## Beat 5, payoff and CTA (33 to 40s)
VO: The surface is a real Blinn-Phong-lit 3D heightfield, not a flat colour map: drag to orbit, scroll to zoom, and the readout shows the energy, the absorbed-energy fraction, the click count and FPS.
VO: Full interactive version at tellurion.dev. Follow for one of these a day.
Caption: tellurion.dev

## On-screen text beats
- Drop a stone in a pond and rings spread,…
- what you are seeing
- the physics
- try it yourself
- tellurion.dev

## Source
french-waves
