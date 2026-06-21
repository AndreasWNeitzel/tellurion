---
title: The LR Circuit Transient
slug: inductance-lr-transient
status: verified
audience: portfolio
created: 2026-06-21
primary_uc: FIS1014
curriculum_year: bsc-y1s2
primary_citation: griffithsem2017
primary_chapter: 7
hook: "An inductor will not let the current jump. Close the switch and it ramps up as 1 - e^{-t/tau}; open it and the stored magnetic energy drains into the resistor."
one_paragraph: "Closing a switch onto a battery in a series LR circuit gives L dI/dt + R I = V, so the current rises as I(t) = (V/R)(1 - e^{-t/tau}) with tau = L/R, held back by the inductor's back-EMF V_L = L dI/dt that starts at V and decays, with V_R + V_L = V throughout. As the current builds, so does the inductor's magnetic field and the energy U = (1/2) L I^2 stored in it. Opening the switch decays the current as I_0 e^{-t/tau} and dumps that energy into the resistor. The playground draws the circuit with the current flowing and the field lines growing, the back-EMF opposing the change, and plots the current and the back-EMF versus time. The transient is integrated with an unconditionally stable backward-Euler step."
tags: [electromagnetism, induction, circuits, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [V, L, R]
invariants:
  - key: tau
    label: the current reaches 0.632 of V/R at one time constant tau = L/R
    tolerance: 1e-2
  - key: kvl
    label: V_R + V_L = V at every instant (Kirchhoff)
    tolerance: 1e-9
  - key: energy
    label: on decay the heat dissipated equals the initial stored energy
    tolerance: 1e-2
what_to_try:
  - Flip the switch off and on; the current ramps down and up exponentially and the back-EMF flips sign to keep it flowing.
  - Raise L or lower R; the time constant tau = L/R grows and the current settles more slowly.
  - The field lines grow with the current and the stored energy U = L I^2 / 2 climbs.
references:
  - "Halliday, Resnick and Walker, Fundamentals of Physics, Ch. 30 (RL circuits, energy in a magnetic field)."
  - "Griffiths, Introduction to Electrodynamics, Fifth ed., Sec. 7.2 (inductance and back-EMF)."
---

# The LR circuit transient

## Physical setup

A series circuit of an inductor L and resistor R connected by a switch to a
battery V. The inductor opposes changes in the current.

## Equations

With the switch closed, Kirchhoff's voltage law gives

$$ L\frac{dI}{dt} + R I = V \;\Rightarrow\; I(t) = \frac{V}{R}\left(1 - e^{-t/\tau}\right), \quad \tau = \frac{L}{R}, $$

with the back-EMF $V_L = L\,dI/dt = V e^{-t/\tau}$ and $V_R + V_L = V$. The energy
stored in the field is $U = \tfrac12 L I^2$. Opening the switch gives
$I = I_0 e^{-t/\tau}$, draining $U$ into the resistor as heat.

## Numerical method

No engine. The single linear ODE is advanced with a backward-Euler
(unconditionally stable) step; the current is continuous across the switch, and
the closed-form solution is reproduced.

## Controls

- Battery voltage V, inductance L, resistance R; a switch toggle (on or off);
  Reset.

## Expected qualitative features

1. The current rises exponentially to V/R and decays exponentially when the
   switch opens.
2. The back-EMF starts at V and decays, opposing the change, and reverses on
   switch-off.
3. The field lines and the stored energy grow with the current.

## Invariants and acceptance thresholds

- $I(\tau) = 0.632\,V/R$.
- $V_R + V_L = V$ at all times.
- On decay, the heat in the resistor equals the initial stored energy.

## Citations

Halliday, Resnick and Walker, Fundamentals of Physics, Ch. 30. Griffiths,
Introduction to Electrodynamics, 5th ed., Sec. 7.2.
