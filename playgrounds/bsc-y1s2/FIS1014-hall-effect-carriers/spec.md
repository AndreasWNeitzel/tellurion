---
title: The Hall Effect and the Sign of the Carriers
slug: hall-effect-carriers
status: verified
audience: portfolio
created: 2026-06-22
primary_uc: FIS1014
curriculum_year: bsc-y1s2
primary_citation: ashcroft-mermin
primary_chapter: 1
hook: "A current in a magnetic field grows a sideways voltage. Its sign tells you whether the carriers are positive or negative, even though both deflect to the same edge."
one_paragraph: "A current I along a bar of thickness t in a transverse field B feels the Lorentz force q v x B, which pushes the carriers to one edge until the Hall field they build cancels the magnetic force; the bar is left holding the Hall voltage V_H = I B / (n q t). The magnitude measures the carrier density n and the sign reveals the carrier sign: positive and negative carriers deflect to the same edge (flipping the charge also flips the drift), but the charge they deposit, and so the polarity of V_H, is opposite. The playground animates the deflection and the edge-charge buildup, wires a voltmeter across the edges, and plots V_H against B for both carrier signs."
tags: [electromagnetism, hall-effect, lorentz-force, solid-state, animation, live-readout]
difficulty: 2
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [carrier, B]
invariants:
  - key: formula
    label: V_H = I B / (n q t), linear in B and I, inverse in n and t
    tolerance: 1e-10
  - key: sign
    label: the sign of V_H tracks the carrier sign and the field direction
    tolerance: 0.0
  - key: balance
    label: in steady state the Hall field cancels the magnetic force (V_H = E_H times width)
    tolerance: 1e-12
what_to_try:
  - Toggle holes and electrons; the carriers deflect to the same edge but the edge charges and the voltmeter sign reverse.
  - Sweep B through zero; the deflection, the edge charge, and V_H all flip and ride the straight line in the panel.
  - Raise the current to deflect harder and grow V_H; raise the carrier density and V_H shrinks.
references:
  - "Ashcroft and Mermin, Solid State Physics, Ch. 1 (the Hall effect and the sign of the carriers)."
  - "Griffiths, Introduction to Electrodynamics, 4th ed., Ex. 5.2."
---

# The Hall effect and the sign of the carriers

## Physical setup

A current I flows along a conducting bar of thickness t and width w in a magnetic
field B applied across the current. The mobile carriers, density n and signed
charge q, drift to carry the current.

## Equations

The Lorentz force $q\mathbf{v}\times\mathbf{B}$ deflects the carriers to one edge
until the transverse Hall field cancels it, $E_H = v_d B$. The accumulated charge
holds a transverse Hall voltage

$$ V_H = \frac{I B}{n q t}, $$

with the Hall coefficient $R_H = 1/(nq)$ carrying the carrier sign. Positive and
negative carriers deflect to the same edge, but deposit opposite charge, so the
polarity of $V_H$ reveals the carrier sign.

## Numerical method

No engine. The Hall voltage is the closed form above. The animation gives each
carrier a longitudinal drift plus a transverse velocity equal to the uncancelled
transverse force; an overdamped relaxation grows the Hall field to $v_d B$, after
which the carriers drift straight. The bulk stays uniform (only the thin edge
charge accumulates).

## Controls

- Carrier sign (holes or electrons), field B, current I, carrier density n; Reset.

## Expected qualitative features

1. Carriers deflect to one edge and the edge charge builds until the carriers
   drift straight again.
2. Holes and electrons deflect to the same edge but give opposite-sign V_H.
3. V_H is linear in B and I, and reverses when B reverses.

## Invariants and acceptance thresholds

- $V_H = I B/(n q t)$.
- $\mathrm{sign}(V_H)$ tracks the carrier sign and field direction.
- Steady state: $V_H$ equals the Hall field times the bar width.

## Citations

Ashcroft and Mermin, Solid State Physics, Ch. 1. Griffiths, Introduction to
Electrodynamics, 4th ed., Ex. 5.2.
