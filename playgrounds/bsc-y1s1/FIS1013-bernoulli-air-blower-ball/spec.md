---
title: Bernoulli Air-Blower Ball
slug: bernoulli-air-blower-ball
status: verified
audience: portfolio
created: 2026-05-16
primary_uc: FIS1013
supporting_ucs: []
curriculum_year: bsc-y1s1
primary_citation: tritton
primary_chapter: 11
hook: 'A light ball hangs in a tilted air jet and self-centres: tip the nozzle, cut the power, or grab the ball and watch it ride back.'
one_paragraph: 'A table-tennis-mass ball is suspended in a turbulent free jet. Vertical balance sets the levitation height where quadratic sphere drag equals gravity; the ball is also laterally stable because a finite sphere sampling the jet sees a higher speed (lower static pressure) on the side toward the fast core, giving a net restoring force, the everyday Bernoulli/entrainment effect. The nozzle tilts, the power varies, the blower can be switched off, and the ball is draggable; release it and it rides back into the jet.'
tags: [mechanics, fluids, animation, live-readout, interactive]
difficulty: 3
tier: simple
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: []
---

# Bernoulli air-blower ball

## Explainer

### What you are looking at

A ball hovering on an air jet, and not just hovering: nudge it
sideways and it springs back to the center instead of falling out.
The playground shows why a tilted jet still traps the ball, which is
the real lesson (it is the same physics that makes a spinning ball
curve and a wing lift).

### Vertical balance

The free jet entrains surrounding air and decelerates with height, so
its drag on the ball falls off with distance from the nozzle. The
ball floats at the height where the upward drag balances gravity:

$$\tfrac12\,\rho\,C_D\,A\,v_\mathrm{jet}^2(h)
  \;=\; m g.$$

Above that point the jet is too weak and the ball sinks; below it the
jet is too strong and pushes the ball back up, so the equilibrium
height is stable.

### Lateral trapping: the Bernoulli/Coanda restoring force

The interesting part is sideways stability. Move the ball partly out
of the jet and the airflow is faster on the side still inside the jet
than on the outside. By Bernoulli's principle along a streamline,

$$P + \tfrac12\rho v^2 = \text{const},$$

faster flow means lower pressure, so the higher-pressure outer air
pushes the ball back toward the jet axis (the jet also bends around
the ball, the Coanda effect, adding to the inward push). The net
sideways force always points back to center, giving a restoring force
like a spring: the ball oscillates about the axis rather than falling
out. This is why the trick works even when the blower is tilted well
off vertical. The playground lets you tilt the jet and perturb the
ball and shows the vertical balance and the lateral restoring force.

### Things to try

- Watch the ball settle at the height where jet drag equals gravity,
  and bob back if pushed up or down.
- Nudge the ball sideways and watch the lower-pressure jet side pull
  it back to the axis (the restoring force).
- Tilt the blower and see the ball still trapped on the jet axis,
  not just balanced on top.

### Where this comes from

Bernoulli's principle, jet entrainment, and the Coanda restoring
effect follow Halliday, Resnick and Walker, *Fundamentals of
Physics*, Chapter 14, and Tritton, *Physical Fluid Dynamics*.

## Physical setup
A sphere of mass $m$ and radius $R$ sits in a turbulent free jet issuing
from a nozzle whose axis can be tilted by an angle from vertical. The
jet has a centreline speed that decays with distance and a Gaussian
cross-section that spreads downstream.

## Governing equations
Jet speed at axial distance $s$ and perpendicular offset $r$:
$$u(s,r) = U_0\,\frac{1}{1+s/L}\,\exp\!\left(-\frac{r^2}{w(s)^2}\right),
\qquad w(s) = w_0 + \kappa s.$$
Forces on the ball: gravity $-mg\,\hat y$, quadratic drag
$\tfrac12\rho C_d A\,|\mathbf v_{\rm rel}|\,\mathbf v_{\rm rel}$ with
$\mathbf v_{\rm rel}=\mathbf u_{\rm air}-\mathbf v$, and the Bernoulli
cross-jet restoring force
$$F_\perp \approx \tfrac12\rho A\,(v_{\rm in}^2 - v_{\rm out}^2),$$
sampled at the two edges of the ball across the jet, directed toward
the faster (lower-pressure) side.

## Numerical method
Semi-implicit Euler at $\Delta t = 1/240\,$s. The levitation height is
found by bisection of the on-axis vertical drag against $mg$.

## Controls
- `blower power` $U_0$ (9..30 m/s).
- `tilt` of the nozzle (-25..25 deg).
- Blower on/off; Reset ball. The ball is draggable.

## Expected qualitative features
1. Released above the jet, the ball settles to a stable hover height.
2. Tilting the nozzle moves the hover point along the tilted axis.
3. Nudged sideways, the ball returns to the jet core.
4. Blower off: the ball falls to the floor.
5. Power too low: no equilibrium exists; the ball cannot be held.

## Invariants and acceptance thresholds
| invariant | threshold | location |
| on-axis ball settles to a bounded height | $R{+}0.02 < y < 1.3$, $|v_y|<0.5$ | invariants test |
| equilibrium height grows with power | $y_{eq}(26) > y_{eq}(12) > 0$ | invariants test |
| power too low: no equilibrium, ball drops | $y_{eq}$ null, $y<0.05$ | invariants test |
| off-axis ball feels inward force | $v_x<0$ after one step from $x>0$ | invariants test |
| off-axis ball converges to the axis | $|x|$ decreases over 8000 steps | invariants test |
| blower off: ball falls | $y<0.05$ | invariants test |
| visual SSIM | $>0.92$ on five deterministic frames | visual test |

All confirmed in `invariants.test.mjs` (7 tests passing).

## Limiting cases for verification
- Blower off: pure free fall to the floor.
- On-axis, symmetric jet: the Bernoulli lateral force vanishes ($v_{\rm
  in}=v_{\rm out}$), so the only equilibrium condition is drag $=mg$.
- $U_0$ small: no height satisfies drag $=mg$; equilibrium is null.

## Visual fallback
If Canvas2D is unavailable the figure caption still reads as a paper
sentence describing the jet-levitation balance.

## Citations
- Tritton, *Physical Fluid Dynamics*, 2e, turbulent free jet
  (`tritton`).

## Stretch goals
- Two balls sharing one jet; vortex shedding wobble.
- Coanda attachment when the tilt is large.

## Risk register
- The point-sample Bernoulli term is a lumped model of an extended-body
  effect; it is tuned for qualitative stability, not a CFD result.
