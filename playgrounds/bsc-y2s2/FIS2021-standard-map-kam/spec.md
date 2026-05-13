---
title: Chirikov Standard Map - KAM Tori
slug: standard-map-kam
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2021
supporting_ucs: []
curriculum_year: bsc-y2s2
---

# Chirikov standard map and KAM-torus breakdown

## Physical setup

The standard map is the discrete-time area-preserving map
  p_{n+1} = p_n + K sin(theta_n) (mod 2 pi)
  theta_{n+1} = theta_n + p_{n+1} (mod 2 pi)
on the torus (theta, p) in [0, 2 pi)^2. It is the Poincare section of a periodically kicked rotator. At K = 0 the dynamics is integrable; at finite K the KAM theorem guarantees that sufficiently irrational tori survive while rational ones break into chains of resonance islands. The golden-mean torus breaks last, at K_crit ~ 0.9716 (Greene 1979).

## Governing equations

Single-step Jacobian:
  J = [[ 1, 1 ],
       [ K cos(theta), 1 + K cos(theta) ]]

det J = 1 (area preservation).

## Numerical method

Direct iteration of the discrete map. Lyapunov exponent via a single tangent vector with periodic renormalization every 100 iterates.

## Controls

- K: kick amplitude, slider 0.0 - 3.0, default 0.971
- n/orbit: orbit length, slider 200 - 3000, default 1200
- Reset orbits: regenerate the base portrait
- Snap K to K_crit: set K = 0.971635

Click anywhere on the plot to seed a new orbit at that (theta_0, p_0).

## Expected qualitative features

1. K = 0: horizontal lines p = const are invariant.
2. K = 0.4: most tori survive; small island chains appear at rational p/2 pi.
3. K = K_crit: the last large-scale KAM torus breaks; large connected regions of chaos appear, but most of the torus is still covered by regular curves.
4. K = 2 - 3: chaos dominates; orbits diffuse vertically across all of p.

## Invariants and acceptance thresholds

- K = 0: p stays at its initial value to within 1e-12 over 10_000 iterates.
- K = 0: Lyapunov exponent < 1e-10.
- K = 0.1: Lyapunov exponent < 0.05 for a typical orbit.
- K = 2.0: Lyapunov exponent > 0.4 over 50_000 iterates.
- K = 2.0: an orbit covers > 30 of 64 (theta, p) bins.
- K_crit matches the Greene 1979 value to 5 sig figs.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- K = 0: free rotation, integrable.
- K << 1: KAM regime, almost all initial conditions on regular tori.
- K -> infinity: random map, full chaos.

## Visual fallback

Canvas2D only.

## Citations

- Chirikov 1979, "A universal instability of many-dimensional oscillator systems", Physics Reports 52, 263 - 379.
- Greene 1979, "A method for determining a stochastic transition", Journal of Mathematical Physics 20, 1183.
- Ott 2002, Chaos in Dynamical Systems, 2e, Section 7.4 (`ott2002`).

## Stretch goals

- Highlight the last surviving golden-mean torus across the K sweep.
- Add a fixed-point and period-2 island finder.

## Risk register

- For large K (say K > 2.5) and long orbits (n > 2000) the user can saturate the canvas. The fixed default 1200 keeps the render fast.
- iterateOrbit allocates two Float64Arrays of length n per orbit. With 24 base orbits plus up to 8 user orbits that is at most 32 * 3000 * 2 * 8 = 1.5 MiB, well below the canvas memory budget.
