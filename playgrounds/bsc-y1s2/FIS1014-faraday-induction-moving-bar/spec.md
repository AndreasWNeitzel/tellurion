---
title: Faraday Induction on a Sliding Bar
slug: faraday-induction-moving-bar
status: draft
audience: portfolio
created: 2026-06-21
primary_uc: FIS1014
supporting_ucs: []
curriculum_year: bsc-y1s2
primary_citation: griffithsem2017
primary_chapter: 7
hook: "Slide a bar along rails through a magnetic field and a current appears from nothing. Faraday's law turns the growing flux into an EMF, and Lenz's law makes the induced force fight the motion until the bar coasts at a terminal speed."
one_paragraph: "A conducting bar of length L slides on two rails of separation L in a uniform field B into the page, the loop closed by a resistance R. The swept flux Phi = B L x grows with the bar position, so Faraday's law gives a motional EMF e = -dPhi/dt = -B L v, a current I = e/R, and a Lenz force F = B^2 L^2 v / R that opposes the motion. Under a steady applied force the bar obeys m dv/dt = F_app - B^2 L^2 v / R and rises to the terminal velocity v_t = F_app R / (B^2 L^2). The playground shows the rail loop with the field into the page, the growing flux region, the induced current and the opposing Lenz force, and a velocity diagram climbing to the terminal line, where the supplied power F_app v_t equals the Ohmic heat I^2 R. This is the principle behind electromagnetic braking, the generator, and eddy-current damping."
tags: [electromagnetism, induction, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: [B, L, R, F]
invariants:
  - key: faraday
    label: EMF equals B L v (Faraday's law)
    tolerance: 1e-9
  - key: energy
    label: input power minus dissipation equals the kinetic-energy rate
    tolerance: 0.01
  - key: terminal
    label: at terminal velocity the input power equals the Ohmic dissipation
    tolerance: 0.05
what_to_try:
  - Raise B and the bar settles at a much lower terminal velocity (it scales as 1/B^2).
  - Raise R and the drag weakens, so the bar runs faster toward v_t = F_app R / (B^2 L^2).
  - Watch the velocity flatten onto the terminal line and the two power readouts converge.
references:
  - "Griffiths, Introduction to Electrodynamics, Fifth ed., Sec. 7.1-7.2."
  - "Young and Freedman, University Physics, 14e, Ch. 29."
---

# Faraday induction on a sliding bar

## Physical setup

A conducting bar of length $L$ slides without friction on two parallel rails of
separation $L$, lying in a uniform magnetic field $B$ directed into the page.
The rails are joined at one end by a resistance $R$, so bar, rails and resistor
form a closed loop. The bar is at position $x(t)$ with velocity $v = \dot{x}$.

## Equations

The flux threading the loop is $\Phi = B L x$ (field times swept area). Faraday's
law gives the motional EMF

$$\mathcal{E} = -\frac{d\Phi}{dt} = -B L v,$$

which drives a current $I = \mathcal{E}/R = B L v / R$. That current in the field
experiences a Lorentz force $F = I L B$ whose direction, by Lenz's law, opposes
the change that produced it:

$$F_{\text{mag}} = -\frac{B^2 L^2}{R}\, v.$$

Under a constant applied force $F_{\text{app}}$ the equation of motion is

$$m\,\dot{v} = F_{\text{app}} - \frac{B^2 L^2}{R}\, v,$$

a linear-drag relaxation toward the terminal velocity

$$v_t = \frac{F_{\text{app}} R}{B^2 L^2}, \qquad \tau = \frac{m R}{B^2 L^2}.$$

Energy is conserved: $F_{\text{app}} v = I^2 R + \tfrac{d}{dt}(\tfrac12 m v^2)$, so
at terminal velocity the mechanical input power equals the Ohmic dissipation.

## Numerical method

Closed form; no engine. The single linear-drag ODE is advanced with a
semi-implicit (backward-Euler on the drag term) step,
$v_{n+1} = (v_n + F_{\text{app}}\,dt/m)\,/\,(1 + k\,dt/m)$ with
$k = B^2 L^2 / R$, which is unconditionally stable and reproduces the exact
exponential approach to $v_t$.

## Controls

- Field $B$ (0.2 to 2 T), rail separation $L$ (0.4 to 1.6 m), resistance $R$
  (0.5 to 6 Ohm), applied force $F_{\text{app}}$ (0.1 to 2.5 N). Mass fixed at
  1 kg. Reset and Pause.

## Expected qualitative features

1. The induced current grows with the bar's speed; the Lenz force always points
   opposite the velocity.
2. The bar relaxes to $v_t = F_{\text{app}} R / (B^2 L^2)$, lower for stronger
   $B$ or $L$ and higher for larger $R$ or $F_{\text{app}}$.
3. At terminal velocity the supplied power $F_{\text{app}} v_t$ equals the heat
   $I^2 R$; during the transient the surplus becomes kinetic energy.

## Invariants and acceptance thresholds

- $\mathcal{E} = B L v$ exactly.
- After many time constants, $v \to v_t = F_{\text{app}} R / (B^2 L^2)$ within
  $10^{-4}$.
- With $F_{\text{app}} = 0$ and an initial push the bar coasts to rest.
- Input minus dissipated power equals $d(\tfrac12 m v^2)/dt$ along the transient.

## Citations

Griffiths, Introduction to Electrodynamics, 5th ed., Sec. 7.1-7.2 (motional EMF,
Lenz's law). Young and Freedman, University Physics, 14th ed., Ch. 29.
