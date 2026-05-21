---
title: Billiards - Circle, Stadium, Sinai
slug: billiards-circle-stadium-sinai
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2021
supporting_ucs: []
curriculum_year: bsc-y2s2
hook: 'A ball bouncing in a circle traces neat rosettes forever; round the ends into a stadium and the same ball fills the table chaotically.'
one_paragraph: 'A billiard is a free particle reflecting specularly off the walls of a region; whether its motion is orderly or chaotic depends only on the shape. The circle is integrable, so trajectories stay on tidy caustic patterns; the Bunimovich stadium (two semicircles joined by straight walls) and the Sinai billiard (a box with a central disk) are provably chaotic, with nearby trajectories diverging exponentially. The playground lets you switch geometry and watch one trajectory plus its sensitivity to a tiny change in launch angle. This is the purely geometric route to chaos and the classical backdrop of quantum chaos. Reference: Tabachnikov, Geometry and Billiards.'
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

# Billiards: circle, stadium, Sinai

## Explainer

### What you are looking at

Take the simplest possible dynamical system, a ball bouncing
elastically inside a 2D box, and the only thing you change is the
shape of the box. Yet that geometry alone decides whether the motion
is perfectly regular or fully chaotic. The playground runs the same
billiard in three boundaries so you watch order become chaos with no
forces involved.

### The equation of motion

Between collisions the particle is free,

$$\boxed{\;\ddot{\vec r}(t) = 0,\qquad
  \vec r(t) = \vec r_0 + \vec v\,t,\;}$$

so its energy and direction are constant. When the trajectory hits a
boundary at point $\vec p$ with inward-pointing unit normal $\hat n$,
the reflection is specular,

$$\vec v_{\rm out} = \vec v_{\rm in} - 2\,(\vec v_{\rm in}\cdot \hat n)\,\hat n,$$

which preserves $|\vec v|$ and reverses the normal component while
keeping the tangential component. Energy is conserved exactly (the
playground tracks $\Delta E$ as a live invariant); the only thing
that varies from bounce to bounce is the direction.

### Where order comes from: the circle's hidden integral

For a circular table of radius $R$, the angle $\alpha$ between the
trajectory and the inward normal at the wall is conserved at every
bounce (by symmetry of the circle). That means each orbit lies on a
"caustic" ring of radius

$$r_{\rm caustic} = R\,\cos\alpha,$$

inside which the trajectory never penetrates. With this conserved
quantity ($p_\phi$, the angular momentum about the centre) added to
the conserved energy, the circle is a *completely integrable*
two-degree-of-freedom system in the sense of Liouville (two
independent integrals of motion, equal to the number of degrees of
freedom). All orbits are quasi-periodic; nearby trajectories stay
nearby forever (zero Lyapunov exponent).

### Where chaos comes from: defocusing and dispersing walls

A pencil of parallel rays incident on a curved wall is *focused*
(brought together) or *defocused* (spread apart). The local rule
(Sinai 1970, Bunimovich 1979) is:

- A wall that is concave toward the particle (curvature centre
  outside the table) focuses, then can either help or hurt; if the
  geometry is set up so that focal points lie inside the table the
  motion still has chaos.
- A wall that is convex toward the particle (curvature centre inside
  the table) is dispersing: every parallel beam gets fanned out.
  Sinai proved this gives hyperbolic behaviour on every bounce.

The Lyapunov exponent quantifies the spreading. Two trajectories
that start a separation $d_0$ apart diverge as

$$d(t) \sim d_0\,e^{\lambda_L t},$$

with $\lambda_L > 0$ in the stadium and Sinai (about $0.4$ in
appropriate units) and $\lambda_L = 0$ in the circle. The exponent
$\lambda_L$ is the inverse of the time over which two nearby
trajectories smear out of focus by an e-fold.

### Same physics, three boundaries

- *Circle* ($x^2 + y^2 = R^2$): integrable. Star patterns; the
  forbidden inner caustic at $r = R\cos\alpha$ is visible.
- *Bunimovich stadium* (two semicircles joined by straight walls):
  the straight-segment defocusing wins. Fully chaotic and ergodic.
- *Sinai billiard* (square table with a convex central scatterer):
  the inner disc disperses every incoming beam. Fully chaotic.

### Symbols, at a glance

- $\vec r$, $\vec v$, particle position and velocity.
- $\hat n$, inward unit normal to the wall at the bounce point.
- $\alpha$, angle between the trajectory and the wall normal.
- $R$, table radius (circle), or semicircle radius (stadium), or
  outer half-width (Sinai); $r_{\rm scat}$, inner-scatterer radius
  in the Sinai geometry.
- $\lambda_L$, Lyapunov exponent (s$^{-1}$).
- $p_\phi$, angular momentum about the symmetry axis (conserved in
  the circle).

### Why it matters

These are the textbook proof that chaos needs no nonlinearity in the
force law: a constant-speed free particle plus a boundary is enough.
The contrast (a conserved second integral in the circle versus its
destruction by curvature in the stadium/Sinai) is the cleanest
illustration of the difference between integrable and ergodic
Hamiltonian systems, and the quantum versions seed quantum-chaos and
the random-matrix conjecture (Berry, Tabor 1977; Bohigas, Giannoni,
Schmit 1984). The playground traces a trajectory and a fan of nearby
ones so the regular-vs-exponential spreading is directly visible.

### Things to try

- Run the circle and watch a trajectory weave a clean star pattern
  with the forbidden inner caustic $r = R\cos\alpha$.
- Switch to the stadium or Sinai and watch a tight bundle of starts
  smear over the whole table within a few bounces (exponential
  sensitivity).
- Nudge the start slightly: negligible drift in the circle, total
  divergence in the chaotic tables. This is the operational
  definition of chaos.

### Bibliographic origin

The Bunimovich stadium and its proof of ergodicity is Bunimovich,
*Comm. Math. Phys.* **65** (1979) 295. The Sinai dispersing
billiard is Sinai, *Russ. Math. Surv.* **25** (1970) 137 (the
work that gave hyperbolic dynamics its modern foundation). A
textbook is Tabachnikov, *Geometry and Billiards* (AMS 2005),
Ch. 1, 5. The quantum chaos and random-matrix connection is
Bohigas, Giannoni and Schmit, *Phys. Rev. Lett.* **52** (1984)
1; an accessible review is Berry, "Regularity and chaos in
classical mechanics, illustrated by three deformations of a
circular billiard", *Eur. J. Phys.* **2** (1981) 91.

## Physical setup

A free particle of unit speed bouncing elastically off the walls of a 2D shape. Three classical geometries: circle (integrable), Bunimovich stadium (chaotic), Sinai billiard (chaotic with convex scatterer). Used to study quantum-classical correspondence and the onset of chaos under purely geometric constraints.

## Governing equations

Equation of motion: free straight-line motion between walls, specular reflection at each contact: v -> v - 2 (v . n) n with n the inward-pointing unit normal.

Boundaries:
  circle:  x^2 + y^2 = 1.
  stadium: |x| <= L = 1, |y| <= 1, plus two semicircles of radius 1 capping each end.
  sinai:   |x| <= 1 and |y| <= 1, with an inner circle of radius R = 0.4 cut out.

## Numerical method

Ray-trace each step: find the smallest positive t at which the particle hits a boundary segment, advance to that point, reflect. No time-stepping; bounces are exact analytic intersections.

## Controls

- geometry: circle, stadium (default), sinai
- speed: bounces per render frame, 1 - 20, default 6
- Reset: re-initialize from canonical IC
- Pause / Play

## Expected qualitative features

1. Circle: trajectory traces a closed caustic (an inner circle of unvisited region); never fills the disc.
2. Stadium: trajectory rapidly fills the entire region; trail looks "random".
3. Sinai: also fills the region; the inner disc carves visible scattering events.

## Invariants and acceptance thresholds

- Speed |v| = 1 exactly across 500 bounces (< 1e-10 deviation).
- Position on boundary at each bounce, within < 1e-9.
- Circle: angle-of-incidence relative to outward radial invariant across 50 bounces (< 1e-6).
- Stadium: bounce-velocity angles span > 2 rad over 200 bounces.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- Circle: integrable; even for any IC, angle relative to radial is conserved.
- Sinai R = 0: no scatterer; reduces to a square (still integrable as a separable rectangle).
- Stadium L = 0: reduces to a circle (integrable).

## Visual fallback

Canvas2D only.

## Citations

- Berry 1981, Eur. J. Phys. 2, 91 (`berry1981`).
- Tabachnikov 2005, Geometry and Billiards (American Mathematical Society).
- Bunimovich 1979 (Stadium); Sinai 1970 (Sinai billiard).

## Stretch goals

- Add a Poincare section (perimeter coordinate vs angle of incidence) for each geometry.
- Add a near-trajectory cloud to visualize Lyapunov divergence for the chaotic cases.
- Add a "color by bounce count" overlay.

## Risk register

- Numerical sliver bounces: very nearly tangential trajectories can produce sub-1e-9 t values that the next step misses. The current `t > 1e-9` cutoff is safe for all standard ICs but a very pathological IC could regress.
- The trail accumulates up to 1500 points; longer runs look like noise rather than the underlying geometry. The "Reset" button starts a fresh trail.
