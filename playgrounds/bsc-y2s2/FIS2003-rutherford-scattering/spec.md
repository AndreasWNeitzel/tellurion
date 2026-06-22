---
title: Rutherford Scattering
slug: rutherford-scattering
status: verified
audience: portfolio
created: 2026-06-22
primary_uc: FIS2003
curriculum_year: bsc-y2s2
primary_citation: krane-nuclear
primary_chapter: 11
hook: "A few alpha particles bounced straight back off a gold foil, and that was enough to put a tiny nucleus at the heart of the atom. Fire a beam and watch the orbits bend."
one_paragraph: "An alpha particle of energy E and impact parameter b is deflected by a nucleus of charge Ze along a hyperbolic Coulomb orbit. The deflection follows cot(theta/2) = 2b/D with D the head-on distance of closest approach: aim near the axis and it back-scatters, pass wide and it barely swerves. Counting the scattered particles gives the differential cross section dsigma/dOmega = (D/4)^2/sin^4(theta/2), the steep 1/sin^4 law whose large-angle tail is the signature of a point nucleus. The playground fires a beam at a range of impact parameters and traces the orbits past the nucleus, marking the head-on closest approach, and plots the cross section on a log axis."
tags: [modern-physics, nuclear, scattering, coulomb, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [E, Z, b]
invariants:
  - key: cot
    label: the deflection obeys cot(theta/2) = 2b/D
    tolerance: 1e-6
  - key: xsec
    label: the cross section is (D/4)^2 / sin^4(theta/2), forward-peaked
    tolerance: 1e-9
  - key: orbit
    label: the integrated Coulomb orbit reproduces the analytic deflection and closest approach
    tolerance: 0.05
what_to_try:
  - Slide the impact parameter toward zero; the highlighted orbit whips around and back-scatters toward 180 degrees.
  - Raise the nuclear charge or lower the energy; the closest-approach circle D grows and every orbit bends harder.
  - Read the cross section: forward-peaked and steeply falling, but the large-angle tail never vanishes.
references:
  - "Krane, Introductory Nuclear Physics, Sec. 11.2 (Rutherford scattering)."
  - "Eisberg and Resnick, Quantum Physics, 2nd ed., Ch. 4."
---

# Rutherford scattering

## Physical setup

Alpha particles of energy E are fired at a nucleus of charge Ze; each is deflected
by the Coulomb repulsion along a hyperbolic orbit set by its impact parameter b.

## Equations

The deflection angle satisfies

$$ \cot\frac{\theta}{2} = \frac{2b}{D}, \qquad D = \frac{1}{4\pi\epsilon_0}\frac{Z z e^2}{E}, $$

with D the head-on distance of closest approach. The differential cross section is

$$ \frac{d\sigma}{d\Omega} = \left(\frac{D}{4}\right)^2 \frac{1}{\sin^4(\theta/2)}. $$

## Numerical method

Orbits are integrated in the repulsive Coulomb field with velocity-Verlet; the
measured asymptotic deflection and closest approach reproduce the analytic
formulae. The cross section is the closed form. No fabricated values.

## Controls

- Alpha energy E, nuclear charge Z, highlighted impact parameter b (in units of D);
  Reset.

## Expected qualitative features

1. Small impact parameter gives large deflection (back-scattering); large b barely
   deflects.
2. A heavier nucleus or slower alpha (larger D) bends every orbit harder.
3. The cross section is forward-peaked with a persistent large-angle tail.

## Invariants and acceptance thresholds

- $\cot(\theta/2) = 2b/D$.
- $d\sigma/d\Omega = (D/4)^2/\sin^4(\theta/2)$.
- The integrated orbit matches the analytic deflection and closest approach.

## Citations

Krane, Introductory Nuclear Physics, Sec. 11.2. Eisberg and Resnick, Quantum
Physics, 2nd ed., Ch. 4.
