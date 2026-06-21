---
title: "Stellar Structure: the Eddington Standard Model"
slug: stellar-structure-full-model
status: verified
audience: portfolio
created: 2026-05-18
primary_uc: MAA-SE
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: carroll-ostlie
hook: 'An n = 3 polytrope solved from the Lane-Emden equation and scaled to a chosen mass and composition: the burning core, the radiative and convective zones and the photosphere, the run of temperature, density, pressure and luminosity, the pp / CNO / triple-alpha energy generation, and the resulting position on the zero-age main sequence.'
one_paragraph: 'A full stellar-structure playground built on the Eddington standard model (an n = 3 polytrope; Carroll and Ostlie Ch. 10; Hansen and Kawaler; Chandrasekhar 1939). The Lane-Emden equation is integrated from the regular centre by RK4 to its first zero (xi_1 = 6.89685), then scaled to the chosen mass and composition to give rho(r), P(r), T(r) (ideal gas plus radiation), m(r) and L(r) from the pp, CNO and triple-alpha rates, with the Schwarzschild criterion deciding where the star is convective. Panel A is a pseudo-3D sliced star coloured by temperature with its burning core, radiative and convective zones and photosphere; Panel B is the run of T, rho, P and L; Panel C is the energy generation and the HR position on the ZAMS. The Lane-Emden surface values, the solar central pressure and temperature within the Eddington-model tolerances, the Schwarzschild convective-versus-radiative split, and the pp / CNO / triple-alpha hierarchy along a monotone zero-age main sequence are the physical content. Reference: Carroll and Ostlie, An Introduction to Modern Astrophysics, Chapter 10; Hansen and Kawaler, Stellar Interiors.'
tags: [stellar-structure, polytrope, lane-emden, nuclear-burning, live-readout]
difficulty: 5
tier: hero
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 6
share_state_keys: [m, x]
invariants:
  - key: mass-conservation
    label: the integrated mass recovers the input mass
    tolerance: 0.05
  - key: solar-calibration
    label: the solar model radiates L_sun and the central pressure and temperature are within the Eddington-model tolerances
    tolerance: 0.05
  - key: cno-hierarchy
    label: the pp chain dominates at solar temperature and the CNO cycle wins when hot
    tolerance: 0
what_to_try:
  - Drag the mass up: L grows as about M^3.5, the central temperature climbs, and the CNO cycle overtakes the pp chain in the energy-generation panel.
  - Drag the mass down: the core cools, the pp chain dominates, and the luminosity drops by orders of magnitude.
  - Watch the HR panel: the model slides along the zero-age main sequence as the mass changes.
references:
  - "Carroll, Ostlie, An Introduction to Modern Astrophysics, Second ed."
---

# Stellar Structure: the Eddington Standard Model

## Explainer

### What you are looking at

A star is a self-regulating ball of gas where four physical demands
must be satisfied simultaneously at every radius. The Eddington
standard model solves all four with one elegant trick, and from a
star's mass and composition alone it predicts the entire run of
density, pressure, temperature, and luminosity. The playground builds
that model and lets you change the mass and hydrogen content.

### The four structure equations

A spherically symmetric star obeys hydrostatic equilibrium, mass
continuity, energy generation, and energy transport:

$$\frac{dP}{dr} = -\frac{G m\rho}{r^2},
  \qquad
  \frac{dm}{dr} = 4\pi r^2\rho,$$

$$\frac{dL}{dr} = 4\pi r^2\rho\,\varepsilon,
  \qquad
  \frac{dT}{dr} = -\frac{3\kappa\rho L}{16\pi a c\,T^3 r^2}
  \ \ (\text{radiative}).$$

Here $\varepsilon$ is the nuclear energy release per unit mass and
$\kappa$ the opacity. These are coupled and would normally need a
numerical integration.

### The Eddington trick: an n = 3 polytrope

Eddington noticed that if the ratio of gas pressure to total pressure,
$\beta = P_\mathrm{gas}/P$, is constant through the star, then total
pressure becomes a pure power of density,

$$P = K\,\rho^{4/3},$$

an $n=3$ polytrope. The dimensionless structure then collapses to the
universal Lane-Emden function $\theta(\xi)$ with $n=3$, the same shape
for every such star. Scaling that one solution by the chosen mass $M$
and radius $R$ gives the physical $\rho(r),P(r),T(r)$. Layering on
nuclear burning (pp chain, CNO cycle, triple-alpha) fixes the
luminosity, and the Schwarzschild criterion
$\nabla_\mathrm{rad}>\nabla_\mathrm{ad}$ marks the convective zones.
The famous payoff is that the $n=3$ model makes luminosity depend
mostly on mass (not radius), the theoretical origin of the
mass-luminosity relation. The playground sweeps $M$ and the hydrogen
fraction $X$ and shows the full interior respond.

### Things to try

- Increase the mass and watch the central temperature and luminosity
  rise steeply, and the burning switch from pp to CNO.
- Lower the hydrogen fraction $X$ (an evolved composition) and watch
  the star contract and heat to keep burning.
- Find the convective core/envelope boundaries flipping with mass
  (the Schwarzschild criterion).

### Where this comes from

The four structure equations, the constant-$\beta$ $n=3$ polytrope,
and the standard model follow Eddington, *The Internal Constitution
of the Stars* (1926), and Hansen, Kawaler and Trimble, *Stellar
Interiors*, Chapters 1 to 7.

## Physical setup

A self-gravitating sphere in hydrostatic equilibrium with a polytropic equation of state P = K rho^{(n+1)/n}, n = 3 (the Eddington standard model: pressure is the sum of ideal-gas and radiation pressure with a constant ratio beta). The dimensionless structure is universal (the Lane-Emden function theta(xi)); scaling it with a chosen mass M and radius R gives the physical run of density, pressure and temperature. Nuclear burning (pp chain, CNO cycle, triple-alpha) sets the luminosity, and the Schwarzschild criterion decides which regions transport energy by convection. Composition is set by the hydrogen mass fraction X (with Z = 0.02, Y = 1 - X - Z). SI units throughout.

## Governing equations

Lane-Emden (Chandrasekhar 1939):

  (1/xi^2) d/dxi(xi^2 dtheta/dxi) = -theta^n,  theta(0) = 1, theta'(0) = 0,

with the n = 3 surface at xi_1 = 6.89685, theta'(xi_1) = -0.04243. Scaling:

  rho = rho_c theta^3,  P = P_c theta^4,  T = T_c theta,  r = R xi / xi_1,

with rho_c = (3M / 4 pi R^3)(-xi_1 / 3 theta'(xi_1)) and P_c = pi G (R/xi_1)^2 rho_c^2; T_c follows from P_c = rho_c k T_c / (mu m_H) + a T_c^4 / 3. Energy generation (Carroll and Ostlie Eqs. 10.46, 10.58, 10.62): pp ~ rho X^2 T6^4, CNO ~ rho X X_CNO T6^{19.9}, triple-alpha ~ rho^2 Y^3 T8^{41}; the pp coefficient is fixed once so the solar reference model radiates exactly L_sun. Schwarzschild: convective where nabla_rad = 3 kappa L P / (16 pi a c G m T^4) exceeds nabla_ad = 0.4, with a Kramers bound-free plus electron-scattering opacity.

## Numerical method

RK4 integration of the Lane-Emden equation from the regular centre (the xi = 0 limit uses theta'' = -1/3), with the surface located by linear interpolation of theta -> 0. Profiles are evaluated on 360 shells; the mass and luminosity are accumulated by the trapezoidal rule over the shells; the central temperature is found by Newton iteration on the gas-plus-radiation pressure. Deterministic; seed not applicable.

## Controls

- `m`: stellar mass, 0.2 to 30 M_sun (log slider), with the ZAMS radius R = M^0.7 R_sun. Sets the scaling, the central conditions, the luminosity and the convective structure.
- `x`: hydrogen mass fraction X, 0.50 to 0.90 (Z = 0.02 fixed). Changes the mean molecular weight, the energy generation and the luminosity.
- Reset, Pause/Play. Pause freezes the convective-cell animation; the structure is static.

## Expected qualitative features

- A temperature-coloured sliced star: a bright hot core, a radiative zone and a thin photosphere. The Schwarzschild zoning of the n=3 polytrope is only a coarse guide (it misses the convective cores of massive stars and the deep convective envelopes of cool dwarfs, which a polytrope cannot capture); the global L, R and Teff follow the homology zero-age main sequence.
- Density and pressure falling far faster than temperature; the luminosity rising to its total within the inner few tenths of the radius (energy is generated in the core).
- pp dominating in the solar model, the CNO cycle overtaking it for massive stars, triple-alpha negligible until ~1e8 K.
- The model point tracking the ZAMS in the HR diagram: more massive stars brighter and hotter.

## Invariants and acceptance thresholds

`invariants.test.mjs` (vitest, offline):

1. n = 3 Lane-Emden: xi_1 = 6.89685 (1e-3), theta'(xi_1) = -0.04243 (5e-4), theta monotone.
2. Solar central pressure within a factor of two of 1e16 Pa (5e15 to 2e16).
3. Solar central temperature in [1.1e7, 1.9e7] K (the Eddington model is ~20 percent low; documented).
4. Solar luminosity = L_sun within 5 percent; T_eff consistent and ~5772 K.
5. Integrated mass recovers the input mass to 1 percent.
6. rho, P, T monotone decreasing; m(r), L(r) monotone increasing; L(R) = L_tot.
7. Schwarzschild: nabla_ad = 0.4 exactly; solar interior radiative (nabla_rad < nabla_ad at the centre); a 0.2 M_sun star is more than 80 percent convective.
8. Mean molecular weight follows the ionised-mixture formula.
9. Energy generation: CNO/pp < 0.2 at 1.5e7 K but > 10 at 2.5e7 K; triple-alpha negligible at solar T; pp linear in rho.
10. ZAMS monotone: L ~ M^3.5; brighter and hotter with mass.
11. Determinism.

Visual gate: SSIM > 0.92 against committed golden frames at 60 fps.

## Limiting cases for verification

- xi -> 0: theta -> 1, the Lane-Emden source theta'' -> -1/3 (regular centre).
- Surface theta -> 0: rho, P, T -> 0; the photosphere is the outermost shell.
- Low mass (M <~ 0.3 M_sun): nabla_rad > nabla_ad throughout, the star is fully convective.
- Pure ionised hydrogen X = 1, Y = 0: mu -> 1/2.

## Visual fallback

The structure profiles and the HR diagram carry all of the physics statically; the convective-cell animation is decoration and appears only where the star is genuinely convective.

## Stack note

The backlog lists this as a WebGL2 hero. It is implemented in plain Canvas2D as a pseudo-3D temperature-coloured slice with depth shading, per the project stack constraint (hard rule 8). The justification: the physics (Lane-Emden structure, energy generation, the Schwarzschild test, the HR position) is fully carried by the 2D profiles and the sliced disc, the result is deterministically gate-verifiable under headless capture, and no volumetric ray-marching is needed to read any quantity. A photoreal 3D star adds no physical information here.

## Citations

- Carroll and Ostlie, An Introduction to Modern Astrophysics, Ch. 10 (polytropes, the Eddington model, energy generation, the Schwarzschild criterion).
- Hansen, Kawaler and Trimble, Stellar Interiors.
- Chandrasekhar, An Introduction to the Study of Stellar Structure (1939), the Lane-Emden equation.

## Stretch goals

- Replace the polytrope with a four-equation shooting integration and a realistic opacity table.
- Add evolutionary tracks off the ZAMS (core hydrogen exhaustion).

## Risk register

- The n = 3 polytrope is radiative throughout for a solar-type star and underestimates the central temperature (~1.22e7 K versus the detailed 1.57e7 K); this is the well-known property of the Eddington standard model and is stated rather than hidden, so the invariants bracket the polytropic values honestly.
- The pp rate is normalised once to the Sun; the CNO and triple-alpha temperature exponents are the textbook power laws, used for the relative hierarchy, not absolute rates.
