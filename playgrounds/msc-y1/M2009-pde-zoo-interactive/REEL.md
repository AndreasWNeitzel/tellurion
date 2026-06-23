# Reel script: PDE Zoo: Wave, Heat, Laplace, Schrodinger and Burgers

Vertical 9:16, about 30 to 40 seconds. Screen-record the playground in portrait (820x1040), voiceover plus on-screen captions. Voice: first person, direct, no hype. No em-dashes, no emoji.

## Beat 1, hook (0 to 3s)
VO: Five of the most important equations in physics, solved on the same grid so you can see what each one does to a shape: the wave equation swings it back and forth, the heat equation smooths it away, Laplace finds the resting shape, Schrodinger spreads a quantum packet, and Burgers steepens into a shock.
Caption: Five of the most important equations in p…

## Beat 2, the reveal (3 to 10s)
VO: Pick an equation and watch the same finite-difference grid behave completely differently.
Caption: what you are seeing

## Beat 3, the mechanism (10 to 22s)
VO: The wave equation conserves energy and oscillates; the heat equation only ever smooths and fades; the Laplace/Poisson equation skips time entirely and jumps to the steady shape; the Schrodinger equation keeps its total probability fixed while the wavepacket spreads; and Burgers, the one-dimensional cousin of Navier-Stokes, sharpens a smooth wave into a shock that viscosity then rounds off. For the cases with a known exact solution the analytic curve is drawn behind the numeric one and the gap between them is plotted as the error, so you can see how good the numerical method is.
Caption: the physics, simply

## Beat 4, try it (22 to 33s)
VO: Step through the five equations on the same grid: wave oscillates and conserves energy, heat only smooths and fades, Laplace jumps straight to the steady shape, Schrodinger holds probability fixed while the packet spreads, and Burgers steepens into a shock.
VO: Watch the conserved readout: it stays flat for wave, Schrodinger and Laplace but decays for heat.
Caption: your turn

## Beat 5, payoff and CTA (33 to 40s)
VO: A Crank-Nicolson scheme advances each equation, and where an exact solution exists the analytic curve is drawn behind the numeric one so the discretisation error is visible.
VO: Full interactive version at tellurion.dev. Follow for one of these a day.
Caption: tellurion.dev

## On-screen text beats
- Five of the most important equations in p…
- what you are seeing
- the physics
- try it yourself
- tellurion.dev

## Source
LeVeque, Finite Difference Methods for Ordinary and Partial Differential Equations, Chapters 9 to 10.
