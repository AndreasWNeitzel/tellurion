---
title: Friedmann Expansion: Radiation, Matter and Lambda Eras
slug: friedmann-expansion-multicomponent
status: verified
audience: portfolio
created: 2026-05-18
primary_uc: MF-GR
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: ryden-cosmology
hook: 'A flat universe of radiation, matter and a cosmological constant runs through three eras: radiation domination, then matter, then dark energy. The expansion decelerates and then accelerates, the age comes out at 13.8 Gyr, and at a = 1 the Hubble parameter is exactly H0.'
one_paragraph: 'An interactive flat multicomponent FLRW universe (Friedmann 1922; Ryden, Introduction to Cosmology; Planck 2018 parameters). The Friedmann equation H(a)^2 = H0^2 (Or/a^4 + Om/a^3 + OL) with the flat closure Or + Om + OL = 1 gives H(1) = H0 exactly, an age t0 = (1/H0) integral_0^1 da/(a E) of about 13.8 Gyr for Planck LCDM, the matter-radiation equality at a = Or/Om (z ~ 3400) and matter-Lambda equality at a = (Om/OL)^{1/3} (z ~ 0.3), and a deceleration parameter q(a) that is positive in the matter era and negative today (q0 ~ -0.53), with H falling to the de Sitter floor H0 sqrt(OL). The galaxy-grid panel expands with a(t) through the eras with the particle-horizon and Hubble-radius circles; the second panel shows a(t) decelerating then accelerating and H(t) toward the floor; the third stacks the radiation/matter/Lambda density fractions versus log a with the equality epochs. The numerics are the gate-tested sim.js: multicomponent Friedmann, RK4 scale factor, Simpson age and horizon integrals; deterministic, no RNG. The invariants check H(1) = H0 to 0.01%, the age = 13.8 Gyr to 1%, the density fractions summing to 1 with the eras in order, the equality epochs, the decelerate-then-accelerate transition with q0 < 0, the de Sitter H floor, and monotone expansion.'
tags: [cosmology, expansion, dark-energy, friedmann, live-readout]
difficulty: 4
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [om, h0, or]
---

# Friedmann Expansion: Radiation, Matter and Lambda Eras

## Physical setup

A spatially flat universe filled with radiation, pressureless matter
and a cosmological constant. Each component dilutes differently as the
universe expands (radiation as a^-4, matter as a^-3, Lambda constant),
so the universe passes through a radiation era, a matter era and a
dark-energy era, and the expansion switches from decelerating to
accelerating.

## Governing equations

Multicomponent Friedmann equation (Ryden; Planck 2018):

```math
H(a)^2 = H_0^2\Big(\frac{\Omega_r}{a^4} + \frac{\Omega_m}{a^3}
  + \Omega_\Lambda\Big), \qquad \Omega_r+\Omega_m+\Omega_\Lambda=1,
```

so `H(1) = H_0`. The age is
`t_0 = H_0^{-1}\int_0^1 da/(a E(a))`, the equality epochs are
`a_{rm} = \Omega_r/\Omega_m` and
`a_{m\Lambda} = (\Omega_m/\Omega_\Lambda)^{1/3}`, and the
deceleration parameter is
`q(a) = \tfrac12\sum_i \Omega_i(a)(1+3w_i)`
(`w_r=1/3, w_m=0, w_\Lambda=-1`), zero at
`a = (\Omega_m/2\Omega_\Lambda)^{1/3}`.

## Numerical method

`H(a)`, the density fractions, the age and the comoving particle
horizon are closed form / Simpson quadrature; `a(t)` is RK4 of
`da/dt = a H(a)`. `H_0` is converted from km/s/Mpc to 1/Gyr so ages
come out in Gyr. The sweep advances the scale factor logarithmically
(the eras span many decades in `a`); the capture path maps capture
fraction directly to that, so reference frames are reproducible and
frame-rate independent. Deterministic, no RNG.

## Controls

- `Omega_m` (share key `om`): the matter density; `Omega_Lambda` is
  fixed by the flat closure.
- `H0` (share key `h0`): the Hubble constant (km/s/Mpc); sets the age
  and timescales.
- `Omega_r` (share key `or`): the radiation density (small); sets the
  matter-radiation equality.
- Reset (Planck: `Omega_m = 0.315`, `H0 = 67`, `Omega_r ~ 9e-5`),
  Pause/Play (the cosmic-time sweep), Copy URL.

## Expected qualitative features

- The galaxy grid expands enormously from a tiny early universe to a
  sparse late one; the horizons grow.
- `a(t)` is concave (decelerating) then convex (accelerating);
  `H(t)` falls toward `H0 sqrt(OL)`.
- The density bands show radiation, then matter, then Lambda, with
  sharp crossovers at the equality epochs.
- The age is `13.8 Gyr` and `H = H0` at `a = 1` for Planck values.

## Invariants and acceptance thresholds

Checked offline in `invariants.test.mjs` (8 tests):

1. `H(1) = H0` to 0.01% (flat closure exact).
2. The age is `13.8 Gyr` for Planck LCDM (1%).
3. The density fractions sum to 1; radiation/matter/Lambda dominate
   in order.
4. The equality epochs are `Or/Om` and `(Om/OL)^{1/3}` with the
   fractions crossing there.
5. The expansion decelerates then accelerates; `q0 ~ -0.53`,
   `q -> -1`, `q = 0` at the onset.
6. `H(a)` decreases toward the de Sitter floor `H0 sqrt(OL)`.
7. The particle horizon and Hubble radius are order `c/H0`; `a(t)`
   is monotone.
8. Determinism.

## Limiting cases for verification

- `a -> 0`: radiation dominates, `H -> infinity` (test 3, 6).
- `a -> infinity`: Lambda dominates, `H -> H0 sqrt(OL)`, `q -> -1`
  (tests 5, 6).
- `a = 1` flat: `H = H0` exactly (test 1).
- Planck parameters: age `13.8 Gyr` (test 2).

## Visual fallback

Static three-panel Canvas2D: the `a(t)`/`H(t)` curves and the
density-era bands are fully informative without animation; only the
galaxy grid and the era playhead sweep.

## Citations

- Ryden, B., *Introduction to Cosmology*, 2nd ed., CUP 2017.
  `ryden-cosmology`.
- Friedmann, A., Z. Phys. 10, 377 (1922). `friedmann1922`.
- Aghanim, N. et al. (Planck), A&A 641, A6 (2020).
  `planck2018-vi`.

## Stretch goals

- Open / closed universes (curvature `Omega_k/a^2`).
- Quintessence with a time-varying `w(a)`.
- The comoving and luminosity distance ladders and `z(t)`.

## Risk register

- The age and horizon integrals are improper at `a -> 0`: a small
  `a_min` cutoff is used; the radiation term keeps the integrand
  integrable and the 1% age gate guards accuracy.
- `H0` unit conversion (km/s/Mpc to 1/Gyr): a single constant,
  pinned by the 13.8 Gyr age invariant.
- The flat closure overrides `Omega_Lambda`; the `H(1) = H0`
  invariant is then exact by construction and tested for arbitrary
  inputs.
