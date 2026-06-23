# Reel script: Fluid Painter: Lattice Boltzmann Sandbox

Vertical 9:16, about 30 to 40 seconds. Screen-record the playground in portrait (820x1040), voiceover plus on-screen captions. Voice: first person, direct, no hype. No em-dashes, no emoji.

## Beat 1, hook (0 to 3s)
VO: Draw an obstacle by click-drag and watch the flow respond in real time: it accelerates around the body and leaves a low-speed wake behind it, the speed shown as a colour field.
Caption: Draw an obstacle by click-drag and watch…

## Beat 2, the reveal (3 to 10s)
VO: A D2Q9 BGK lattice-Boltzmann channel flow on a 192x96 grid: steady inflow on the left, zero-gradient outflow on the right, and half-way bounce-back at user-drawn obstacles.
Caption: what you are seeing

## Beat 3, the mechanism (10 to 22s)
VO: The relaxation time tau sets the kinematic viscosity nu = (tau - 1/2)/3 and hence the obstacle Reynolds number Re = U D / nu, so lowering tau drives the wake from a steady recirculation toward unsteady vortex shedding.
Caption: the physics, simply

## Beat 4, try it (22 to 33s)
VO: Draw obstacles into the flow: the half-way bounce-back at your shapes forces the stream around them, and a blunt body sheds a von Karman wake.
VO: Watch the wake transverse-velocity trace: once the body sheds vortices it oscillates at the Strouhal frequency, the periodic signature of vortex shedding seen behind real bluff bodies.
Caption: your turn

## Beat 5, payoff and CTA (33 to 40s)
VO: The relaxation time tau sets the kinematic viscosity nu = (tau - 1/2)/3 and hence the obstacle Reynolds number Re = U D / nu, so lowering tau drives the wake from a steady recirculation toward unsteady vortex shedding.
VO: Full interactive version at tellurion.dev. Follow for one of these a day.
Caption: tellurion.dev

## On-screen text beats
- Draw an obstacle by click-drag and watch…
- what you are seeing
- the physics
- try it yourself
- tellurion.dev

## Source
Kruger et al., The Lattice Boltzmann Method (Springer 2017), Chapters 3 to 5.
