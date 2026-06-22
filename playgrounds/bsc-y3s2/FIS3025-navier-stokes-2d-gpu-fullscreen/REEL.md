# Reel script: Incompressible Wake and the Projection Method

Vertical 9:16, about 30 to 40 seconds. Screen-record the playground in portrait (820x1040), voiceover plus on-screen captions. Voice: first person, direct, no hype.

## Beat 1, hook (0 to 3s)
VO: Drop a body into a stream: Chorin''s pressure projection holds the flow incompressible (the live max|div u| stays tiny) while the wake goes from a glassy creep, through a steady recirculating bubble, to a shedding von Karman vortex street as the Reynolds number climbs.
Caption: Drop a body into a stream: Chorin''s pres…

## Beat 2, the reveal (3 to 10s)
VO: Chorin's projection method made visible: the incompressible Navier-Stokes equations ∂tu⃗+(u⃗⋅∇)u⃗=−∇p+ν∇2u⃗\partial_t\vec u+(\vec u\cdot\nabla)\vec u=-\nabla p+\nu\nabla^2\vec u∂t​u+(u⋅∇)u=−∇p+ν∇2u with the constraint ∇⋅u⃗=0\nabla\cdot\vec u=0∇⋅u=0, solved on a MAC staggered grid (semi-Lagrangian advection, implicit diffusion, an SOR pressure-Poisson projection, the gate-tested shared engine).
Caption: what you are seeing

## Beat 3, the mechanism (10 to 22s)
VO: Flow past a bluff body, coloured by speed ∣u⃗∣|\vec u|∣u∣ over the dark field: the uniform stream, the bright acceleration over the shoulders of the body, the dark wake deficit, and the discrete shed cores. The headline is the live max⁡∣∇⋅u⃗∣\max|\nabla\cdot\vec u|max∣∇⋅u∣ readout: the pressure solve drives it small every step, so the flow stays incompressible.
Caption: the physics, simply

## Beat 4, try it (22 to 33s)
VO: Vary each control and watch the rail readouts respond.
VO: Compare the diagnostic plot against the live scene.
Caption: your turn

## Beat 5, payoff and CTA (33 to 40s)
VO: The shed period gives an approximate Strouhal number; the precise St(Re)St(Re)St(Re) stays a documented finer-grid quantity.
VO: Full interactive version at tellurion.dev. Follow for one of these a day.
Caption: tellurion.dev

## On-screen text beats
- Drop a body into a stream: Chorin''s pres…
- what you are seeing
- the physics
- try it yourself
- tellurion.dev

## Source
chorin1968
