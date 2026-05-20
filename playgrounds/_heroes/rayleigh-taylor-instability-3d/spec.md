---
title: Rayleigh-Taylor Instability (Hero)
slug: rayleigh-taylor-instability-3d
status: verified
audience: portfolio
created: 2026-05-20
primary_uc: FIS2014
supporting_ucs: [AST3014]
curriculum_year: hero
primary_citation: chandrasekhar-hydro
primary_chapter: 10
hero_candidate: true
hook: 'A dense fluid sitting on top of a lighter one is unstable: the interface develops downward spikes and upward bubbles. The growth rate is sigma = sqrt(A k g); supernova remnants, jellyfish nebulae, and pancake-batter inversions all show the same fingers.'
one_paragraph: 'A dense fluid (density rho_h) above a lighter one (rho_l) in a gravity field g is unstable: any small perturbation of the interface grows exponentially with rate sigma(k) = sqrt(A k g), where A = (rho_h - rho_l)/(rho_h + rho_l) is the Atwood number. Surface tension stabilises wavelengths smaller than the capillary length. In the nonlinear stage, dense fluid develops downward spikes that fall at terminal velocity v ~ sqrt(A g lambda); light fluid develops upward bubbles. Rayleigh-Taylor sculpts the iconic spire structure of supernova remnants (Crab, Cas A), the pancake of inverted fluid in everyday kitchen physics, and the mushroom cloud above a nuclear blast. The playground tracks a population of tracer particles in a Boussinesq-style velocity field through the linear amplification and into the spike-bubble nonlinear regime. Reference: Chandrasekhar, Hydrodynamic and Hydromagnetic Stability, Ch. 10.'
caption: 'Figure 1. Rayleigh-Taylor instability of a dense (red) over light (blue) interface in a gravity field. Initial sinusoidal perturbation grows as exp(sigma t), then saturates into spike-bubble structure. Method: linear exp(sigma t) growth + kinematic nonlinear advection. Source: Chandrasekhar, Hydrodynamic and Hydromagnetic Stability, Ch. 10.'
tags: [fluid-dynamics, astrophysics, animation, three-d, live-readout]
difficulty: 4
tier: single
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [atwood, gravity, k_mode]
---

# Rayleigh-Taylor instability
sigma = sqrt(A k g). Source: Chandrasekhar, *Hydrodynamic and Hydromagnetic Stability*, Oxford 1961, Ch. 10 (`chandrasekhar-hydro`); originals: Rayleigh, *Proc. Lond. Math. Soc.* 14 (1883) 170; Taylor, *Proc. R. Soc. A* 201 (1950) 192.

## Explainer

### What you are looking at

A dense fluid (red) is held above a lighter fluid (cyan) by some
unstable equilibrium (e.g. a thin membrane); gravity points down. Any
tiny perturbation of the horizontal interface grows: red parcels of
the dense fluid fall downward in spikes; cyan parcels of the light
fluid rise in bubbles. This is the Rayleigh-Taylor instability, the
shorter-wavelength sibling of Kelvin-Helmholtz.

### The dispersion relation

Linearising the inviscid incompressible equations about a static
density jump gives

$$\sigma^2(k) \;=\; A\, k\, g \;-\; \frac{T\, k^3}{\rho_1 + \rho_2}\,,$$

with $A = (\rho_h - \rho_l)/(\rho_h + \rho_l)$ the Atwood number and
$T$ the surface tension (Chandrasekhar 1961). For $T = 0$:
$\sigma = \sqrt{A k g}$. High-$k$ modes grow fastest, so the
shortest unresolvable wavelength dominates without dissipation. With
$T > 0$ the spectrum has a maximum at

$$k_{\max} \;=\; \sqrt{\frac{A g (\rho_1 + \rho_2)}{3 T}}\,.$$

For $A < 0$ (light fluid on top, stable stratification), $\sigma^2 < 0$
and the interface oscillates with internal-gravity-wave frequency
$\omega = \sqrt{|A| k g}$.

### The nonlinear stage: bubbles and spikes

Once the amplitude is comparable to the wavelength, linear theory
breaks. The interface develops a row of mushroom-shaped *bubbles*
(light rises) and *spikes* (dense falls). The bubble terminal
velocity is (Davies-Taylor 1950)

$$v_{\rm bubble} \;\sim\; \sqrt{A\, g\, R},$$

with $R$ the bubble radius. Spikes accelerate freely and become
narrow as they fall; secondary Kelvin-Helmholtz instability tears
their sides into the familiar "mushroom" outline.

### Symbols

- $\rho_h, \rho_l$: density of the heavy and light fluids.
- $A = (\rho_h - \rho_l)/(\rho_h + \rho_l)$: Atwood number, $[-1, 1]$.
- $g$: gravitational acceleration.
- $k$: wavenumber of the perturbation; $\lambda = 2\pi/k$.
- $T$: surface tension.
- $\sigma$: linear growth rate.
- $v_{\rm bubble}$: terminal speed of a rising bubble.

### Where you see this in nature

- The mushroom-shaped fingers of the **Crab Nebula** and other
  young supernova remnants.
- The *jellyfish-galaxy* tails ram-pressure stripped from cluster
  galaxies.
- The bottom of laboratory hot-fluid setups when poured carelessly.
- The **mushroom cloud** above a high-energy explosion (Sedov-Taylor
  blast wave + RT instability of the contact discontinuity).
- The crust-mantle boundary in convecting Earth simulations.

### Things to try

- Push Atwood $A$ to near 1 (dense fluid much heavier): rapid spike
  development.
- Set $A = 0$: no growth (densities equal, no driving force).
- Negative $A$ (light on top, stable configuration): the interface
  oscillates instead of breaking.
- Sweep the wavenumber $k$: see linear-theory growth $\sigma =
  \sqrt{A k g}$ in the readout.

### Where this comes from

Original analyses: Rayleigh, *Proc. Lond. Math. Soc.* 14 (1883) 170;
Taylor, *Proc. R. Soc. A* 201 (1950) 192. Modern derivation:
Chandrasekhar, *Hydrodynamic and Hydromagnetic Stability*, Oxford
1961, Chapter 10. Review of nonlinear regime: Sharp, *Physica D* 12
(1984) 3.
