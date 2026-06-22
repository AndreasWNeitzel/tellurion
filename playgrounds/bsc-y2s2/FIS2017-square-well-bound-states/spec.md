---
title: Bound States of the Finite Square Well
slug: square-well-bound-states
status: verified
audience: portfolio
created: 2026-06-22
primary_uc: FIS2017
curriculum_year: bsc-y2s2
primary_citation: griffiths-qm
primary_chapter: 2
hook: "Trap a quantum particle in a finite box and only a handful of energies fit. Watch the even and odd branches meet a circle at each allowed level."
one_paragraph: "A particle in a finite square well of depth V0 and width L has a discrete set of bound states: inside the well the wavefunction oscillates with k = sqrt(2mE)/hbar, outside it decays as exp(-kappa|x|), and continuity of the wavefunction and its slope at the walls allows only certain energies. In z = kL/2 with z0 = (L/2) sqrt(2 m V0)/hbar the conditions are z tan z = sqrt(z0^2 - z^2) (even) and z cot z = -sqrt(z0^2 - z^2) (odd), solved graphically where the branches meet a circle of radius z0. The playground draws the well, the levels, and the selected wavefunction with its forbidden-region tails, alongside that graphical solution; the count is floor(z0/(pi/2)) + 1, always at least one."
tags: [quantum, square-well, bound-states, eigenvalues, interactive, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [V0, L]
invariants:
  - key: count
    label: the number of bound states is floor(z0/(pi/2)) + 1
    tolerance: 0.0
  - key: match
    label: each level solves its transcendental matching condition
    tolerance: 1e-4
  - key: nodes
    label: the n-th state has n interior nodes and parity (-1)^n
    tolerance: 0.0
what_to_try:
  - Click each level; the matching crossing lights up in the graphical solution, even and odd alternating.
  - Deepen or widen the well; the circle grows and admits more states, the count being floor(z0/(pi/2)) + 1.
  - Shrink the well; states drop out one by one, but one even state always survives.
references:
  - "Griffiths, Introduction to Quantum Mechanics, 2nd ed., Sec. 2.6 (the finite square well)."
  - "Gasiorowicz, Quantum Physics, 3rd ed., Ch. 5."
---

# Bound states of the finite square well

## Physical setup

A particle of mass m sits in a finite square well, V = 0 for |x| < L/2 and V = V0
outside, and we seek the bound states 0 < E < V0.

## Equations

Inside, $\psi'' = -k^2\psi$ with $k = \sqrt{2mE}/\hbar$; outside,
$\psi'' = \kappa^2\psi$ with $\kappa = \sqrt{2m(V_0-E)}/\hbar$. Matching $\psi$ and
$\psi'$ at the walls, in $z = kL/2$ and $z_0 = \tfrac{L}{2}\sqrt{2mV_0}/\hbar$,

$$ z\tan z = \sqrt{z_0^2 - z^2} \ \text{(even)}, \qquad z\cot z = -\sqrt{z_0^2 - z^2} \ \text{(odd)}, $$

with energies $E_n/V_0 = (z_n/z_0)^2$ and $\lfloor z_0/(\pi/2)\rfloor + 1$ states.

## Numerical method

The matching conditions are solved by bracketed bisection in each half-period;
the wavefunctions are the matched cosine/sine and exponential pieces. No
fabricated levels: every energy is a real root of the transcendental equation.

## Controls

- Well depth V0, width L; click a level to select it.

## Expected qualitative features

1. A discrete ladder of levels, even and odd alternating, the ground state
   nodeless and even.
2. The wavefunctions oscillate inside and decay into the forbidden region.
3. Deepening or widening the well admits more bound states; one always remains.

## Invariants and acceptance thresholds

- Count $= \lfloor z_0/(\pi/2)\rfloor + 1$.
- Each level solves its matching condition.
- The n-th state has n interior nodes and parity $(-1)^n$.

## Citations

Griffiths, Introduction to Quantum Mechanics, 2nd ed., Sec. 2.6. Gasiorowicz,
Quantum Physics, 3rd ed., Ch. 5.
