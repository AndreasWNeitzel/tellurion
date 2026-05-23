---
title: Gravity in n Spatial Dimensions
slug: gravity-in-n-dimensions-3d
status: verified
audience: portfolio
created: 2026-05-20
primary_uc: AST2004
supporting_ucs: [FIS2021]
curriculum_year: hero
primary_citation: tangherlini1963
primary_chapter: 1
hero_candidate: true
hook: 'Why three space dimensions? Bertrand and Tangherlini showed that only the inverse-square force (d=3) gives closed bound orbits. In d=2, orbits precess. In d=4, the system sits on the edge of stability. In d>4, every bound orbit spirals into the centre.'
one_paragraph: 'The gravitational potential of a point mass in d spatial dimensions goes like 1/r^{d-2} (for d > 2) or log(r) (for d = 2). The force is then F = -k/r^{d-1}. Bertrand showed in 1873 that only two central forces give closed bound orbits, the inverse-square and the harmonic, and Ehrenfest argued in 1917 that the inverse-square law works only in d = 3. The playground integrates a slightly-eccentric orbit under the generalized force and lets you vary d from 2 to 6. At d = 3 the orbit is a closed Kepler ellipse; at d = 2 it traces a precessing rosette; at d = 4 it sits on the edge (any perturbation tips it one way); at d >= 5 the bound orbit decays into the centre within a few revolutions. Reference: Tangherlini, Nuovo Cim. 27 (1963) 636; Ehrenfest 1917; Whitrow 1955.'
caption: 'Figure 1. Orbits of a slightly-eccentric test particle in d spatial dimensions under generalized Newtonian gravity F = -k/r^{d-1}. d = 3 is the closed Kepler ellipse; d = 2 precesses; d = 4 sits at the marginal-stability boundary; d >= 5 spirals into the centre. Method: velocity-Verlet on the central force. Source: Tangherlini, Nuovo Cim. 27 (1963) 636.'
tags: [mechanics, animation, live-readout, gravity, three-d]
difficulty: 3
tier: single
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [dimension, r0, ecc]
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

# Gravity in n dimensions
Bertrand-Ehrenfest stability of orbits. Source: Tangherlini, Nuovo Cim. 27 (1963) 636.

## Explainer

### What you are looking at

A single planet orbits a heavy mass under a generalized Newtonian
force. The number-of-spatial-dimensions slider lets you change $d$
from 2 up to 6. Only $d = 3$ gives the closed Kepler ellipse you
were taught at school. Every other value either precesses, sits on
the edge, or collapses the orbit into the centre. This is the
classical Bertrand/Ehrenfest stability argument for why we live in
three spatial dimensions.

### The generalized force

In $d$ spatial dimensions, Gauss's law says the flux of the
gravitational field through a sphere is proportional to the enclosed
mass and the field falls like the inverse of the surface area of a
$(d-1)$-sphere:

$$|\vec g(r)| \;\propto\; \frac{1}{r^{d-1}}.$$

The corresponding potential is, for $d > 2$,

$$V(r) \;=\; -\frac{k}{(d-2)\,r^{d-2}},$$

and for $d = 2$ the special logarithmic case,

$$V(r) \;=\; k\,\log r.$$

The force on a test mass is $\vec F = -\nabla V$, which in the
playground reads $\vec F = -k\,\vec r/r^{d}$ for $d > 2$ and the
log-derivative $\vec F = -k\,\vec r/r^2$ for $d = 2$.

### Why only d = 3 has closed orbits

Bertrand's theorem (1873) says that of all central forces, only two
give closed bound orbits: the inverse-square law ($d = 3$ gravity) and
the harmonic isotropic force ($\vec F = -k\vec r$). For any other
power law the orbit precesses, and for steep enough exponents it is
unstable to small perturbations.

In particular, the effective radial potential

$$V_{\text{eff}}(r) \;=\; V(r) + \frac{L^2}{2 m r^2}$$

is a barrier that bounces the orbit between two turning radii. For
$d \le 3$ the barrier is shallower than the centrifugal term and the
orbit stays bound and visits all radii between turning points. For
$d \ge 5$ the gravity wins at small $r$ over the centrifugal barrier
and the orbit either spirals into the centre or escapes; $d = 4$ is
the marginal case where the barriers are exactly equal in strength
and the slightest perturbation tips the orbit one way.

### Symbols

- $\vec r$: position relative to the central mass.
- $r = |\vec r|$.
- $k$: coupling constant (set to 1 in code units).
- $d$: number of spatial dimensions.
- $L = m (x \dot y - y \dot x)$: angular momentum about the centre.
- $\varepsilon$: small softening length to keep the central force
  finite at $r = 0$.

### Things to try

- Drag the $d$ slider through $3 \to 4 \to 5$ and watch a Kepler
  ellipse turn into a marginal-stability spiral, then a fast plunge.
- Set $d = 2$ and watch the orbit precess into a rosette with no net
  energy change.
- The angular-momentum readout stays constant for any $d$ (central
  forces conserve $L$); the energy readout is also constant under
  velocity-Verlet for the inverse-power law to numerical drift.

### Where this comes from

The generalized force law in $d$ dimensions is from Tangherlini, Nuovo
Cim. 27 (1963) 636. The closed-orbit theorem is Bertrand 1873. The
"why three dimensions" argument is Ehrenfest, Proc. Amst. Acad. 20
(1917) 200, and Whitrow, Brit. J. Phil. Sci. 6 (1955) 13.
