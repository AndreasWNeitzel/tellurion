---
title: Group vs Phase Velocity in a Dispersive Medium
slug: group-vs-phase-velocity
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: FIS2016
supporting_ucs: []
curriculum_year: bsc-y2s1
primary_citation: crawford-waves
primary_chapter: 6
hook: 'Add two close frequencies and a fast carrier rides inside a slow-moving envelope; in a dispersive medium the two travel at genuinely different speeds.'
one_paragraph: 'Superpose two waves of nearby frequency and you get a fast oscillation (the carrier, moving at the phase velocity omega/k) modulated by a slow beat envelope (moving at the group velocity d omega / d k). In a non-dispersive medium the two coincide; in a dispersive one they separate, and the envelope, which carries the energy and the information, can move slower or faster than the crests inside it. The playground animates the carrier and envelope as you change the dispersion, so you watch crests slide through the packet. This is why signal speed is the group velocity, not the phase velocity. Reference: Crawford, Waves (Berkeley Physics Course), Ch. 6.'
tags: [waves, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---
# Group vs phase velocity
Two-component superposition; envelope and carrier move at different speeds in dispersive media. Source: Crawford Ch. 6 (`crawford-waves`).

## Explainer

### What you are looking at

Add two waves of slightly different frequency and you get a fast ripple
inside a slow-moving envelope (a beat). The ripple and the envelope can
travel at different speeds. The ripple speed is the phase velocity; the
envelope speed, which carries the energy and the signal, is the group
velocity. In a dispersive medium they differ, and that difference
matters for everything from optical fibers to quantum wave packets.

### The two velocities

A single wave $\cos(kx - \omega t)$ has crests moving at the phase
velocity

$$v_p = \frac{\omega}{k}.$$

Superpose two close components and the envelope they form moves at the
group velocity

$$v_g = \frac{d\omega}{dk}.$$

The relationship between them comes from how $\omega$ depends on $k$,
the dispersion relation $\omega(k)$:

- Non-dispersive medium ($\omega = v k$, constant $v$): $v_g = v_p$,
  the pulse keeps its shape (light in vacuum, sound in air).
- Dispersive medium ($\omega$ curved in $k$): $v_g \ne v_p$, the
  carrier slides through the envelope and the pulse spreads.

### Why the group velocity is the physical one

Energy and information ride the envelope, so it is $v_g$, not $v_p$,
that carries a signal. Phase velocity can even exceed the speed of
light in some media without violating relativity, precisely because no
information travels at $v_p$. The playground shows the carrier slipping
through the envelope and lets you tune the dispersion so $v_p$ and
$v_g$ visibly separate (and reverse).

### Things to try

- Set zero dispersion and watch the carrier and envelope lock together
  ($v_g = v_p$).
- Add dispersion and watch the crests slide forward or backward
  through the slower envelope.
- Note the envelope (the actual signal) always moves at $v_g$,
  whatever the crests do.

### Where this comes from

The phase and group velocity definitions and the dispersive
two-component superposition follow Crawford, *Waves and Oscillations*
(Berkeley Physics Course), Chapter 6.
