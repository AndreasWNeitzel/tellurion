---
title: The Millikan Oil-Drop Experiment
slug: millikan-oil-drop
status: verified
audience: portfolio
created: 2026-06-22
primary_uc: FIS2017
curriculum_year: bsc-y2s2
primary_citation: eisberg-resnick
primary_chapter: 2
hook: "Float an oil drop in mid-air and weigh its charge. Every drop, every time, carries a whole-number multiple of one fixed amount: charge is quantized."
one_paragraph: "Millikan's experiment balances a charged oil drop between capacitor plates. With the field off the drop falls at the Stokes terminal speed that fixes its radius; with the field on, the balancing voltage gives the charge q = m'gd/V. The playground draws gravity, the electric force, and drag as arrows and lets you tune the voltage to float a drop and read its charge, and the diagnostic is a ladder of measured charges from a set of drops, every one landing on an integer multiple of the elementary charge e."
tags: [modern-physics, electromagnetism, charge-quantization, millikan, elementary-charge, interactive, animation, live-readout]
difficulty: 2
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [V]
invariants:
  - key: quant
    label: every measured charge is an integer multiple of e
    tolerance: 1e-6
  - key: balance
    label: the drop has zero velocity at the balancing voltage
    tolerance: 1e-12
  - key: radius
    label: the field-off fall speed recovers the drop radius via Stokes law
    tolerance: 1e-9
what_to_try:
  - Tune the voltage until the drop floats: qE balances m'g.
  - Step through drops; each charge is a whole number of e.
  - Switch the field off; the Stokes fall speed fixes the radius.
  - Read the ladder; charges land on e, 2e, 3e, never between.
references:
  - "Eisberg and Resnick, Quantum Physics of Atoms, Molecules, Solids, Nuclei, and Particles, 2nd ed., Wiley, 1985, Ch. 2."
  - "Millikan, On the Elementary Electrical Charge and the Avogadro Constant, Phys. Rev. 2, 109 (1913)."
---

# The Millikan oil-drop experiment

## Physical setup

A charged oil drop of radius r between horizontal capacitor plates separated by d,
subject to buoyancy-corrected gravity, Stokes drag, and the electric force qE = qV/d.

## Equations

Field off (terminal fall): $m'g = 6\pi\eta r v_f$, giving
$r = \sqrt{9\eta v_f / (2(\rho_\mathrm{oil}-\rho_\mathrm{air})g)}$. Field on (balance):

$$ qE = m'g \;\Rightarrow\; q = \frac{m'gd}{V}, \qquad m' = \tfrac{4}{3}\pi r^3(\rho_\mathrm{oil}-\rho_\mathrm{air}). $$

Measured charges are integer multiples of $e = 1.602\times10^{-19}$ C.

## Numerical method

Closed-form Stokes and electrostatic force balance; the drop moves at the instantaneous
terminal velocity $v = (qV/d - m'g)/(6\pi\eta r)$ (low Reynolds number), scaled for
on-screen visibility. The drop set is an illustrative UI demo, not measured data; each
drop carries an exact integer charge.

## Controls

- Plate voltage V; field on/off; step to the next drop.

## Expected qualitative features

1. The drop floats when the voltage reaches the balance value.
2. Below balance it falls, above balance it rises.
3. With the field off the drop falls at the Stokes terminal speed.
4. All measured charges fall on integer multiples of e.

## Invariants and acceptance thresholds

- Every measured charge is an integer multiple of e.
- Zero velocity at the balancing voltage.
- The field-off fall speed recovers the radius via Stokes law.

## Citations

Eisberg and Resnick, Quantum Physics, 2nd ed., Ch. 2.
Millikan, Phys. Rev. 2, 109 (1913).
