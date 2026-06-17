---
title: The p-n Junction
slug: semiconductor-pn-junction
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Sweep the bias and watch the bands tilt, the depletion layer breathe as sqrt(V_bi - V), and the diode curve switch on exponentially.'
one_paragraph: 'An abrupt p-n junction in the depletion approximation. The built-in potential V_bi = (kT/q) ln(NA ND / ni^2) bends the bands; the depletion width W = sqrt(2 eps (V_bi - V)/q (1/NA + 1/ND)) widens under reverse bias and narrows under forward, while the diode passes the ideal current I = I0 (exp(qV/kT) - 1). The scene shows the band diagram (or the space-charge region and its triangular electric field) beside the I-V curve with the operating point, and a readout of V_bi, W, current and capacitance. The space charge is exactly balanced (NA x_p = ND x_n), and because W follows sqrt(V_bi - V) the junction acts as a voltage-controlled capacitor with 1/C^2 linear in V, the Mott-Schottky relation used to measure doping. Reference: Sze and Ng, Physics of Semiconductor Devices, Chapter 2; Neamen, Semiconductor Physics and Devices, Chapters 7 to 8.'
tags: [condensed-matter, semiconductor, device, multi-panel, live-readout]
difficulty: 4
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 6
curriculum_year: 'L:F-3Y-2S'
primary_uc: FIS3005
primary_citation: sze-devices
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
  - "Krane, Introductory Nuclear Physics."
---

# The p-n Junction

## Explainer

### What you are looking at

Join p-type and n-type silicon and something remarkable happens at the
seam: carriers diffuse across, leave behind charged dopant ions, and
build a self-limiting electric field. That depletion region and its
one-way conduction are the diode, the foundational device of all
electronics. The playground lets you set doping and bias and watch the
band bending, depletion width, and I-V curve respond.

### The built-in potential

Electrons flood from n to p and holes the other way until diffusion is
balanced by the field of the exposed ions. The equilibrium step in
potential is

$$V_\text{bi} = \frac{kT}{q}\ln\!\frac{N_A N_D}{n_i^2},$$

set by the doping levels $N_A, N_D$ and the intrinsic carrier density
$n_i$.

### Depletion region

Solving Poisson's equation across the junction (depletion
approximation: fully ionized, carrier-free) gives a depletion width

$$W = \sqrt{\frac{2\varepsilon\,(V_\text{bi}-V)}{q}
  \left(\frac{1}{N_A}+\frac{1}{N_D}\right)},$$

a triangular field peaking at $E_\text{max}=qN_D x_n/\varepsilon$, and
a junction capacitance $C = \varepsilon/W$. Forward bias $V>0$ shrinks
$W$; reverse bias widens it.

### One-way current

Lowering the barrier by forward bias lets diffusion current flood
across exponentially; reverse bias chokes it to a tiny saturation
leak. That is the ideal diode law

$$I = I_0\big(e^{qV/kT} - 1\big),$$

current that grows exponentially one way and clamps the other, the
rectification every power supply and logic gate relies on. The
playground sweeps doping and bias and shows the depletion width, field,
band bending, and the exponential I-V together.

### Things to try

- Increase the doping and watch $V_\text{bi}$ rise (logarithmically)
  and the depletion width shrink.
- Reverse-bias and watch $W$ widen and the capacitance fall ($C \propto
  1/W$): the varactor effect.
- Forward-bias past $\sim V_\text{bi}$ and watch the current turn on
  exponentially.

### Where this comes from

The built-in potential, depletion-approximation width and field, and
the ideal-diode equation follow Sze and Ng, *Physics of Semiconductor
Devices*, and Neamen, *Semiconductor Physics and Devices*.

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
(3rd ed.), Ch. 2; Kittel, Introduction to Solid
State Physics (8th ed.), Ch. 19.

## Controls

- bias V: reverse to slight forward.
- log NA, log ND: the two doping levels.
- view: selects the left panel (band diagram or space-charge +
  field); the right panel is always the interactive device.
- Reset.

## Expected qualitative features

- The right panel is a device schematic, not a static plot: a p / n
  bar with mobile holes and electrons in the neutral regions, the
  fixed ionized dopant cores, and the depletion layer of exposed
  space charge in the middle. Its width and its asymmetric split
  (deeper into the lighter-doped side) follow the depletion
  approximation, so every slider visibly moves it.
- The battery polarity and the cross-junction carrier-flow arrows
  follow the bias: forward lowers the barrier and drives diffusion
  current, reverse widens the layer with only tiny drift.
- A compact I-V inset keeps the diode law and the operating point;
  it passes through the origin and saturates at `-I0` in reverse.
- Reverse bias widens the depletion layer and tilts the bands more;
  forward narrows it and the current turns on exponentially.
- The space charge always balances (`NA x_p = ND x_n`); heavier
  doping raises `V_bi` and shrinks `W`.

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
 .
- Kittel, Introduction to Solid State Physics (8th ed.), Ch. 19
 .

## Stretch goals

- High-injection and series-resistance roll-off of the I-V.
- Generation-recombination current (the ideality factor n = 2).

## Risk register

- The depletion approximation fails very near `V_bi`; the width is
  clamped to zero there rather than going imaginary.
- The Fermi-level split is drawn schematically as `qV`; the exact
  quasi-Fermi profile is beyond the depletion approximation.
