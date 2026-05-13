---
title: FitzHugh-Nagumo Excitable Neuron
slug: fitzhugh-nagumo-excitable
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2021
supporting_ucs: []
curriculum_year: bsc-y2s2
---

# FitzHugh-Nagumo excitable neuron

## Physical setup

Two-variable reduction of the Hodgkin-Huxley model:
  v' = v - v^3 / 3 - w + I
  w' = epsilon (v + a - b w)
with a = 0.7, b = 0.8, epsilon = 0.08. v is fast (voltage); w is slow
(recovery). External input I tunes the system from excitable rest to
sustained limit-cycle firing through a Hopf bifurcation.

## Governing equations

Above. RK4 with dt = 0.05.

## Controls

- I: external input, 0 to 1.
- speed: integrator steps per frame.
- kick: forcibly set v = 0 (subthreshold perturbation).
- Reset / Pause / Play.

## Expected qualitative features

1. I = 0, rest IC: voltage stays near v_rest approx -1.2.
2. I = 0, kick: single full action potential (spike) before returning to rest.
3. I = 0.5: periodic firing (limit cycle).
4. Phase portrait shows the cubic v-nullcline and linear w-nullcline.

## Invariants and acceptance thresholds

1. Rest state is a fixed point.
2. Subthreshold perturbation: max(v) < 0.5.
3. Suprathreshold: peak v > 1.5 (full spike).
4. I = 0.5: many oscillations (limit cycle).
5. Rest-state consistency: v + a - b w = 0.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- I = 0: excitable rest.
- I large enough: Hopf, periodic firing.

## Visual fallback

Canvas2D only. Left: v(t) (cyan) and w(t) (orange) traces. Right: phase
portrait with cubic v-nullcline (cyan), linear w-nullcline (orange), and
trajectory (yellow).

## Citations

- FitzHugh 1961 Biophys J 1, 445 (`fitzhugh-nagumo1961`).
- Nagumo, Arimoto, Yoshizawa 1962 Proc IRE 50, 2061.
- Strogatz, Nonlinear Dynamics Ch. 7.

## Stretch goals

- Spatial FHN (reaction-diffusion) for traveling waves.
- Detailed Hodgkin-Huxley comparison.
- Synaptic coupling between two FHN neurons.

## Risk register

- For very large I the system can leave the displayed phase-portrait
  bounding box; slider capped at I = 1.
