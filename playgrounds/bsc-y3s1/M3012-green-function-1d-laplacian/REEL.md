# Reel script: 1D Green's Function for the Laplacian

Vertical 9:16, about 30 to 40 seconds. Screen-record the playground in portrait (820x1040), voiceover plus on-screen captions. Voice: first person, direct, no hype. No em-dashes, no emoji.

## Beat 1, hook (0 to 3s)
VO: Solve the equation for a single point poke and you can build the response to any load by adding up pokes: that point response is the Green''s function.
Caption: Solve the equation for a single point pok…

## Beat 2, the reveal (3 to 10s)
VO: A Green''s function is the response of a linear operator to a unit point source.
Caption: what you are seeing

## Beat 3, the mechanism (10 to 22s)
VO: For the 1D Laplacian with Dirichlet boundary conditions it is a simple tent-shaped function G(x, x 0), zero at both ends and kinked at the
Caption: the physics, simply

## Beat 4, try it (22 to 33s)
VO: Drag the poke position x0 along the top string: the Green tent G(x, x0) follows, peaking under your finger at height x0(1 - x0).
VO: Change the distributed load f(x) between constant, step, Gaussian and sine: the bottom string re-settles into u(x) = integral G(x,s) f(s) ds, the superposition of one tent per source point.
Caption: your turn

## Beat 5, payoff and CTA (33 to 40s)
VO: A Green''s function is the response of a linear operator to a unit point source.
VO: Full interactive version at tellurion.dev. Follow for one of these a day.
Caption: tellurion.dev

## On-screen text beats
- Solve the equation for a single point pok…
- what you are seeing
- the physics
- try it yourself
- tellurion.dev

## Source
point. Once you have it, the solution for any forcing f is just the convolution u(x) = integral G(x, x'') f(x'') dx'', superposing the responses to every infinitesimal piece of the load. The playground lets you move the source and pick a forcing and watch the solution assemble. It is the master tool for inhomogeneous linear problems. Reference: Arfken and Weber, Mathematical Methods for Physicists, Ch. 9.
