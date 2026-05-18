---
title: Predator-Prey and the Hopf Bifurcation
slug: predator-prey-hopf
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2021
supporting_ucs: []
curriculum_year: bsc-y2s2
hook: 'Enrich a predator-prey system and a stable coexistence point gives way to permanent boom-and-bust cycles: the paradox of enrichment.'
one_paragraph: 'The Rosenzweig-MacArthur model adds a saturating (Holling type II) predator response to logistic prey. For some parameters predator and prey settle to a stable coexistence equilibrium; raise the prey carrying capacity and that equilibrium loses stability through a Hopf bifurcation, replaced by a stable limit cycle of large population swings. The playground shows the phase plane with its nullclines and the time series as you tune parameters, so the spiral-in equilibrium visibly turns into a sustained cycle. This is the ecological paradox of enrichment: more food destabilizes the system. Reference: Strogatz, Nonlinear Dynamics and Chaos; Murray, Mathematical Biology.'
tags: [mechanics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Predator-prey and the Hopf bifurcation

## Physical setup

Rosenzweig-MacArthur predator-prey model with Holling Type II response:
  x' = r x (1 - x / K) - a x y / (b + x)
  y' = e a x y / (b + x) - d y

with r = 0.5, a = 1, b = 0.3, e = 0.5, d = 0.2.

## Governing equations

Above. Interior equilibrium at xStar = b d / (e a - d) = 0.2,
yStar = (r / a) (1 - xStar / K) (b + xStar). Hopf threshold K_H = b + 2 xStar
= 0.7 for these parameters.

## Numerical method

Fourth-order Runge-Kutta, dt = 0.02. Populations clamped to >= 0 to handle
the rare extinction trajectory at large K.

## Controls

- K: prey carrying capacity, 0.4 to 2.0 (Hopf at K_H ~ 0.7).
- speed: integrator steps per render frame.
- Reset / Pause / Play.

## Expected qualitative features

1. K < K_H = 0.7: coexistence equilibrium is a stable focus; trajectory
   spirals inward to (x*, y*).
2. K just above K_H: small-amplitude limit cycle (sqrt(K - K_H) law).
3. K well above K_H: large amplitude limit cycle; near-extinction events
   in the prey trough.

## Invariants and acceptance thresholds

1. Equilibrium is a fixed point: placed there, system stays within 1e-4.
2. K = 1.5 (above Hopf): amplitude > 0.5 after warmup.
3. Non-negative populations.
4. xStar = b d / (e a - d) exact.
5. Hopf threshold computed and positive.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- K small: equilibrium stable, no cycle.
- K large: paradox of enrichment (limit cycle, sometimes leading to
  numerical extinction).
- y = 0: pure logistic prey growth.

## Visual fallback

Canvas2D only. Left: phase portrait with equilibrium marker (green if
stable, orange if Hopf-unstable). Right: time series x(t), y(t).

## Citations

- Strogatz, Nonlinear Dynamics 2e Ch. 8.
- Rosenzweig and MacArthur 1963, American Naturalist.

## Stretch goals

- Multiple species food web.
- Stochastic perturbation (demographic noise).
- Bifurcation diagram K -> amplitude.

## Risk register

- For very large K, prey can crash to zero, leaving predator extinct.
  Slider capped at 2.0 to avoid this regime.
- Clamping to >= 0 prevents non-physical negative populations.
