---
title: 1D Green's Function for the Laplacian
slug: green-function-1d-laplacian
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: M3012
supporting_ucs: []
curriculum_year: bsc-y3s1
primary_citation: arfken-weber
primary_chapter: 9
hook: 'Solve the equation for a single point poke and you can build the response to any load by adding up pokes: that point response is the Green''s function.'
one_paragraph: 'A Green''s function is the response of a linear operator to a unit point source. For the 1D Laplacian with Dirichlet boundary conditions it is a simple tent-shaped function G(x, x_0), zero at both ends and kinked at the source point. Once you have it, the solution for any forcing f is just the convolution u(x) = integral G(x, x'') f(x'') dx'', superposing the responses to every infinitesimal piece of the load. The playground lets you move the source and pick a forcing and watch the solution assemble. It is the master tool for inhomogeneous linear problems. Reference: Arfken and Weber, Mathematical Methods for Physicists, Ch. 9.'
tags: [numerics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
invariants:
  - key: runs
    label: simulation advances each frame
    tolerance: 1
  - key: bounded
    label: state stays finite
    tolerance: 1
  - key: deterministic
    label: fixed seed reproduces the run
    tolerance: 1
what_to_try:
  - Vary each control and watch the rail readouts respond.
  - Compare the diagnostic plot against the live scene.
---
# Green's function, 1D Laplacian
Tent-shaped $G(x, x_0)$ with Dirichlet BC; convolution gives $u(x) = \int G f dx'$. Source: Arfken-Weber Ch. 9.

## Explainer

### What you are looking at

Solve a differential equation once, for a single sharp poke, and you
can build the solution for *any* load just by adding up pokes. That
single-poke response is the Green's function. The playground lets you
slide the poke and pick a load, and watch the full solution assemble.

### The point-source response

For the 1D Laplacian $-u'' = f$ on $[0, L]$ with $u(0) = u(L) = 0$
(string pinned at both ends), the Green's function $G(x, x_0)$ solves

$$-\frac{d^2 G}{dx^2} = \delta(x - x_0),
  \qquad G(0, x_0) = G(L, x_0) = 0.$$

The solution is a tent: two straight segments meeting at a kink over
the source point $x_0$,

$$G(x, x_0) = \begin{cases}
  \dfrac{x\,(L - x_0)}{L}, & x \le x_0,\\[6pt]
  \dfrac{x_0\,(L - x)}{L}, & x \ge x_0.
\end{cases}$$

It is the static shape of a string held down at the ends and pushed at
one interior point: a triangle. The kink (a jump in slope of $-1$) is
exactly the delta source.

### Superposition: any load at all

Because the operator is linear, a general load $f$ is just a continuous
sum of point pokes, so the solution is the convolution

$$u(x) = \int_0^L G(x, x')\,f(x')\,dx'.$$

You never solve the ODE again; you integrate against the tent. This is
the master trick for inhomogeneous linear problems, and the same idea
(point response plus superposition) underlies electrostatic potentials,
propagators in quantum field theory, and impulse responses in signal
processing.

### Things to try

- Slide the source $x_0$ and watch the tent's kink follow it, always
  pinned to zero at both ends.
- Pick different forcings $f$ and watch $u(x)$ build up as the
  weighted sum of tents.
- Note a load concentrated near the middle bows the solution most:
  $G$ is largest there.

### Where this comes from

The Green's function for the 1D Laplacian with Dirichlet boundary
conditions and the convolution solution follow Arfken and Weber,
*Mathematical Methods for Physicists*, Chapter 9.
