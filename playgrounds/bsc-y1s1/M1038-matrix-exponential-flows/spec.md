---
title: The Matrix Exponential as a Flow
slug: matrix-exponential-flows
status: verified
audience: portfolio
created: 2026-06-22
primary_uc: M1038
curriculum_year: bsc-y1s1
primary_citation: strang-linalg
primary_chapter: 6
hook: "x' = A x is solved by exp(At) x0, the flow of the plane. The eigenvalues alone decide whether it is a node, saddle, spiral, or centre."
one_paragraph: "The linear system x' = A x has solution x(t) = exp(At) x0, and the shape of the flow is fixed by the eigenvalues of A: real same-sign gives a node, real opposite-sign a saddle, complex with nonzero real part a spiral (stable if Re < 0), and pure imaginary a centre. The playground draws the phase portrait with streamlines, markers flowing along exp(At), the real eigenvector directions, and a draggable initial condition whose exact exp(At) x0 rides its trajectory; the diagnostic places the eigenvalues in the complex plane, where left of the imaginary axis is stable and off the real axis is rotating."
tags: [linear-algebra, matrix-exponential, dynamical-systems, phase-portrait, animation, interactive]
difficulty: 2
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [preset]
invariants:
  - key: identity
    label: exp(A 0) = I
    tolerance: 1e-9
  - key: flow
    label: the flow solves x' = A x and matches numerical integration
    tolerance: 1e-4
  - key: classify
    label: the eigenvalues classify the fixed point (node, saddle, spiral, centre)
    tolerance: 0.0
what_to_try:
  - Drag the initial point; the white dot rides its exact exp(At) trajectory.
  - Cycle to the saddle; the flow enters along one eigendirection and leaves along the other.
  - Cycle to the centre; the eigenvalues sit on the imaginary axis and the orbits close.
references:
  - "Strang, Introduction to Linear Algebra, 5th ed., Sec. 6.3 (systems of ODEs)."
  - "Hirsch, Smale, Devaney, Differential Equations, Dynamical Systems, Ch. 3-4."
---

# The matrix exponential as a flow

## Mathematical setup

The autonomous linear system $\dot{\mathbf{x}} = A\mathbf{x}$ is solved by the
matrix exponential, which advances every initial condition forward in time.

## Equations

$$ \mathbf{x}(t) = e^{At}\mathbf{x}_0. $$

The eigenvalues of A set the flow: real same-sign (node), real opposite-sign
(saddle), complex $\alpha\pm i\beta$ (spiral, stable if $\alpha<0$), pure
imaginary (centre). For a 2x2 matrix $e^{At}$ has a closed form in the
eigenvalues.

## Numerical method

Closed-form 2x2 matrix exponential (real, complex, and repeated cases);
streamlines and flowing markers by RK4. The closed form matches the integrator.

## Controls

- Next system (stable/unstable node, saddle, centre, stable/unstable spiral);
  drag the initial condition.

## Expected qualitative features

1. The portrait type (node, saddle, spiral, centre) follows the eigenvalues.
2. Real eigenvectors are invariant directions (the saddle's manifolds).
3. exp(At) x0 rides the trajectory exactly.

## Invariants and acceptance thresholds

- $e^{A\cdot 0} = I$.
- The flow solves $\dot{\mathbf{x}} = A\mathbf{x}$.
- The eigenvalues classify the fixed point.

## Citations

Strang, Introduction to Linear Algebra, 5th ed., Sec. 6.3. Hirsch, Smale,
Devaney, Differential Equations, Dynamical Systems, Ch. 3-4.
