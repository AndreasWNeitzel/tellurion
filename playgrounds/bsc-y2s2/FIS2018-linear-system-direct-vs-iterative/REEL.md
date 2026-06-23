# Reel script: Linear System: Direct vs Iterative

Vertical 9:16, about 30 to 40 seconds. Screen-record the playground in portrait (820x1040), voiceover plus on-screen captions. Voice: first person, direct, no hype. No em-dashes, no emoji.

## Beat 1, hook (0 to 3s)
VO: Solve the same linear system two ways: a direct solver gets the exact answer in one pass, iterative methods sneak up on it, fast or slow by method.
Caption: Solve the same linear system two ways: a…

## Beat 2, the reveal (3 to 10s)
VO: The 1D Poisson problem becomes a tridiagonal linear system.
Caption: what you are seeing

## Beat 3, the mechanism (10 to 22s)
VO: The playground solves it with a direct Thomas algorithm (exact, O(n), a single sweep) and with three iterative methods: Jacobi and Gauss-Seidel relax slowly toward the solution, while conjugate gradient converges dramatically faster on this symmetric positive-definite system. It plots the residual against iteration count, so direct appears as one jump to machine precision and the iterative convergence rates visibly separate.
Caption: the physics, simply

## Beat 4, try it (22 to 33s)
VO: Switch the iterative solver between Jacobi, Gauss-Seidel and conjugate gradient: each drives the residual down at a different rate, and the log-residual plot shows conjugate gradient winning by far.
VO: Raise the grid size N: the iterative methods slow down (their iteration count grows with N) while the Thomas direct solver stays exact in O(N).
Caption: your turn

## Beat 5, payoff and CTA (33 to 40s)
VO: This is the everyday trade-off between a one-shot factorization and a scalable iterative solve.
VO: Full interactive version at tellurion.dev. Follow for one of these a day.
Caption: tellurion.dev

## On-screen text beats
- Solve the same linear system two ways: a…
- what you are seeing
- the physics
- try it yourself
- tellurion.dev

## Source
Villate, Numerical Methods (VPython), Ch. 6.
