---
title: Bouncing Shapes Concave Surface
slug: bouncing-shapes-concave-surface
status: verified
audience: portfolio
created: 2026-05-16
primary_uc: FIS1013
supporting_ucs: []
curriculum_year: bsc-y1s1
primary_citation: kleppner
primary_chapter: 4
hook: 'Drop balls into a bowl you choose: a parabola swings them like a spring, a V-bowl ticks, a quartic drifts, an arc swings like a pendulum.'
one_paragraph: 'Thousands of balls are arranged into a shape (star, heart, letter A, crescent, disk) and released into a concave bowl whose profile y = f(x) is selectable (parabola, V, quartic, circular arc, cosine well). On contact the velocity is reflected about the local tangent: the normal component is scaled by the restitution e, the tangential by 1 - mu. With e = 1 and mu = 0 the total mechanical energy is conserved and the balls bounce forever; with e < 1 they dissipate and settle, the shape shattering into a pool at the bottom. The bowl shape governs the qualitative motion, near-simple-harmonic for the parabola, piecewise-constant acceleration for the V, strongly amplitude-dependent for the quartic. The diagnostic tracks the total energy over time, flat at e = 1 and a descending staircase below it.'
tags: [mechanics, collisions, animation, live-readout, interactive]
difficulty: 3
tier: simple
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 4
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
  - "Kleppner, Kolenkow, An Introduction to Mechanics, 2nd ed., Ch. 4."
---

# Bouncing balls in a concave bowl

## Explainer

### What you are looking at

Thousands of particles, in a chosen shape, dropped into a curved bowl
under gravity, bouncing and settling. It is a sandbox for the two
rules that govern almost all rigid-body contact: gravity plus
restitution at every collision. With many particles you watch
collective behaviour (settling, packing, energy loss) emerge from
those simple local rules.

### The two rules

Between contacts each particle is a projectile under gravity:

$$\ddot{\mathbf r} = \mathbf g.$$

At a bounce off the bowl wall, the velocity is reflected about the
local surface normal $\hat{\mathbf n}$ and the normal component is
scaled by the coefficient of restitution $e\in[0,1]$:

$$\mathbf v' = \mathbf v
  - (1+e)\,(\mathbf v\cdot\hat{\mathbf n})\,\hat{\mathbf n}.$$

$e=1$ is a perfectly elastic bounce (no energy lost); $e<1$ removes a
fraction $1-e^2$ of the normal kinetic energy each impact, so the
particles lose height and settle. Particle-particle collisions use
the same impulse law along the line of centres.

### What emerges

The interesting physics is collective:

- A concave bowl focuses trajectories: bounces converge toward the
  bottom, so the cloud collapses into the well rather than spreading
  (the geometric reason a bowl collects, a flat floor does not).
- With $e<1$ the energy monotonically drains and the assembly
  relaxes into a packed static heap whose surface is roughly
  horizontal: granular settling and the angle of repose.
- The chosen initial shape (a letter, a ring) is scrambled by
  collisions, a direct view of how ordered configurations decay into
  the maximum-entropy packed state.

The playground lets you pick the shape, the bowl curvature and the
restitution and watch the focusing, the energy decay, and the final
packing.

### Things to try

- Set $e=1$ and watch the particles bounce forever, focused by the
  bowl but never settling (energy conserved).
- Lower $e$ and watch the cloud lose height each bounce and pack into
  a static heap (granular relaxation).
- Compare a flat floor vs a concave bowl: only the bowl collects the
  particles toward the centre.

### Where this comes from

Projectile motion, the coefficient of restitution and impulsive
collisions follow Halliday, Resnick and Walker, *Fundamentals of
Physics*, Chapters 4 and 9, and Kleppner and Kolenkow, *An
Introduction to Mechanics*, Chapter 4.

## Physical setup
Several point balls fall under uniform gravity into a concave bowl
$y=f(x)$ chosen from a menu. Each contact reflects the velocity about
the local tangent with a coefficient of restitution.

## Governing equations
Free flight: $\ddot{\mathbf r} = -g\,\hat y$. At contact with the
surface (outward normal $\hat n \propto (-f'(x),1)$): decompose
$\mathbf v = v_n\hat n + v_t\hat t$ and set
$$v_n \to -e\,v_n,\qquad v_t \to (1-\mu)\,v_t.$$
Small parabola oscillations are harmonic with
$T = 2\pi/\sqrt{2ag}$.

## Numerical method
Semi-implicit Euler at $\Delta t = 1/240\,$s with a per-step
penetration test and tangent reflection.

## Controls
- `bowl shape`: parabola / V-bowl / quartic / circular arc / cosine.
- `arrangement`: scatter / 5-pointed star / heart / square / letter A /
  ball / lightning bolt (the bolt is the asymmetric figure: no
  horizontal or vertical mirror symmetry).
- `particles` (6..1800): count released; shape modes default to 1200.
- `restitution e` (0.4..1) and `curvature a` (0.25..0.9).
- Drop again; Pause / Play.

## Expected qualitative features
1. Parabola: near-SHM swinging; small-amplitude period independent of
   amplitude.
2. V-bowl: straight free-flight arcs, sharp turn at the vertex.
3. Quartic: flat bottom, period grows with amplitude.
4. Arc: pendulum-like swing.
5. $e=1$: perpetual bouncing; $e<1$: balls settle to the bottom.
6. Shape arrangement: the figure (e.g. a 1200-ball star) is crisp at
   release, then dissolves into the bowl motion because every ball
   obeys the same law; the colour bands persist through the collapse.

## Invariants and acceptance thresholds
| invariant | threshold | location |
| e=1, mu=0 energy conserved | rel drift < 0.06 / 6000 steps | invariants test |
| e<1 dissipates, no injection | E_final < 0.5 E0, max < 1.02 E0 | invariants test |
| balls stay on/above the surface | penetration < 0.05 | invariants test |
| f' matches finite difference of f | < 1e-2 | invariants test |
| parabola small-amp period | within 8% of 2 pi / sqrt(2 a g) | invariants test |
| visual SSIM | > 0.92 on five deterministic frames | visual test |

All confirmed in `invariants.test.mjs` (5 tests passing).

## Limiting cases for verification
- e=1, mu=0 on the parabola: closed periodic orbit, energy conserved.
- Small-amplitude parabola: harmonic, T independent of amplitude.
- e small: rapid settling to the bowl minimum.

## Visual fallback
The caption names the bowl, the restitution rule and the conservation
property so the figure reads without Canvas2D.

## Citations
- Kleppner and Kolenkow, *An Introduction to Mechanics*, 2e, ch. 4
 .

## Stretch goals
- Finite-radius disks with disk-disk collisions.
- Overlay the analytic SHM period marker on the parabola.

## Risk register
- Discrete collision plus explicit gravity is not exactly symplectic;
  the e=1 energy threshold is set to the integrator's bounded drift.
