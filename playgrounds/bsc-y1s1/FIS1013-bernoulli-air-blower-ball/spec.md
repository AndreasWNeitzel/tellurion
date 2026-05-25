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
  - "Tritton, Physical Fluid Dynamics, 2nd ed., Ch. 11."
---

# Bernoulli air-blower ball

## Explainer

### What you are looking at

A ball hovering on an air jet, and not just hovering: nudge it
sideways and it springs back to the center instead of falling out.
The playground shows why a tilted jet still traps the ball, which is
the real lesson (it is the same physics that makes a spinning ball
curve and a wing lift).

### Vertical balance: drag against gravity

The free jet entrains surrounding air and decelerates with height
above the nozzle. The ball floats at the height $h$ where the upward
drag force balances gravity:

$$\boxed{\;F_{\rm drag}(h) = \tfrac12\,\rho_{\rm air}\,C_D\,A\,v_{\rm jet}^2(h)
  \;=\; m\,g.\;}$$

A turbulent free jet's centreline velocity follows an empirical decay
$v_{\rm jet}(h) \propto v_0\,d_0 / h$ for $h \gg d_0$ (the nozzle
diameter), so the drag falls off as $h^{-2}$. Above the equilibrium
height the jet is too weak and the ball sinks; below it the jet is
too strong and pushes the ball back up. The vertical equilibrium is
*stable*: $\partial F_{\rm drag}/\partial h < 0$ at the float
height, so any displacement returns.

### Lateral trapping: the Bernoulli/Coanda restoring force

Move the ball partly out of the jet. The airflow speed is higher on
the side still inside the jet ($v_{\rm in}$) and lower on the outside
($v_{\rm out}$). Along a streamline at the same height, Bernoulli's
principle gives

$$\boxed{\;P + \tfrac12\,\rho\,v^2 + \rho\,g\,z = \text{const},\;}$$

so the static pressure on the fast-flow side is LOWER than on the
slow-flow side:

$$\Delta P = P_{\rm out} - P_{\rm in} = \tfrac12\,\rho\,(v_{\rm in}^2 - v_{\rm out}^2) > 0.$$

The pressure difference integrated over the ball's surface gives a
net force back toward the jet axis. The jet also bends around the
ball (the Coanda effect), which gives an additional reaction force
toward the axis. The net lateral force is to first order linear in
displacement,

$$F_{\rm lateral} = -k_{\rm restore}\,x,$$

and the ball oscillates about the axis at angular frequency
$\omega \sim \sqrt{k_{\rm restore}/m}$. This is why the trick works
even when the blower is tilted well off vertical: the ball is
trapped on the jet axis, not balanced on its tip.

### Symbols, at a glance

- $\rho_{\rm air}$, density of air ($\approx 1.2\,\mathrm{kg/m^3}$
  at sea level).
- $C_D$, drag coefficient of a sphere ($\approx 0.47$ for a smooth
  sphere at moderate Reynolds number, dropping to $\approx 0.2$ in
  the post-crisis turbulent regime).
- $A = \pi R^2$, the sphere's frontal area.
- $v_{\rm jet}(h)$, the centreline jet speed at height $h$.
- $v_0$, $d_0$, the jet speed and diameter at the nozzle.
- $m$, sphere mass; $g$, gravitational acceleration.
- $P$, $v$, $z$, the local pressure, speed, and height of a fluid
  element along a streamline.
- $k_{\rm restore}$, the effective stiffness of the lateral trap.

### Things to try

- Watch the ball settle at the height where jet drag equals gravity,
  and bob back if pushed up or down.
- Nudge the ball sideways and watch the lower-pressure jet side pull
  it back to the axis (the restoring force).
- Tilt the blower and see the ball still trapped on the jet axis,
  not just balanced on top.

### Bibliographic origin

Bernoulli's principle was published in Bernoulli, *Hydrodynamica*
(1738), Ch. 12. The turbulent free-jet velocity decay law is from
Schlichting, *Boundary Layer Theory* (8th ed., Springer 2000),
Ch. 21. The Coanda effect (a jet bending toward a curved surface)
is the 1936 Coanda patent and is discussed in Tritton, *Physical
Fluid Dynamics* (2nd ed., Oxford 1988), Ch. 23. A clean
undergraduate treatment is Halliday, Resnick and Walker,
*Fundamentals of Physics* (11th ed., Wiley 2018), Ch. 14.

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
 .

## Stretch goals
- Two balls sharing one jet; vortex shedding wobble.
- Coanda attachment when the tilt is large.

## Risk register
- The point-sample Bernoulli term is a lumped model of an extended-body
  effect; it is tuned for qualitative stability, not a CFD result.
