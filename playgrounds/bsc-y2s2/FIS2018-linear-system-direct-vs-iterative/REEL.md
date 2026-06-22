# Reel script: Linear System: Direct vs Iterative

Vertical 9:16, about 30 to 40 seconds. Screen-record the playground in portrait (820x1040), voiceover plus on-screen captions. Voice: first person, direct, no hype.

## Beat 1, hook (0 to 3s)
VO: Solve the same linear system two ways: a direct solver gets the exact answer in one pass, iterative methods sneak up on it, fast or slow by method.
Caption: Solve the same linear system two ways: a…

## Beat 2, the reveal (3 to 10s)
VO: What you are seeing: the discrete 1D Poisson problem −u′′=sin⁡(πx)-u'' = \sin(\pi x)−u′′=sin(πx) on NNN grid points.
Caption: what you are seeing

## Beat 3, the mechanism (10 to 22s)
VO: The same right-hand side is fed to a Thomas direct solver (exact, O(N)O(N)O(N)), Jacobi, Gauss-Seidel, and conjugate gradient. The lower panel tracks the residual norm vs iteration count; CG converges in at most NNN steps in exact arithmetic.
Caption: the physics, simply

## Beat 4, try it (22 to 33s)
VO: Vary each control and watch the rail readouts respond.
VO: Compare the diagnostic plot against the live scene.
Caption: your turn

## Beat 5, payoff and CTA (33 to 40s)
VO: The lower panel tracks the residual norm vs iteration count; CG converges in at most NNN steps in exact arithmetic.
VO: Full interactive version at tellurion.dev. Follow for one of these a day.
Caption: tellurion.dev

## On-screen text beats
- Solve the same linear system two ways: a…
- what you are seeing
- the physics
- try it yourself
- tellurion.dev

## Source
villate-vpython
