---
title: The p-n Junction
slug: semiconductor-pn-junction
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Sweep the bias and watch the bands tilt, the depletion layer breathe as sqrt(V_bi - V), and the diode curve switch on exponentially.'
one_paragraph: 'An abrupt p-n junction in the depletion approximation. The built-in potential V_bi = (kT/q) ln(NA ND / ni^2) bends the bands; the depletion width W = sqrt(2 eps (V_bi - V)/q (1/NA + 1/ND)) widens under reverse bias and narrows under forward, while the diode passes the ideal current I = I0 (exp(qV/kT) - 1). The scene shows the band diagram (or the space-charge box and triangular field) beside the live I-V curve with the operating point, and a readout of V_bi, W, current and capacitance. The space charge is exactly balanced (NA x_p = ND x_n) and 1/C^2 is linear in V (Mott-Schottky). The headless sim.js is gate-tested for the ideal-diode law, the built-in potential, the sqrt-V depletion scaling, charge neutrality, the triangular field and its drop, band continuity and the C-V linearity.'
tags: [condensed-matter, semiconductor, device, multi-panel, live-readout]
difficulty: 4
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 6
curriculum_year: 'L:F-3Y-2S'
primary_uc: FIS3005
share_state_keys: []
---

# The p-n Junction

## Physical setup

A step junction with acceptor density `NA` (p side) and donor
density `ND` (n side), applied bias `V` (forward positive), in
silicon at 300 K.

## Governing equations

`V_bi = (kT/q) ln(NA ND / ni^2)`;
`W = sqrt(2 eps (V_bi - V)/q (1/NA + 1/ND))`; charge balance
`NA x_p = ND x_n`; triangular field peak
`E_max = q ND x_n/eps = q NA x_p/eps`; drop
`(1/2) E_max W = V_bi - V`; ideal diode
`I = I0 (exp(qV/kT) - 1)`; capacitance `C = eps/W`,
`1/C^2` linear in `V`.

## Numerical method

Closed-form depletion-approximation expressions; the band potential
is the quadratic integral of the triangular field. Deterministic,
no RNG. Reference: Sze and Ng, Physics of Semiconductor Devices
(3rd ed.), Ch. 2 (`sze-devices`); Kittel, Introduction to Solid
State Physics (8th ed.), Ch. 19 (`kittel-cm`).

## Controls

- bias V: reverse to slight forward.
- log NA, log ND: the two doping levels.
- view: band diagram or space-charge + field.
- Reset.

## Expected qualitative features

- Reverse bias widens the depletion layer and tilts the bands more;
  forward narrows it and the current turns on exponentially.
- The I-V passes through the origin, saturates at `-I0` in reverse.
- The space-charge boxes always balance (`NA x_p = ND x_n`).
- Heavier doping raises `V_bi` and shrinks `W`.

## Invariants and acceptance thresholds

- `I(0) = 0`; `I(4 kT/q) = I0 (e^4 - 1)` (50-56 I0); `I -> -I0`
  in deep reverse.
- `V_bi > 0`, grows with doping; `V_t = kT/q`.
- `W ~ sqrt(V_bi - V)`; reverse widens, forward narrows,
  `W(V_bi) = 0`.
- `NA x_p = ND x_n` (1e-10); net depletion charge zero.
- `E_max` consistent both sides; drop `= (1/2) E_max W = V_bi - V`.
- Bands: gap constant, total bending `q(V_bi - V)`, flat in neutral.
- Mott-Schottky: `1/C^2` linear in `V` with slope
  `-(2/(q eps))(1/NA + 1/ND)`.

## Limiting cases for verification

- `V = 0`: equilibrium, I = 0, flat Fermi level.
- `V -> V_bi`: `W -> 0`, bands flatten.
- Deep reverse: `I -> -I0`, `W` large, `C` small.

## Visual fallback

Static frame: the band diagram (or charge/field) plus the I-V curve
with the operating point at the captured bias.

## Citations

- Sze and Ng, Physics of Semiconductor Devices (3rd ed.), Ch. 2
  (`sze-devices`).
- Kittel, Introduction to Solid State Physics (8th ed.), Ch. 19
  (`kittel-cm`).

## Stretch goals

- High-injection and series-resistance roll-off of the I-V.
- Generation-recombination current (the ideality factor n = 2).

## Risk register

- The depletion approximation fails very near `V_bi`; the width is
  clamped to zero there rather than going imaginary.
- The Fermi-level split is drawn schematically as `qV`; the exact
  quasi-Fermi profile is beyond the depletion approximation.
