---
title: Coulomb Equilibrium of Charges
slug: coulomb-equilibrium-charges
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: FIS1014
supporting_ucs: []
curriculum_year: bsc-y1s2
primary_citation: griffiths-em
primary_chapter: 2
hook: "Fix a few electric charges in place and let a test charge loose. It races along the field lines toward the points where all the pushes and pulls cancel. Those balance points exist, but as Earnshaw proved, none is a stable resting place in pure electrostatics."
one_paragraph: "Several point charges are pinned in a chosen pattern (a square, a dipole, a line, a hexagon) and a movable test charge feels the vector sum of their Coulomb forces, F = k q Q / r^2 along each separation. Drag it or release it and it flows along the field lines; at an equilibrium the net field is exactly zero and the charge coasts to a stop. The field lines and a live force and potential readout make the geometry explicit, and a find-equilibrium descent locates the balance points. The catch is Earnshaw's theorem: the electrostatic potential satisfies Laplace's equation and so has no local minimum in free space, which makes every such equilibrium a saddle (stable along some directions, unstable along others). That is why a charge cannot be trapped by static fields alone, and why real ion traps use oscillating fields instead."
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
# Coulomb equilibrium of charges
Four fixed point charges generate a 2D field; the test charge can be dragged or released to flow under the Coulomb force. Equilibria are visible as zero-field locations. Source: Griffiths, Introduction to Electrodynamics, Ch. 2.

## Explainer

### What you are looking at

Drop a test charge into the field of several fixed charges and it is
pushed and pulled until it either settles at a balance point or is
flung away. The playground lets you release the test charge and watch
it flow along the force, revealing where the field cancels, and the
surprising fact that no such balance point is ever truly stable.

### Coulomb's law and superposition

Each fixed charge $q_i$ exerts on a test charge $q$ at position
$\mathbf r$ the Coulomb force

$$\mathbf F_i = \frac{1}{4\pi\varepsilon_0}\,
  \frac{q\,q_i}{|\mathbf r - \mathbf r_i|^2}\,
  \hat{\mathbf r}_{i},$$

and forces simply add (superposition):
$\mathbf F = \sum_i \mathbf F_i = q\,\mathbf E(\mathbf r)$. An
equilibrium is a point where the total field $\mathbf E$ vanishes, so
the net force is zero and the test charge can sit at rest.

### Earnshaw's theorem: why it cannot be stable

You can find points where $\mathbf E = 0$, but they are always
saddle points, never minima of the potential energy. The reason is
fundamental: in charge-free space the electrostatic potential obeys
Laplace's equation

$$\nabla^2\phi = 0,$$

and a harmonic function has no local maximum or minimum in the
interior. So at any equilibrium the potential rises in some
directions and falls in others: stable in one axis, unstable in
another. This is Earnshaw's theorem, and it is why you cannot
levitate a charge with static charges alone (and why atoms are not
little electrostatic solar systems). The playground shows the test
charge balancing momentarily at a null then sliding off along the
unstable direction.

### Things to try

- Release the test charge near a field null and watch it pause, then
  escape along the unstable (saddle) direction.
- Move the fixed charges and watch the null points relocate or merge.
- Confirm no placement gives a truly stable trap (Earnshaw): there is
  always an escape direction.

### Where this comes from

Coulomb's law, superposition, and Earnshaw's theorem follow
Griffiths, *Introduction to Electrodynamics*, Chapters 2 and 3.
