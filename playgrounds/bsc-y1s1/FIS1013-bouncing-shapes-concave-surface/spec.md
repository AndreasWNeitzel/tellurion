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
one_paragraph: 'Point balls fall under gravity into a concave bowl whose profile y = f(x) is selectable (parabola, V, quartic, circular arc, cosine well). On contact the velocity is reflected about the local tangent: the normal component is scaled by the restitution e, the tangential by 1 - mu. With e = 1 and mu = 0 the total mechanical energy is conserved; with e < 1 the balls dissipate and settle. The bowl shape governs the qualitative motion, near-simple-harmonic for the parabola, piecewise-constant acceleration for the V, strongly amplitude-dependent for the quartic.'
tags: [mechanics, collisions, animation, live-readout, interactive]
difficulty: 3
tier: simple
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: []
---

# Bouncing balls in a concave bowl

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
- `restitution e` (0.4..1) and `curvature a` (0.25..0.9).
- Drop again; Pause / Play.

## Expected qualitative features
1. Parabola: near-SHM swinging; small-amplitude period independent of
   amplitude.
2. V-bowl: straight free-flight arcs, sharp turn at the vertex.
3. Quartic: flat bottom, period grows with amplitude.
4. Arc: pendulum-like swing.
5. $e=1$: perpetual bouncing; $e<1$: balls settle to the bottom.

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
  (`kleppner`).

## Stretch goals
- Finite-radius disks with disk-disk collisions.
- Overlay the analytic SHM period marker on the parabola.

## Risk register
- Discrete collision plus explicit gravity is not exactly symplectic;
  the e=1 energy threshold is set to the integrator's bounded drift.
