# PDE Zoo: Wave, Heat, Laplace, Schrodinger and Burgers

A partial differential equation tells a shape how to change. This playground starts every equation from the same simple curve on the same grid, so you can see, side by side, how differently each one treats it. The wave equation sloshes the shape back and forth forever. The heat equation only ever blurs it, fading it toward nothing. The Laplace (Poisson) equation does not care about time at all, it just reports the final resting shape. The Schrodinger equation spreads a quantum lump while keeping the total probability fixed. And Burgers, the one-dimensional stand-in for the Navier-Stokes equations of fluid flow, lets the wave run itself over until it forms a shock, which viscosity then smooths.

What to look for: in the wave, heat and Laplace cases there is a known exact answer, drawn as a dashed green line behind the blue computed one. They sit right on top of each other, and the small panel shows the leftover error, which is tiny. That is the whole point of a good numerical method. For Schrodinger, watch the side panel: the total probability is a perfectly flat line, the equation never loses or gains any, even though the lump itself is spreading. For Burgers, watch the smooth wave sharpen into a near-vertical cliff (a shock) and then see its energy bleed away faster when you raise the viscosity.

Controls: the equation selector switches which PDE is running, along with its solver and what the panels show. The parameter slider means the mode number (how many bumps the starting shape has) for wave, heat and Laplace, the wavepacket speed for Schrodinger, or the viscosity for Burgers. Reset returns to the wave equation; Pause freezes time (Laplace has no time to freeze, it is already steady).

## Reference

Primary citation: LeVeque, Finite Difference Methods for Ordinary and Partial Differential Equations (2007).

## Verification

- Strong invariant: wave/heat/Poisson match their analytic solutions (errors below 5e-3, 3e-3, 1e-4); the Schrodinger norm is conserved to 1e-9; Burgers conserves the integral of u to 1e-8.
- Visual gate: SSIM > 0.92 against committed golden frames.
- Last verified: see `.verified`.
