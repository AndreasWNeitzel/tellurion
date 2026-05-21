---
title: Dark Energy and the Fate of the Universe (Hero)
slug: dark-energy-fate-of-universe-3d
status: superseded
superseded_by: expanding-universe-3d
audience: portfolio
created: 2026-05-20
primary_uc: AST3017
supporting_ucs: []
curriculum_year: hero
primary_citation: ryden2017
primary_chapter: 6
hero_candidate: true
hook: 'Pick a value of Omega_Lambda and watch the comoving lattice of galaxies expand, recollapse, or run away. The Friedmann equation makes that single number set the eternal fate.'
one_paragraph: 'A comoving cube of galaxies expands with the scale factor $a(t)$. Whether $a$ grows forever, turns around into a Big Crunch, or accelerates without bound is fixed by the Friedmann equation and the present-day density parameters $\Omega_m$ and $\Omega_\Lambda$. The playground integrates that equation with RK4 from today both backwards (cosmic time before now) and forwards (the future), renders the comoving lattice scaled by $a(t)$, and shows the live $a(t)$ curve. Four presets sweep the four classical fates: closed Big Crunch, flat heat death, observed concordance LCDM, and a cartoon Big Rip phantom-DE case. Reference: Ryden, Introduction to Cosmology, 2nd ed., Ch. 5-6.'
caption: 'Figure 1. Comoving 3D lattice of galaxies scaling with the Friedmann a(t) (left), and the live a(t) curve (right) for the chosen cosmological parameters. Method: shared friedmann-cpu engine, RK4 in cosmic time with turnaround detection for closed models. Source: Ryden, Introduction to Cosmology, 2nd ed., Ch. 5-6.'
tags: [cosmology, animation, live-readout, three-d]
difficulty: 3
tier: single
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [omega_m, omega_l, preset]
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

# Dark energy and the fate of the universe
Friedmann a(t) under different Omega_m, Omega_L. Source: Ryden Ch. 5-6 (`ryden2017`).

## Explainer

### What you are looking at

A small comoving cube of galaxies. Comoving means the dots in the
playground sit at fixed grid positions in a coordinate system that
gets stretched by the scale factor $a(t)$. As cosmic time runs, the
cube physically scales by $a$: galaxies pull apart in an expanding
universe, or fall together in a contracting one. The graph on the
right shows the corresponding $a(t)$ integrated from the Friedmann
equation.

The fate of the universe ($a \to \infty$ forever, $a \to 0$ Big
Crunch, exponential runaway $a \sim e^{Ht}$ Big Rip) is fixed by two
present-day numbers: $\Omega_m$ (matter density) and $\Omega_\Lambda$
(cosmological-constant density). The playground lets you slide them
and integrate the resulting Friedmann equation forward and backward
in time.

### The Friedmann equation

For a homogeneous, isotropic universe with no radiation,

$$\left(\frac{\dot a}{a}\right)^2 \;=\; H_0^2\!
  \left[\,\Omega_m a^{-3} \;+\; \Omega_\Lambda
  \;+\; (1 - \Omega_m - \Omega_\Lambda)\,a^{-2}\,\right],$$

with $a = 1$ today and $H_0$ the present Hubble rate. The third term
is the curvature contribution: $\Omega_m + \Omega_\Lambda > 1$ is a
closed universe (positive curvature), $< 1$ is open.

### The four fates

- $\Omega_m > 1$, $\Omega_\Lambda = 0$ (closed matter-only): $a(t)$
  rises, reaches a maximum at the turnaround, then falls back to zero.
  Every comoving distance closes up; this is the Big Crunch.
- $\Omega_m = 1$, $\Omega_\Lambda = 0$ (flat matter-only Einstein-de
  Sitter): $a(t)$ grows like $t^{2/3}$, decelerating forever. No turnaround.
  Galaxies separate, cool, fade: heat death.
- $\Omega_m + \Omega_\Lambda = 1$, $\Omega_\Lambda \approx 0.7$
  (concordance LCDM): $a(t)$ grows; today matter is starting to lose
  to the cosmological constant, the expansion is accelerating, and at
  late times $a \sim e^{H_0 \sqrt{\Omega_\Lambda}\, t}$.
- $\Omega_\Lambda > 1$ (cartoon phantom DE / Big Rip): $a(t)$ runs
  away faster than exponential and tears apart galaxies, then stars,
  then atoms.

### Symbols

- $a(t)$: cosmic scale factor, $a(\text{today}) = 1$.
- $H_0$: present-day Hubble constant ($\approx 67$ km/s/Mpc).
- $\Omega_m$: present-day matter-density parameter.
- $\Omega_\Lambda$: present-day dark-energy-density parameter.
- $\Omega_k = 1 - \Omega_m - \Omega_\Lambda$: curvature parameter.

### Where this comes from

The Friedmann equation and the fate classification follow Ryden,
*Introduction to Cosmology*, 2nd ed., CUP 2017, Ch. 5-6, and
Dodelson, *Modern Cosmology*, 2nd ed., Academic 2020, Ch. 2. The
shared engine that integrates $a(t)$ with turnaround detection lives
in `shared/js/engine/friedmann-cpu.js`.
