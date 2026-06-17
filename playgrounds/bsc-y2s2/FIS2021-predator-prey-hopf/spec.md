---
title: Predator-Prey and the Hopf Bifurcation
slug: predator-prey-hopf
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2021
primary_citation: strogatz2015
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
references:
  - "Griffiths, Introduction to Quantum Mechanics, Third ed."
---

# Predator-prey and the Hopf bifurcation

## Explainer

### What you are looking at

Predators and prey. Give the prey more food (raise their carrying
capacity) and intuition says the system gets healthier. Instead, the
stable balance suddenly collapses into wild boom-and-bust cycles. This
is the paradox of enrichment, and it falls straight out of a Hopf
bifurcation.

### The model

The Rosenzweig-MacArthur equations: logistic prey $x$, predators $y$
with a saturating (Holling type II) appetite:

$$\dot x = r\,x\!\left(1 - \frac{x}{K}\right)
  - \frac{a\,x\,y}{b + x},$$

$$\dot y = \frac{e\,a\,x\,y}{b + x} - d\,y.$$

The $a x y/(b+x)$ term is the key: each predator can only eat so fast,
so its kill rate saturates as prey become abundant. $K$ is the prey
carrying capacity, the "enrichment" knob.

### The Hopf bifurcation

There is an interior equilibrium where prey and predator coexist at
fixed numbers $x^* = bd/(ea - d)$, $y^* = \ldots$. For small $K$ it is
a stable spiral: perturb it and the populations spiral back to balance.
Raise $K$ past the Hopf threshold

$$K_H = b + 2x^* = 0.7\ \text{(for the default parameters)},$$

and that equilibrium loses stability. A stable limit cycle is born
around it: the populations now orbit forever in large amplitude
oscillations. Enriching the prey did not stabilize the system, it
destabilized it. The playground shows the phase plane with its
nullclines and the time series, so you watch the inward spiral turn
into a sustained cycle as $K$ crosses $K_H$.

### Things to try

- Set $K$ below 0.7 and watch the populations spiral into the stable
  coexistence point.
- Raise $K$ past 0.7 and watch a limit cycle appear, predator and prey
  swinging between booms and crashes.
- Push $K$ very high and see the cycle nearly graze extinction
  (deep crashes), the practical danger of the paradox.

### Where this comes from

The Rosenzweig-MacArthur model, the Holling type II response, and the
Hopf bifurcation / paradox of enrichment follow Strogatz, *Nonlinear
Dynamics and Chaos*, 2nd ed. (Hopf bifurcation), and Murray,
*Mathematical Biology*.

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
