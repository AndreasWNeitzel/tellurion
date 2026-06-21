---
title: Quadtree N-body and the Barnes-Hut Approximation
slug: quadtree-nbody-2d
status: verified
audience: portfolio
created: 2026-05-20
primary_uc: CC1017
supporting_ucs: []
curriculum_year: bsc-y1s1
primary_citation: barnes-hut1986
primary_chapter: 1
hook: 'Doing the force sum for every pair of N bodies is O(N squared) and crushes a laptop at N ~ 10^4; the Barnes-Hut quadtree groups distant clusters into single centres of mass and drops it to O(N log N), watching the tree itself adapt to the moving particles.'
one_paragraph: 'Direct gravity is a sum over every pair, which means N(N-1)/2 evaluations per step. Past about a thousand particles a browser can no longer animate it in real time. The Barnes-Hut quadtree fixes this by recursively partitioning space into squares, then treating any cell that subtends a small angle from a target body as a single point at its centre of mass. The playground simulates a galactic disk of test particles, draws the live quadtree boxes that adapt to the moving distribution each step, and lets you toggle direct O(N^2) versus tree O(N log N) to watch the per-step evaluation count drop by orders of magnitude. Reference: Barnes and Hut, Nature 324 (1986) 446.'
tags: [algorithms, animation, live-readout]
difficulty: 2
tier: featured
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [n_bodies, theta, use_tree, show_tree]
invariants:
  - key: bherr
    label: tree force error vs exact (rel. L2)
    tolerance: 0.05
  - key: bh_bound
    label: evals per step <= direct N(N-1)
    tolerance: 1e-9
  - key: softening
    label: Plummer softening epsilon > 0
    tolerance: 1e-9
what_to_try:
  - Switch the algorithm to direct O(N^2) and watch evals per step jump.
  - Raise the opening angle theta so the tree approximates more aggressively.
  - Push N toward 1200 and compare the Barnes-Hut speedup against direct summation.
references:
  - "Barnes and Hut, A hierarchical O(N log N) force-calculation algorithm, Nature 324 (1986) 446."
  - "Aarseth, Gravitational N-Body Simulations, Cambridge University Press, 2003."
---
# Quadtree N-body
2D galactic disk under gravity; live Barnes-Hut tree. Source: Barnes and Hut, Nature 324 (1986) 446.

## Explainer

### What you are looking at

A two-dimensional disk of particles attracting each other under gravity.
The amber boxes drawn over them are the live quadtree: the algorithm
subdivides the bounding square into four child squares whenever a cell
contains more than one body, and stops subdividing where space is
already sparse. The tree adapts to the moving distribution every
single step.

The headline number in the readout is the per-step pair-evaluation
count. With the tree turned on it grows like $N\log N$. Turn the tree
off and it jumps to $N(N-1)$.

### Why direct summation breaks

Newtonian gravity is pairwise. To advance N bodies one step you need
the acceleration on each, and that is a sum over all the others,

$$\vec a_i \;=\; \sum_{j\ne i}\, G\,m_j\,\frac{\vec r_j - \vec r_i}
  {\bigl(|\vec r_j - \vec r_i|^2 + \varepsilon^2\bigr)^{3/2}},$$

with Plummer softening $\varepsilon$ (which keeps two close particles
from blowing up). The total work is $N(N-1)/2$ pair evaluations: $10^3$
bodies need $\sim 5\times 10^5$ pairs, $10^4$ bodies need $5\times 10^7$.
A laptop runs out of frames somewhere around a few thousand particles.

### The Barnes-Hut approximation

The fix exploits a basic fact: gravity from a distant clump looks the
same as gravity from a point at the clump's centre of mass. So
recursively partition space: every cell that holds more than one body
splits into four child cells, each holding the bodies that fall inside
it. The result is a tree where the leaves are single particles and the
internal nodes carry the total mass and centre of mass of their
subtree.

To compute the force on a body, walk the tree. At each node, compare
the cell width $s$ to the distance $d$ from the target. If

$$\frac{s}{d} \;<\; \theta,$$

the cell is "far enough" and you treat it as a single point at its
centre of mass; otherwise you descend into its children. The opening
angle $\theta \approx 0.5$ to $0.7$ is the accuracy knob: smaller
$\theta$ gives a more accurate force at higher cost. The total work
per body is $O(\log N)$ instead of $O(N)$.

### The symbols

- $\vec r_i$: position of body $i$.
- $m_i$: mass of body $i$.
- $G$: gravitational constant (set to 1 in code units).
- $\varepsilon$: Plummer softening length (set to a few percent of the
  disk radius).
- $\theta$: tree opening angle.
- $s$: side length of a tree cell.
- $d$: distance from the target body to the cell's centre of mass.

### Things to try

- Toggle the tree off and watch the per-step evaluation count jump from
  a few thousand to a few hundred thousand.
- Open up the opening angle ($\theta = 1.0$) and watch the tree start
  to miss close encounters: orbits become noisier, the disk fluffs up
  faster.
- Tighten $\theta \to 0.3$ and the per-step evaluations shoot up
  toward the direct count: the tree only helps when you allow some
  averaging.

### Where this comes from

The Barnes-Hut tree algorithm is from Barnes and Hut, Nature 324
(1986) 446. The kick-drift-kick leapfrog and Plummer softening
practice follow Springel, MNRAS 364 (2005) 1105.
