---
title: "Noether's Theorem: Symmetry to Conservation"
slug: noether-symmetry-to-conservation
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: FIS2021
supporting_ucs: []
curriculum_year: bsc-y2s2
primary_citation: lemos-mech
primary_chapter: 4
hook: 'Every continuous symmetry hides a conserved quantity; rotate the potential freely and angular momentum stays fixed, dent it and the conservation leaks away.'
one_paragraph: 'Noether''s theorem links each continuous symmetry of a system to a conserved quantity: rotational symmetry gives conservation of angular momentum. The playground runs a particle in a central potential, where rotating the whole setup changes nothing and L_z stays exactly constant; then it lets you break the rotational symmetry with an angular term in the potential and watch L_z drift in step with how strongly the symmetry is violated. It makes the deepest theorem in classical mechanics something you can switch on and off. Reference: Lemos, Analytical Mechanics, Ch. 4.'
tags: [mechanics, animation, live-readout]
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
# Noether's theorem
Rotation symmetry of a central potential preserves $L_z$; breaking the symmetry makes $L_z$ drift. Source: Lemos Ch. 4.

## Explainer

### What you are looking at

Every conservation law in physics is the shadow of a symmetry. That
is Noether's theorem, the deepest single idea in classical mechanics.
The playground makes it tangible: an orbit in a rotationally symmetric
potential conserves angular momentum exactly; deliberately break the
symmetry and watch the conserved quantity start to drift.

### Noether's theorem

If the Lagrangian $L(q,\dot q,t)$ is unchanged by a continuous
transformation $q\to q+\epsilon\,\delta q$, then the quantity

$$Q = \frac{\partial L}{\partial \dot q}\,\delta q$$

is conserved along the motion. The familiar conservation laws are all
instances:

- Invariance under time translation gives conservation of energy.
- Invariance under spatial translation gives conservation of linear
  momentum.
- Invariance under rotation gives conservation of angular momentum.

### The demonstration

The playground evolves a particle in a central potential
$V(r)$. Because $V$ depends only on $r$, the Lagrangian is invariant
under rotation about the centre ($\theta\to\theta+\epsilon$), so
Noether's theorem guarantees the angular momentum

$$L_z = \frac{\partial L}{\partial\dot\theta}
  = m r^2\dot\theta$$

is exactly conserved: the readout stays flat to machine precision
even as the orbit precesses. Now add a non-axisymmetric perturbation
(a bar or a $\cos 2\theta$ term): the rotation is no longer a
symmetry, the premise of the theorem fails, and $L_z$ visibly drifts,
its rate of change equal to the applied torque
$\dot L_z=-\partial V/\partial\theta$. Conservation was never a
coincidence; it was the symmetry, and removing the symmetry removes
the law. This is exactly why physicists hunt for symmetries first.

### Things to try

- Run the symmetric central potential and watch $L_z$ stay flat
  while the orbit itself moves (the conserved quantity is hidden in
  the motion).
- Switch on a bar/non-axisymmetric term and watch $L_z$ start to
  drift (symmetry broken, law gone).
- Note energy stays conserved as long as the potential is
  time-independent (time-translation symmetry), independently of the
  angular case.

### Where this comes from

Noether's theorem and the symmetry-conservation correspondence follow
Lemos, *Analytical Mechanics*, Chapter 4, and Goldstein, *Classical
Mechanics*, Chapter 13.
