---
title: The Drude Model of Conduction
slug: drude-model-conductivity
status: verified
audience: portfolio
created: 2026-06-22
primary_uc: FIS3020
curriculum_year: bsc-y3s2
primary_citation: ashcroft-mermin
primary_chapter: 1
hook: "Ohm's law from random collisions. Electrons rattle off impurities at thermal speed while a field gives them a tiny steady drift, and the current comes out proportional to the field."
one_paragraph: "The Drude model treats conduction electrons as a gas that collides at random with mean time tau, each collision randomizing the velocity. Under a field the steady drift is v_d = -eE tau/m, so the current j = -ne v_d = sigma E obeys Ohm's law with sigma = n e^2 tau/m, and the AC response rolls off as sigma_0/(1 + i omega tau). The playground animates the electron gas (thermal motion plus drift, scattering off impurities), measures the drift and lands it on the Ohm's-law line, and plots the Drude AC rolloff. Units e = m = 1."
tags: [condensed-matter, transport, drude, conductivity, ohms-law, free-electron-gas, interactive, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [E, tau, n]
invariants:
  - key: ohm
    label: the current is linear in the field, j = sigma E
    tolerance: 1e-9
  - key: sigma
    label: the conductivity is proportional to the scattering time
    tolerance: 1e-9
  - key: drift
    label: the simulated drift converges to -E tau
    tolerance: 0.25
what_to_try:
  - Raise E; the field arrows intensify, the average electron drifts faster, and the current climbs in proportion.
  - Raise tau (cleaner metal); the trails lengthen (longer mean free path), drift and conductivity grow, and the AC rolloff knee at 1/tau moves left.
  - Raise the carrier density n; more electrons fill the cloud and the Ohm line tilts steeper (sigma = n tau), while the drift speed v_d is unchanged.
  - Follow the bright average electron: its steady march is the net drift, the current that random thermal motion hides.
references:
  - "Ashcroft and Mermin, Solid State Physics, Holt-Saunders, 1976, Ch. 1."
  - "Kittel, Introduction to Solid State Physics, 8th ed., Ch. 6."
---

# The Drude model of conduction

## Physical setup

Conduction electrons modelled as a classical gas (density n) that scatters at random
with mean free time tau, driven by a uniform electric field E.

## Equations

Between collisions $m\dot v = -eE$; collisions randomize the velocity, so the steady
drift and current are

$$ v_d = -\frac{eE\tau}{m}, \qquad j = -nev_d = \sigma E, \qquad \sigma = \frac{ne^2\tau}{m}, \qquad \sigma(\omega) = \frac{\sigma_0}{1 + i\omega\tau}. $$

Units $e=m=1$, so $\sigma=n\tau$ and $v_d=-E\tau$.

## Numerical method

Each electron accelerates by $-E\,dt$ per step and, with probability $dt/\tau$, has its
velocity reset to a random thermal direction (seeded RNG). The mean drift is measured and
compared with $-E\tau$. The Ohm's-law line and AC rolloff are analytic.

## Controls

- Field E; scattering time tau; play / pause.

## Expected qualitative features

1. A steady drift opposite to E, not runaway acceleration.
2. Current linear in field (Ohm's law); the simulated drift sits on the line.
3. Conductivity proportional to tau.
4. AC conductivity rolls off above omega = 1/tau.

## Invariants and acceptance thresholds

- $j = \sigma E$ (linear).
- $\sigma \propto \tau$.
- The simulated drift converges to $-E\tau$ (to 0.25 in these units).

## Citations

Ashcroft and Mermin, Solid State Physics, Ch. 1.
Kittel, Introduction to Solid State Physics, 8th ed., Ch. 6.
