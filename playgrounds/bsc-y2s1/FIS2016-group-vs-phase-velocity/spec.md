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
hook: 'A wave packet has a fast carrier that rides inside a slow-moving envelope; in a dispersive medium the two travel at genuinely different speeds and the packet spreads as it goes.'
one_paragraph: 'A localized wave packet is a band of wavenumbers added together: psi(x,t) = sum A(k) cos(k x - omega(k) t). Its carrier crests move at the phase velocity omega/k0 and its envelope at the group velocity d omega / d k. In a non-dispersive medium the two coincide and the packet keeps its shape; in a dispersive one they separate, crests are born at one edge of the packet and die at the other, and because the components travel at different phase speeds the packet spreads over time, which a pure two-tone beat can never show. The playground animates the real packet as you change the dispersion, with a companion dispersion curve omega(k) where the phase velocity is the slope of the chord from the origin and the group velocity is the slope of the tangent at k0. This is why signal and energy travel at the group velocity, not the phase velocity. Reference: Crawford, Waves (Berkeley Physics Course), Ch. 6.'
tags: [waves, animation, live-readout]
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
  - Deep water: crests race forward through the packet (v_p > v_g); Schrödinger: the packet outruns the crests (v_g > v_p).
  - Light: chord and tangent coincide, v_p = v_g, no crest drift and no spreading.
  - Anomalous branch: the tangent slopes down, v_g is negative, so crests and packet move opposite ways.
  - Widen the bandwidth and the packet shortens and spreads faster.
references:
  - "Crawford, Waves (Berkeley Physics Course Vol. 3), Ch. 6."
---
# Group vs phase velocity
Two-component superposition; envelope and carrier move at different speeds in dispersive media. Source: Crawford Ch. 6.

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
