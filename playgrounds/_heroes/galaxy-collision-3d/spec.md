---
title: Two-Galaxy Collision (Hero)
slug: galaxy-collision-3d
status: verified
audience: portfolio
created: 2026-05-20
primary_uc: MAA-GD
supporting_ucs: [AST2004]
curriculum_year: hero
primary_citation: toomretoomre1972
primary_chapter: 1
hero_candidate: true
hook: 'Two disk galaxies pass close: the Barnes-Hut quadtree integrates ~2400 stars at 60 fps, the tidal forces pull out the iconic Toomre antennae, and the cores settle into a merger.'
one_paragraph: 'Two disk galaxies, each a heavy core surrounded by 1200 test stars in an exponential rotating disk, are launched on a near-parabolic counter-orbit. Forces are computed by the shared 2D Barnes-Hut quadtree at O(N log N); each frame builds the tree from scratch over the moving ensemble. As the cores swing past each other the prograde-prograde geometry pulls long tidal tails out of each disk: the Toomre antennae. Eventually the cores spiral together and merge, leaving a kinematically scrambled remnant. Reference: Toomre and Toomre, ApJ 178 (1972) 623; Barnes and Hut, Nature 324 (1986) 446.'
caption: 'Figure 1. Two-galaxy fly-by integrated with the shared 2D Barnes-Hut quadtree (~2400 bodies, O(N log N)). The prograde-prograde geometry pulls out the iconic Toomre tidal tails. Method: leapfrog kick-drift-kick, Plummer softening, tree opening angle theta = 0.7. Source: Toomre and Toomre, ApJ 178 (1972) 623.'
tags: [stellar, animation, three-d, live-readout, gravity]
difficulty: 4
tier: single
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [seed, n_disk, separation, velocity]
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

# Galaxy collision
Two-galaxy fly-by via Barnes-Hut quadtree. Source: Toomre and Toomre, ApJ 178 (1972) 623.

## Explainer

### What you are looking at

Two model disk galaxies. Each one is a single heavy central mass (a
proxy for the bulge + dark halo) surrounded by hundreds of test stars
in a thin exponential disk in circular rotation. The galaxies are
launched on a flyby trajectory, and gravity does the rest: the cores
swing past each other, the tidal field stretches each disk into long
"antennae," and eventually the cores spiral together and merge.

The forces between every pair of bodies are not summed directly (that
would be $O(N^2)$ per step). The playground builds a Barnes-Hut
quadtree every step and walks it with opening angle $\theta \approx
0.7$, dropping the cost to $O(N \log N)$. That is what makes it
possible to integrate ~2400 stars at 60 fps in a browser.

### The Toomre antennae

A purely prograde pass (both galaxies spinning the same way, and the
spin axis aligned with the orbital axis) produces the longest tidal
tails. The tidal force on a body in galaxy A from galaxy B's compact
mass is

$$\vec F_{\rm tide} \;\approx\; -\nabla\!\left(-\frac{G M_B}{|\vec r -
  \vec R_B|}\right),$$

which, expanded around the centre of A, stretches the disk along the
B-pointing direction. Particles on the leading edge swing inward;
those on the trailing edge fall off the back of the galaxy. After one
pericentre passage, the result is the famous "antennae" pattern that
Toomre and Toomre 1972 used to argue that real interacting-galaxy
systems are simply the gravitational dynamics of disks under tidal
torques.

### Symbols

- $M_A$, $M_B$: galaxy masses (cores).
- $R_{\rm disk}$: disk scale length.
- $\theta$: Barnes-Hut opening angle (smaller is more accurate, slower).
- $\varepsilon$: Plummer softening (kept small relative to disk scale).

### Things to try

- Start paused, rewind in your head: the two galaxies are heading
  almost straight at each other.
- Watch for first pericentre: the disks stretch and the inner stars
  swirl.
- After the pass: the tails get longer with time, the cores spiral
  in, and finally everything settles into a triaxial blob.

### Where this comes from

The classical "two-galaxy fly-by stretches tidal tails" picture is
Toomre and Toomre, ApJ 178 (1972) 623. The Barnes-Hut tree is from
Barnes and Hut, Nature 324 (1986) 446; the softening and leapfrog
practice follow Springel 2005. The shared engine that
both this playground and the algorithm-demo CC1017 quadtree
playground use lives in `shared/js/engine/quadtree-2d.js`.
