---
title: Displacement Current
slug: displacement-current-maxwell
status: verified
audience: portfolio
created: 2026-06-21
primary_uc: FIS1014
supporting_ucs: []
curriculum_year: bsc-y1s2
primary_citation: griffithsem2017
primary_chapter: 7
hook: "Current flows in the wires to a capacitor but stops at the plates, yet a magnetic field still circles the gap. Maxwell's displacement current is the missing term that closes Ampere's law and makes light possible."
one_paragraph: "Charging a capacitor through a resistor, the conduction current in the wires stops at the plates, yet an Amperian loop around the gap still finds a circulating B. Maxwell added the displacement current I_disp = eps0 dPhi_E/dt to Ampere's law; since the gap field is E = Q/(eps0 A), this equals dQ/dt = I_cond exactly, so the total current is continuous and B is the same at the wire and at the gap. The playground charges the capacitor with conduction current in the wires and a building E field in the gap, lets a slidable Amperian loop enclose either current (the same value), and plots both currents versus time, where they coincide exactly while the field rises. This missing term is what links changing E and B into an electromagnetic wave."
tags: [electromagnetism, maxwell, induction, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
invariants:
  - key: equal
    label: the displacement current equals the conduction current at every instant
    tolerance: 1e-3
  - key: ampere
    label: B is the same on a loop around the wire or around the gap
    tolerance: 1e-3
  - key: charge
    label: the conduction current is the time derivative of the plate charge
    tolerance: 1e-3
what_to_try:
  - Slide the Amperian loop from a wire into the gap; the enclosed current is unchanged.
  - The conduction and displacement currents lie on top of each other in the plot, both decaying as exp(-t/RC).
  - Raising R or C lengthens the time constant RC, slowing the charging and the current decay.
references:
  - "Griffiths, Introduction to Electrodynamics, Fifth ed., Sec. 7.3 (the displacement current)."
  - "Halliday, Resnick and Walker, Fundamentals of Physics, Ch. 32 (Maxwell's equations)."
---

# Displacement current

## Physical setup

A parallel-plate capacitor of capacitance $C$ is charged from rest through a
resistor $R$ by a source of EMF $V$. Conduction current flows in the wires and
deposits charge on the plates; between the plates no charge crosses, but the
electric field grows as the charge accumulates.

## Equations

The RC charging gives charge $Q(t) = CV\,(1 - e^{-t/RC})$ and conduction current

$$I_\text{cond}(t) = \frac{V}{R}\, e^{-t/RC}.$$

The field between the plates is $E = Q/(\varepsilon_0 A)$, so the electric flux is
$\Phi_E = EA = Q/\varepsilon_0$, and Maxwell's displacement current is

$$I_\text{disp} = \varepsilon_0\, \frac{d\Phi_E}{dt} = \frac{dQ}{dt} = I_\text{cond}.$$

The Maxwell-Ampere law $\oint \mathbf{B}\cdot d\boldsymbol{\ell} = \mu_0\,(I_\text{cond} + \varepsilon_0\, d\Phi_E/dt)$
then gives the same $B$ whether the Amperian loop is threaded by the wire (which
carries $I_\text{cond}$) or by the gap (which carries $I_\text{disp}$). Field
constants are set to unity in the simulation; the equality $I_\text{disp} = I_\text{cond}$
is exact and independent of them.

## Numerical method

Closed form; no engine. The displacement current is computed independently of the
conduction current as a central difference of the electric flux $\Phi_E(t)$, and
comes out equal to $I_\text{cond}$ to machine precision.

## Controls

- Resistance $R$ and capacitance $C$ (which set the time constant $RC$).
- Amperian-loop position along the axis (wire or gap).
- Recharge (relaunch from $t = 0$) and Pause.

## Expected qualitative features

1. Conduction current in the wires, a building electric field in the gap.
2. The Amperian loop encloses the same current whether on a wire or in the gap.
3. The conduction and displacement currents coincide at every instant and decay
   as $e^{-t/RC}$ while the gap field rises to $V/d$.

## Invariants and acceptance thresholds

- $I_\text{disp} = \varepsilon_0\, d\Phi_E/dt = I_\text{cond}$ at every instant
  (relative difference below $10^{-3}$).
- $B$ from the wire-enclosing loop equals $B$ from the gap-enclosing loop.
- The conduction current is the time derivative of the plate charge.

## Citations

Griffiths, Introduction to Electrodynamics, 5th ed., Sec. 7.3. Halliday, Resnick
and Walker, Fundamentals of Physics, Ch. 32.
