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
---
# Green's function, 1D Laplacian
Tent-shaped $G(x, x_0)$ with Dirichlet BC; convolution gives $u(x) = \int G f dx'$. Source: Arfken-Weber Ch. 9 (`arfken-weber`).
