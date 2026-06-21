---
title: Eddy-Current Braking
slug: eddy-current-braking
status: verified
audience: portfolio
created: 2026-06-21
primary_uc: FIS1014
supporting_ucs: []
curriculum_year: bsc-y1s2
primary_citation: griffithsem2017
primary_chapter: 7
hook: "Drop two metal plates through a magnet: the solid one falls in slow motion, the slotted one drops normally. Eddy currents brake the solid plate, slots break the loops and switch the brake off."
one_paragraph: "A conducting plate falling through a localised magnetic field has a changing flux where the field varies, so Faraday's law drives circulating eddy currents and Lenz's law makes their force oppose the motion: the drag is F = (A^2/R) B'(y)^2 v, proportional to speed, to the square of the field gradient, and inversely to the plate's resistance. A solid plate (low R) is braked hard; cutting slots breaks the current loops, raises R and nearly removes the brake. The playground races a solid and a slotted plate, released together, through the same field band, drawing the eddy loops (brightest where the gradient is steepest) and plotting both speeds versus time: the solid plate stalls in the field while the slotted one keeps accelerating. This is the eddy-current brake of trains and roller coasters."
tags: [electromagnetism, induction, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
invariants:
  - key: energy
    label: gravitational work equals kinetic energy plus eddy heat
    tolerance: 0.05
  - key: brake
    label: the solid (low-resistance) plate exits slower than the slotted one
    tolerance: 0
  - key: gradient
    label: the eddy drag vanishes where the field is flat and peaks at the gradient
    tolerance: 1e-9
what_to_try:
  - Watch the speed plot: the solid curve flattens in the band while the slotted curve keeps rising.
  - Turn the field up and the solid plate is braked harder (drag scales as B^2); zero field makes both free-fall together.
  - The eddy loops glow brightest at the band edges where the gradient is steepest, fading at the flat centre.
references:
  - "Halliday, Resnick and Walker, Fundamentals of Physics, Ch. 30 (eddy currents)."
  - "Griffiths, Introduction to Electrodynamics, Fifth ed., Sec. 7.1-7.2."
---

# Eddy-current braking

## Physical setup

Two conducting plates, one solid and one slotted, are released from rest and fall
under gravity through a localised magnetic field $B(y)$ (a band centred in the
channel, modelled as a Gaussian in the vertical coordinate $y$).

## Equations

Treating a plate as a conducting loop of effective area $A$ and resistance $R$ in
the field $B(y)$, the flux is $\Phi = A B(y)$, the motional EMF is
$\mathcal{E} = -A B'(y)\, v$, the eddy current is $I = \mathcal{E}/R$, and the
Lenz force opposes the motion:

$$F = I A B'(y) = -\frac{A^2}{R}\, B'(y)^2\, v.$$

The equation of motion (unit mass) is $\dot{v} = g - \kappa\, B'(y)^2\, v$ with
$\kappa = A^2/R$. The drag is largest where the gradient $B'(y)$ is steepest (the
edges of the band) and zero where $B$ is flat. A solid plate has small $R$ (large
$\kappa$, strong braking); slots raise $R$ ($\kappa$ small, weak braking). Energy
is conserved: gravitational work becomes kinetic energy plus the heat
$\int \kappa B'^2 v^2\, dt$ dissipated in the metal.

## Numerical method

Closed form; no engine. The single linear-drag ODE is advanced with a
semi-implicit (backward Euler on the drag term) step, unconditionally stable.

## Controls

- Field strength $B$. Drop again (relaunch both plates) and Pause.

## Expected qualitative features

1. The solid plate is braked in the field band and falls behind the slotted one.
2. Stronger field brakes the solid plate harder (drag $\propto B^2$); zero field
   gives identical free fall.
3. The eddy currents are strongest at the band edges and vanish at the flat
   centre.

## Invariants and acceptance thresholds

- Gravitational work $= \tfrac12 m v^2 + $ eddy heat.
- Over the same drop the solid plate exits slower and dissipates more heat.
- The drag vanishes at the band centre ($B'(y) = 0$).

## Citations

Halliday, Resnick and Walker, Fundamentals of Physics, Ch. 30. Griffiths,
Introduction to Electrodynamics, 5th ed., Sec. 7.1-7.2.
