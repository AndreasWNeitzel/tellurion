---
title: The Lane-Emden Polytrope
slug: lane-emden-polytrope
status: verified
audience: portfolio
created: 2026-06-22
primary_uc: AST3014
curriculum_year: bsc-y3s1
primary_citation: chandrasekhar-stellar
primary_chapter: 4
hook: "A star in one equation. Set the polytropic index and watch the density crush toward the centre, from a uniform sphere to a tiny dense core at n approaching 5."
one_paragraph: "A self-gravitating gas sphere with P = K rho^(1+1/n) is fixed by the Lane-Emden equation for the dimensionless density theta, integrated from the centre to the first zero xi_1 (the surface). The index n sets how steeply the density falls: n=0 is uniform (xi_1 = sqrt 6), n=1 is the analytic sin(xi)/xi (xi_1 = pi), n=3 already has a core fifty times the mean density, and n=5 has infinite radius. The playground draws the polytrope as a disk coloured by density beside the density and enclosed-mass profiles, with a draggable radius cursor, and plots the central concentration rho_c / mean density against n. The Lane-Emden ODE is solved by the shared polytrope engine (RK4)."
tags: [astrophysics, stellar-structure, polytrope, lane-emden, interactive, live-readout]
difficulty: 4
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [n]
invariants:
  - key: surface
    label: the surface zero xi_1 matches the known values (sqrt6, pi, 6.897)
    tolerance: 0.05
  - key: concentration
    label: the central concentration rises with n (1 at n=0, ~54 at n=3)
    tolerance: 0.0
  - key: mass
    label: the enclosed mass fraction rises monotonically from 0 to 1
    tolerance: 1e-2
what_to_try:
  - Raise the index n; the density crushes toward the centre and the core brightens.
  - Set n=1; the density follows the analytic sin(xi)/xi, surface at xi_1 = pi.
  - Drag the cursor; read the density and enclosed mass fraction at any radius.
references:
  - "Chandrasekhar, An Introduction to the Study of Stellar Structure, 1939, Ch. 4."
  - "Kippenhahn, Weigert, Weiss, Stellar Structure and Evolution, 2nd ed., Ch. 19."
---

# The Lane-Emden polytrope

## Physical setup

A self-gravitating gas sphere with a polytropic equation of state $P = K\rho^{1+1/n}$,
the simplest model of a star, in hydrostatic equilibrium.

## Equations

The dimensionless density $\theta$ ($\rho = \rho_c\theta^n$) obeys

$$ \frac{1}{\xi^2}\frac{d}{d\xi}\!\left(\xi^2\frac{d\theta}{d\xi}\right) = -\theta^n, \quad \theta(0)=1,\ \theta'(0)=0, $$

integrated to the first zero $\xi_1$ (the surface). The central concentration is
$\rho_c/\langle\rho\rangle = -\xi_1/(3\theta'(\xi_1))$.

## Numerical method

The Lane-Emden equation is integrated by RK4 in the shared polytrope engine; this
playground adds the density, mass, and concentration. Verified against the known
surface zeros and concentrations.

## Controls

- Polytropic index n (0.1 to 4.9); drag the radius cursor.

## Expected qualitative features

1. Higher n concentrates the density toward the centre.
2. n=0 is uniform; n=1 is sin(xi)/xi; n=5 has infinite radius.
3. The enclosed mass piles up in the inner regions as n grows.

## Invariants and acceptance thresholds

- $\xi_1$ matches $\sqrt 6$, $\pi$, 6.897.
- Central concentration rises with n (1 at n=0, ~54 at n=3).
- Enclosed mass fraction rises monotonically from 0 to 1.

## Citations

Chandrasekhar, An Introduction to the Study of Stellar Structure, 1939, Ch. 4.
Kippenhahn, Weigert, Weiss, Stellar Structure and Evolution, 2nd ed., Ch. 19.
