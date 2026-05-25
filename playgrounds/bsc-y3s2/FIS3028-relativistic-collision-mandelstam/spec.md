---
title: Relativistic Collisions and Mandelstam s
slug: relativistic-collision-mandelstam
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: FIS3028
supporting_ucs: []
curriculum_year: bsc-y3s2
primary_citation: griffiths-particles
primary_chapter: 3
hook: 'To make heavy particles you need centre-of-mass energy; a fixed-target machine wastes most of the beam, a collider does not, and the scaling laws differ sharply.'
one_paragraph: 'The Mandelstam variable s is the squared total energy in the centre-of-mass frame, and sqrt(s) is what is actually available to create new particles. The playground contrasts the two ways to collide beams: against a fixed target sqrt(s) grows only as the square root of the beam energy, so doubling the beam barely helps, while in a symmetric collider sqrt(s) grows linearly with beam energy. This single scaling argument is why every modern high-energy machine is a collider, not a fixed-target gun. Reference: Griffiths, Introduction to Elementary Particles, Ch. 3.'
tags: [relativity, animation, live-readout]
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
references:
  - "Griffiths, Introduction to Elementary Particles, Second (revised) ed., Ch. 3."
---
# Mandelstam $s$: fixed-target vs collider
$\sqrt s \propto \sqrt{E_{lab}}$ for fixed targets, but $\propto E_{lab}$ for symmetric colliders. Source: Griffiths Particles Ch. 3.

## Explainer

### What you are looking at

To create heavy new particles you need energy in the centre-of-mass
frame. Fire a beam at a stationary target and most of that energy is
wasted carrying the debris forward; collide two beams head-on and none
is. The playground plots the usable energy versus beam energy for both
setups, and the gap is enormous, which is why every modern machine is a
collider.

### The Mandelstam variable

The relevant quantity is the Mandelstam variable $s$, the squared total
four-momentum. Its square root $\sqrt s$ is the energy available in the
centre of mass, the most massive thing a collision can make. For two
particles of mass $m$:

- Fixed target (beam energy $E_\text{lab}$ onto a particle at rest):

$$s = 2 m^2 c^4 + 2 m c^2 E_\text{lab}
  \;\Longrightarrow\; \sqrt s \;\propto\; \sqrt{E_\text{lab}}.$$

- Symmetric collider (two beams of energy $E_\text{lab}$ head-on):

$$s = 4 E_\text{lab}^2
  \;\Longrightarrow\; \sqrt s = 2 E_\text{lab}
  \;\propto\; E_\text{lab}.$$

### Why the scaling decides everything

Fixed-target $\sqrt s$ grows only as the *square root* of beam energy:
to double the reach you must quadruple the beam, then nine-fold, an
exponentially losing game (most of the lab energy goes into the
forward motion of the centre of mass, momentum conservation, not into
making particles). Collider $\sqrt s$ grows *linearly*: every joule of
beam energy becomes available energy. That single contrast is why the
LHC collides two proton beams instead of hitting a fixed target. The
playground shows the two curves diverging as you raise the beam
energy.

### Things to try

- Slide the beam energy up and watch the collider curve (linear)
  pull far above the fixed-target curve (square-root).
- Read off the energy you would need in a fixed-target machine to
  match a modest collider: it is absurd.
- Note both curves agree only at very low energy, where rest mass
  dominates.

### Where this comes from

The Mandelstam $s$, and the $\sqrt s \propto \sqrt{E_\text{lab}}$
(fixed target) versus $\propto E_\text{lab}$ (collider) scalings follow
Griffiths, *Introduction to Elementary Particles*, Chapter 3.
