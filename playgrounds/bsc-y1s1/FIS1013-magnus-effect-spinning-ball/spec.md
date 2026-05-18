---
title: Magnus Effect on a Spinning Ball
slug: magnus-effect-spinning-ball
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS1013
supporting_ucs: [AST3014]
curriculum_year: bsc-y1s1
hook: "A spinning ball curves. The spin drags air around with it, the flow is faster on one side than the other, and the pressure difference pushes the ball sideways. That is the Magnus force, the physics of a curveball, a topspin forehand and a banana free kick."
one_paragraph: "A ball moving through air while spinning feels a Magnus force perpendicular to both its velocity and its spin axis, on top of gravity and quadratic drag. The playground fires the same launch with three spins: no spin (the reference arc), the chosen spin, and the opposite spin, so the trajectory visibly bends up, down or sideways relative to the reference. Topspin makes the ball dive and shortens the range; backspin lifts it and stretches the range; sidespin curves it laterally. The ball is drawn spinning with a spin-direction arrow, and the readout reports the range with and without spin so the effect is quantified. The force grows with spin rate and speed, which is why a fast, heavily spun ball curves most. This is the mechanism behind a baseball curveball, a tennis topspin lob and a football knuckleball."
tags: [mechanics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Magnus effect on a spinning ball

## Explainer

### What you are looking at

A spinning ball curves in flight: that is the banana free kick, the
curveball, the topspin dip. The playground launches a ball with
adjustable speed and spin and shows the trajectory bending, plus the
drag that always shortens the flight.

### The Magnus force

A spinning ball drags air around with it, so the airflow is faster on
one side and slower on the other. By Bernoulli the pressure is lower
on the fast side, giving a sideways lift force perpendicular to both
the velocity and the spin axis:

$$\mathbf F_M = S\,\boldsymbol\omega \times \mathbf v,$$

with $\boldsymbol\omega$ the spin and $S$ a coefficient set by the
ball's size and the air density. Backspin lifts (the ball "floats"),
topspin pushes it down (a sharp dip), sidespin curves it laterally.
The force is always at right angles to the motion, so it bends the
path without doing work.

### Competing with gravity and drag

The full equation of motion adds gravity and quadratic air drag:

$$m\frac{d\mathbf v}{dt}
  = m\mathbf g
  - \tfrac12\rho C_D A\,|\mathbf v|\,\mathbf v
  + S\,\boldsymbol\omega\times\mathbf v.$$

Drag is antiparallel to $\mathbf v$ and grows with speed, so it
always shortens the range and is why a real trajectory is not the
textbook parabola. The Magnus term competes with gravity: enough
backspin can flatten or even loft the arc; topspin makes it plunge
well short of the no-spin parabola. The playground sweeps launch
speed, angle and spin and overlays the spinning path against the
drag-only and ideal-parabola references so the Magnus deflection is
explicit.

### Things to try

- Add backspin and watch the trajectory flatten and carry farther
  than the no-spin curve.
- Switch to topspin and watch it dip sharply and fall short.
- Crank the speed and see drag bend the path away from the ideal
  parabola even with zero spin.

### Where this comes from

The Magnus force, quadratic drag, and projectile flight follow
Halliday, Resnick and Walker, *Fundamentals of Physics*, Chapters 4
and 6, and Adair, *The Physics of Baseball*.

## Physical setup

A baseball-like ball (m = 0.15 kg) launched with initial speed v_0 and
angle, subject to gravity, quadratic drag, and Magnus lift due to spin.
Convention: positive spin = top-spin (ball rotates in direction of
flight; Magnus force pushes down). Negative spin = back-spin (Magnus
force pushes up).

## Governing equations

  d v / dt = -g y-hat - (c_drag |v|) v / m + (c_mag * spin)(vy, -vx) / m

with c_drag = 0.005, c_mag = 0.0003, g = 9.81.

## Numerical method

Fourth-order Runge-Kutta with dt = 0.01.

## Controls

- v_0: launch speed, 10 to 40 m/s.
- angle: launch angle, 5 to 60 degrees.
- spin: -100 (back-spin) to +100 (top-spin).
- Reset / Pause / Play.

## Expected qualitative features

1. spin = 0: parabolic-like trajectory (with drag asymmetry).
2. spin > 0 (top-spin): shorter range, trajectory curls downward.
3. spin < 0 (back-spin): longer range, trajectory floats.
4. At fixed angle, the trajectory continues until it lands.

## Invariants and acceptance thresholds

1. Positive spin shortens range vs spin = 0.
2. Negative spin extends range vs spin = 0.
3. Zero-spin peak is between 30 and 70 percent of range.
4. Spin sign produces nonzero range difference.
5. Trajectory lands at y = 0 (within 0.1).

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- No drag, no spin: pure parabola.
- Very high spin: trajectory hooks dramatically.

## Visual fallback

Canvas2D only. Three trajectories on common axes: no-spin (dashed
yellow), opposite-spin (cyan), current-spin (orange) with animated
ball.

## Citations

- Adair 1990, The Physics of Baseball (`adair1990`).
- Jackson, Classical Electrodynamics Ch. 12.

## Stretch goals

- Tennis serve trajectories.
- Soccer free kicks (lateral Magnus).
- 3D extension with full angular velocity vector.

## Risk register

- c_drag and c_mag are tuned for visual effect, not measured. Behaviors
  are qualitatively correct.
