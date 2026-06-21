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
one_paragraph: "Point charges are pinned in a chosen pattern (two +, a + square, or a + triangle) and a movable test charge feels the vector sum of their Coulomb forces. The potential is drawn as equipotential contours over a diverging colour map; a Newton solve locates the force-free balance point. Drag the test charge or the fixed charges and the landscape retraces live; release the test charge near the balance point and it slides off. The catch is Earnshaw's theorem: the electrostatic potential is 3D-harmonic (Vxx + Vyy + Vzz = 0), so the three curvatures at any balance point sum to zero and at least one must be a hill. The diagnostic plots the potential along the two in-plane axes and out of the plane (z), making that always-a-hill structure explicit. That is why a charge cannot be trapped by static fields alone, and why real ion traps use oscillating fields instead."
tags: [electromagnetism, animation, live-readout, interactive]
difficulty: 3
tier: hero
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
  - "Griffiths, Introduction to Electrodynamics, 4th ed., Ch. 2."
---
# Coulomb equilibrium of charges
Fixed point charges (two +, a + square, or a + triangle) generate a 2D field drawn as equipotential contours over a colour map; a test charge can be dragged or released to flow under the Coulomb force, and the force-free balance point is marked. The diagnostic slices the potential along the two in-plane axes and out of the plane to show that the balance point is never a stable trap (Earnshaw). Source: Griffiths, Introduction to Electrodynamics, Ch. 2.

## Controls

- charges: two + / four + (square) / three + (triangle).
- test charge sign: + or -.
- drag any fixed charge or the test charge with the pointer.
- Reset / Pause / Play.

## Numerical method

The balance point is found by a coarse |E| scan refined with Newton's
method on E = 0. The in-plane Hessian of V is taken by finite
differences; the out-of-plane curvature Vzz is taken independently from
the analytic z-cut, and Vxx + Vyy + Vzz is checked to vanish (3D
Laplace). The test charge is integrated by semi-implicit Euler at
dt = 1/240 s. Rendering is plain Canvas2D: a diverging potential map,
equipotential contours (marching squares), the draggable charges, the
balance point with its principal axes, and the released test charge.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| force at center of symmetric quadrupole is zero | < 1e-6 | invariants test |
| force from a single charge matches k q / r^2 | < 1e-6 | invariants test |
| opposite-symmetry cancellation on the bisector | < 1e-10 | invariants test |
| potential at infinity is zero | < 1e-5 | invariants test |
| quadrupole potential at origin equals 4/sqrt(2) | < 1e-6 | invariants test |
| Vxx + Vyy + Vzz = 0 at the balance point (Laplace) | rel < 5e-2 | live readout |

All confirmed in `invariants.test.mjs` (5 tests passing).

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

- Reset to drop the test charge at the balance point: it pauses, then
  slides off along the unstable direction.
- Drag the fixed charges and watch the balance point and the landscape
  relocate.
- Read the diagnostic: the two in-plane slices plus the out-of-plane z
  slice; their curvatures sum to zero, so there is always a hill, hence
  no stable trap.

### Where this comes from

Coulomb's law, superposition, and Earnshaw's theorem follow
Griffiths, *Introduction to Electrodynamics*, Chapters 2 and 3.
