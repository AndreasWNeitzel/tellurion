---
title: Larmor Radiation Pattern
slug: larmor-radiation-pattern
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: FIS2013
supporting_ucs: []
curriculum_year: bsc-y2s1
primary_citation: griffiths-em
primary_chapter: 11
hook: 'An accelerating charge radiates, but not the same in every direction: nothing leaves along the acceleration, everything peaks broadside, in a clean doughnut.'
one_paragraph: 'A non-relativistic charge that accelerates emits radiation with an angular pattern proportional to sin^2(theta), where theta is measured from the acceleration vector: zero straight ahead and behind, maximum at right angles, the familiar doughnut. The total radiated power is the Larmor formula, proportional to the square of the acceleration. The playground draws the polar radiation pattern and reports the total power as you change the acceleration, making concrete why dipole antennas are shaped the way they are and why an orbiting electron must lose energy. Reference: Griffiths, Introduction to Electrodynamics, Ch. 11.'
tags: [electromagnetism, animation, live-readout]
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
# Larmor radiation pattern
Non-relativistic accelerating charge radiates with the $\sin^2\theta$ angular distribution; total power follows the Larmor formula. Source: Griffiths E&M Ch. 11.

## Explainer

### What you are looking at

An electric charge moving at constant velocity does not radiate. The
instant you accelerate it, it throws off electromagnetic waves, and not
equally in all directions: nothing goes straight along the
acceleration, and the most goes sideways. The playground draws this
doughnut-shaped radiation pattern and the total power. It is why
antennas, X-ray tubes, and synchrotrons work.

### The angular pattern

For a non-relativistic charge with acceleration $\mathbf a$, the power
radiated per unit solid angle is

$$\frac{dP}{d\Omega} = \frac{q^2 a^2}{16\pi^2\epsilon_0 c^3}\,
  \sin^2\theta,$$

where $\theta$ is measured from the acceleration direction. The
$\sin^2\theta$ is the whole story: zero along the axis
($\theta = 0,\pi$), maximum broadside ($\theta = \pi/2$), giving the
familiar two-lobed (toroidal) pattern. A dipole antenna radiates
exactly this shape.

### Total power: the Larmor formula

Integrate $\sin^2\theta$ over all directions ($\int\sin^2\theta\,
d\Omega = 8\pi/3$) and you get the total radiated power, the Larmor
formula:

$$P = \frac{q^2 a^2}{6\pi\epsilon_0 c^3}.$$

It scales as acceleration squared, so hard kicks radiate
disproportionately. This single result explains why a classical
electron spiralling into a nucleus would radiate away its energy in
$\sim 10^{-11}$ s, the catastrophe that forced quantum mechanics, and
why bending a relativistic beam in a synchrotron produces intense
light.

### Things to try

- Rotate the acceleration vector and watch the two-lobed pattern
  swing with it, always nulling along the axis.
- Increase the acceleration and watch the total power grow as its
  square (Larmor).
- Note the pattern is fore-aft symmetric here; the relativistic
  version beams it sharply forward instead.

### Where this comes from

The $\sin^2\theta$ angular distribution and the Larmor total-power
formula follow Griffiths, *Introduction to Electrodynamics*, 5th ed.,
Chapter 11.
