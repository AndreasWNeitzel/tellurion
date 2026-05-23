---
title: FitzHugh-Nagumo Excitable Neuron
slug: fitzhugh-nagumo-excitable
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2021
supporting_ucs: []
curriculum_year: bsc-y2s2
hook: 'Poke a resting neuron model gently and nothing happens; poke it past a threshold and it fires a full spike, every time the same size.'
one_paragraph: 'FitzHugh-Nagumo is the two-variable cartoon of the Hodgkin-Huxley neuron: a fast voltage v with a cubic nonlinearity and a slow recovery variable w. Below threshold a perturbation just decays back to rest; above it the trajectory makes a large all-or-nothing excursion (a spike) before recovering, and a steady injected current turns that into a repetitive spike train through a Hopf bifurcation. The playground shows the phase plane with its nullclines and the v(t) trace, so you watch sub-threshold decay versus the all-or-nothing firing directly. This is the minimal model of nerve excitability. Reference: FitzHugh 1961; Izhikevich, Dynamical Systems in Neuroscience.'
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
---

# FitzHugh-Nagumo excitable neuron

## Explainer

### What you are looking at

A neuron does something odd: a small poke does almost nothing, but a
poke past a threshold triggers a big, stereotyped spike that always
looks the same regardless of how hard you pushed. The playground is
the FitzHugh-Nagumo model, the minimal two-variable system that
captures this all-or-nothing excitability and its phase-plane
geometry.

### The equations

A two-variable reduction of Hodgkin-Huxley: a fast voltage-like
variable $v$ and a slow recovery variable $w$,

$$\dot v = v - \tfrac13 v^3 - w + I,
  \qquad
  \dot w = \varepsilon\,(v + a - b w),$$

with $\varepsilon\ll1$ making $w$ slow. The cubic $v$-nullcline
($\dot v=0$) and the linear $w$-nullcline ($\dot w=0$) and where they
cross set the entire behavior.

### Excitability, threshold and limit cycles

The geometry explains the physiology:

- One stable fixed point on the left branch of the cubic: the
  resting state. A tiny perturbation decays back.
- But a perturbation past the middle (unstable) branch of the cubic
  cannot return directly; it is forced on a long excursion up the
  right branch and back, a single large spike, before recovering.
  That is the threshold and the all-or-nothing action potential, and
  it explains the refractory period (while $w$ recovers, a second
  spike is hard to fire).
- Inject steady current $I$: the fixed point shifts past a Hopf
  bifurcation and the system fires a periodic train (a stable limit
  cycle), the neuron tonically spiking.

This relaxation-oscillator structure (fast jumps, slow recovery) is
generic: it is also the model for cardiac pacemakers, the Belousov
chemical oscillator, and any excitable medium. The playground shows
the phase plane with both nullclines and the trajectory, plus the
voltage trace, as you change $I$ and the stimulus.

### Things to try

- Give a sub-threshold kick and watch it decay; give a slightly
  bigger one and watch the full spike fire (all-or-nothing).
- Fire two pulses close together and see the second fail (the
  refractory period).
- Ramp the injected current $I$ until the rest point loses stability
  and a limit cycle appears (tonic spiking, the Hopf bifurcation).

### Where this comes from

The FitzHugh-Nagumo model, excitability and the phase-plane analysis
follow FitzHugh, Biophys. J. 1, 445 (1961), and Strogatz, *Nonlinear
Dynamics and Chaos*, Chapters 7 and 8.

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

- FitzHugh 1961 Biophys J 1, 445.
- Nagumo, Arimoto, Yoshizawa 1962 Proc IRE 50, 2061.
- Strogatz, Nonlinear Dynamics Ch. 7.

## Stretch goals

- Spatial FHN (reaction-diffusion) for traveling waves.
- Detailed Hodgkin-Huxley comparison.
- Synaptic coupling between two FHN neurons.

## Risk register

- For very large I the system can leave the displayed phase-portrait
  bounding box; slider capped at I = 1.
