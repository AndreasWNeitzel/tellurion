# Reel script: Advection Scheme Shootout

Vertical 9:16, about 30 to 40 seconds. Screen-record the playground in portrait (820x1040), voiceover plus on-screen captions. Voice: first person, direct, no hype. No em-dashes, no emoji.

## Beat 1, hook (0 to 3s)
VO: Translate a square pulse with four numerical schemes and watch them fail differently: one smears it, one wiggles, one blows up past a Courant limit.
Caption: Translate a square pulse with four numeri…

## Beat 2, the reveal (3 to 10s)
VO: Linear advection just shifts a profile at speed c, so the exact answer is trivial, which makes it the perfect stress test for numerical schemes.
Caption: what you are seeing

## Beat 3, the mechanism (10 to 22s)
VO: The playground runs four (upwind, Lax-Friedrichs, Lax-Wendroff, and a higher-order or unstable choice) on the same square pulse against the analytic translation, with the Courant number C = c dt / dx adjustable. You watch numerical diffusion round the pulse, dispersion add trailing ripples, and outright instability blow up once C exceeds the stability limit.
Caption: the physics, simply

## Beat 4, try it (22 to 33s)
VO: Watch the same square pulse advected four ways: FTCS blows up (unconditionally unstable), first-order upwind smears the pulse into a diffusive lump, and Lax-Wendroff and MacCormack ring with dispersive wiggles near the edges.
VO: Raise the CFL number toward 1: the schemes sharpen, but push past the stability limit and even the stable schemes blow up.
Caption: your turn

## Beat 5, payoff and CTA (33 to 40s)
VO: It shows why the scheme choice and the CFL condition are not optional.
VO: Full interactive version at tellurion.dev. Follow for one of these a day.
Caption: tellurion.dev

## On-screen text beats
- Translate a square pulse with four numeri…
- what you are seeing
- the physics
- try it yourself
- tellurion.dev

## Source
LeVeque, Finite Volume Methods for Hyperbolic Problems.
