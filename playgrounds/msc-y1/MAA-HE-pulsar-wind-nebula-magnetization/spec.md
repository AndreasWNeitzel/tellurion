---
title: Pulsar Wind Nebula Magnetization
slug: pulsar-wind-nebula-magnetization
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: MAA-HE
supporting_ucs: []
curriculum_year: msc-y1
primary_citation: rybickilightman1979
primary_chapter: 6
hook: 'A young pulsar blows a relativistic wind that slams into its debris, inflating a glowing bubble (the Crab Nebula is the textbook case); whether that wind is mostly particles or mostly field sets where the shock sits.'
one_paragraph: 'The wind magnetization is the ratio of Poynting to kinetic energy flux, sigma = (B^2/4 pi) / (rho c^2 Gamma). The wind coasts until its ram pressure can no longer hold off the nebula and forms a termination shock at radius R_ts ~ sqrt(Edot / (4 pi c p_neb)), set by the spin-down power Edot and the nebular pressure p_neb. A low-sigma (particle-dominated) wind shocks strongly and lights up efficiently, while a high-sigma (magnetically dominated) wind compresses weakly and the shock moves in, the classic sigma problem the Crab poses. The playground shows the radial wind profile, the termination-shock position and the post-shock flow as the magnetization is varied. Reference: Rybicki and Lightman, Radiative Processes in Astrophysics, Chapter 6; Kennel and Coroniti 1984.'
tags: [stellar, fluids-mhd, animation, live-readout]
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
# PWN magnetization
Crab-like nebula: termination shock + magnetization. Source: Kennel-Coroniti 1984; Rybicki-Lightman Ch. 6.

## Explainer

### What you are looking at

A young pulsar blows a relativistic wind that slams into the
surrounding debris, forming a standing shock and inflating a glowing
bubble: the Crab Nebula is the textbook case. Whether that wind is
mostly particles or mostly magnetic field (its "magnetization") sets
where the shock sits and how bright the nebula is. The playground
shows the wind, the termination shock, and the post-shock flow as you
change the magnetization.

### The magnetization parameter

The key dimensionless number is $\sigma$, the ratio of Poynting
(electromagnetic) flux to particle kinetic-energy flux in the wind:

$$\sigma = \frac{B^2/4\pi}{\rho\,c^2\,\Gamma}.$$

A particle-dominated wind has $\sigma\ll1$; a magnetically dominated
wind has $\sigma\gg1$. Observations of the Crab require a surprisingly
low $\sigma\sim10^{-3}$ at the shock (the "sigma problem").

### The termination shock

The cold, highly relativistic wind cannot push the nebula
indefinitely; it decelerates abruptly at a termination shock whose
radius is set by pressure balance between the wind ram pressure and
the nebular pressure,

$$R_\mathrm{ts}
  \sim \sqrt{\frac{\dot E}{4\pi c\,p_\mathrm{neb}}},$$

with $\dot E$ the pulsar spin-down power. At the shock the flow goes
from ultra-relativistic to mildly relativistic, particles are
accelerated into a power-law, and they radiate the synchrotron
emission we see. The Kennel-Coroniti solution shows the shock
compression ratio and the post-shock speed depend strongly on
$\sigma$: a low-$\sigma$ wind gives a strong shock and efficient
particle acceleration, a high-$\sigma$ wind gives a weak shock and a
fast magnetized downstream. The playground sweeps $\sigma$ and the
spin-down power and shows the shock radius and downstream flow
respond.

### Things to try

- Lower $\sigma$ toward the Crab value and watch a strong
  termination shock with efficient deceleration (bright nebula).
- Raise $\sigma$ and watch the shock weaken and the downstream stay
  fast and magnetized.
- Increase the spin-down power and watch the termination shock move
  outward ($R_\mathrm{ts}\propto\sqrt{\dot E}$).

### Where this comes from

The magnetization parameter, the termination shock, and the
post-shock flow follow Kennel and Coroniti, ApJ 283, 694 (1984), and
Rybicki and Lightman, *Radiative Processes in Astrophysics*,
Chapter 6.
