---
title: "Linear System: Direct vs Iterative"
slug: linear-system-direct-vs-iterative
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: FIS2018
supporting_ucs: []
curriculum_year: bsc-y2s2
primary_citation: villate-vpython
primary_chapter: 6
hook: 'Solve the same linear system two ways: a direct solver gets the exact answer in one pass, iterative methods sneak up on it, fast or slow by method.'
one_paragraph: 'The 1D Poisson problem becomes a tridiagonal linear system. The playground solves it with a direct Thomas algorithm (exact, O(n), a single sweep) and with three iterative methods: Jacobi and Gauss-Seidel relax slowly toward the solution, while conjugate gradient converges dramatically faster on this symmetric positive-definite system. It plots the residual against iteration count, so direct appears as one jump to machine precision and the iterative convergence rates visibly separate. This is the everyday trade-off between a one-shot factorization and a scalable iterative solve. Reference: Villate, Numerical Methods (VPython), Ch. 6.'
tags: [numerics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---
# Direct vs iterative linear-system solvers
Poisson 1D problem; Thomas tridiagonal direct solver vs Jacobi, Gauss-Seidel, CG. Source: Villate Ch. 6 (`villate-vpython`).
