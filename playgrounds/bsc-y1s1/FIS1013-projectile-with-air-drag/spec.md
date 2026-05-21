---
title: Projectile Motion with Air Drag
slug: projectile-with-air-drag
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS1013
supporting_ucs: []
curriculum_year: bsc-y1s1
hook: "In a vacuum a thrown ball traces a perfect, symmetric parabola. Add air and the truth is messier: the path is shorter, the descent steeper than the climb, and the best launch angle drops below 45 degrees."
one_paragraph: "Three projectiles are launched identically: one in vacuum, one with Stokes (linear in v) drag, one with quadratic (v squared) drag. The vacuum ball follows the textbook symmetric parabola with the longest range. Drag bleeds energy continuously, so the drag arcs are shorter and asymmetric, rising less steeply than they fall, and the heavier quadratic drag (the right model for everyday speeds in air) shortens the range most. The three trajectories are drawn together with a moving marker on each and a header readout of the launch parameters and the vacuum range, so the gap between the ideal parabola and the real drag paths is immediate. Which drag law applies is set by the flow regime (the Reynolds number), not by the projectile. This is why ballistics tables never use the vacuum formula."
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

# Projectile motion with air drag

## Explainer

### What you are looking at

The textbook says a projectile traces a clean parabola and the
optimal launch angle is exactly 45 degrees. Add air drag and both
statements break: the path becomes a lopsided arc that falls steeper
than it rose, and the best angle drops below 45. The playground fires
projectiles with and without drag side by side so the difference is
unmistakable.

### Drag-free case

With gravity alone the motion separates: constant horizontal velocity,
uniform vertical acceleration. The path is the symmetric parabola and
the range is maximized at $45^\circ$:

$$R = \frac{v_0^2\sin 2\theta}{g}.$$

### Adding air resistance

A real projectile feels a drag force opposing its velocity. At the
speeds of thrown or batted objects it is quadratic in speed:

$$m\frac{d\mathbf v}{dt}
  = m\mathbf g - \tfrac12\,\rho\,C_D A\,|\mathbf v|\,\mathbf v.$$

This couples the horizontal and vertical motions (drag depends on the
full speed), so there is no closed-form solution; the playground
integrates it numerically. The consequences are systematic:

- The trajectory loses fore-aft symmetry: the descent is steeper and
  shorter than the ascent, because the projectile is slower coming
  down so drag bites differently.
- The range collapses well below the vacuum value, and the
  range-maximizing launch angle shifts down to roughly $35$ to
  $40^\circ$ (less time aloft losing speed to drag is worth more than
  height).
- At high speed a projectile approaches terminal-velocity behaviour,
  where drag nearly balances gravity.

This is why ballistics, athletics, and rocketry never use the naive
$45^\circ$ result. The playground sweeps speed, angle and drag
coefficient and overlays the drag and vacuum paths.

### Things to try

- Compare the drag and no-drag arcs from the same launch: note the
  asymmetric, shortened drag trajectory.
- Sweep the launch angle and find the drag-optimal angle sitting
  below $45^\circ$.
- Increase the drag coefficient (or speed) and watch the descent
  steepen toward near-vertical (terminal fall).

### Where this comes from

Quadratic air drag and its effect on projectile range and the optimal
angle follow Taylor, *Classical Mechanics*, Chapter 2, and Halliday,
Resnick and Walker, *Fundamentals of Physics*, Chapter 4.

## Physical setup

Three projectiles of equal mass m = 1 kg fired simultaneously at the same
speed v_0 and angle theta. Drag laws:
1. None (vacuum).
2. Stokes (linear): F_drag = -b v, b = 0.20.
3. Quadratic (Newton): F_drag = -c |v| v, c = 0.012.

Gravity g = 9.81 m / s^2.

## Governing equations

m a = -m g y-hat + F_drag

For Stokes: closed-form x(t), y(t) in terms of exp. For quadratic, no
closed form; integrate numerically.

## Numerical method

Fourth-order Runge-Kutta, dt = 0.01.

## Controls

- v_0: launch speed, 5 to 40 m/s.
- angle: launch angle, 10 to 80 degrees.
- speed: integrator steps per render frame.
- Reset / Pause / Play.

## Expected qualitative features

1. Vacuum: parabolic trajectory; range = v_0^2 sin(2 theta) / g.
2. Stokes drag: shorter range, asymmetric arc with longer descent than ascent.
3. Quadratic drag: even shorter range at high v_0 (drag scales as v^2).
4. At low speeds: Stokes and vacuum nearly coincide.
5. 45 degrees maximizes vacuum range; with drag the optimal angle is below 45.

## Invariants and acceptance thresholds

1. Vacuum range = v_0^2 sin(2 theta) / g within 1 percent.
2. Drag reduces range below vacuum.
3. Stokes terminal velocity = m g / b. Reached from rest within 5 percent.
4. Quadratic terminal velocity = sqrt(m g / c).
5. 45 degrees maximizes vacuum range.
6. Peak height = v_0^2 sin^2(theta) / (2 g) exact.

All confirmed in `invariants.test.mjs`.

## Limiting cases for verification

- Zero drag: parabolic trajectory.
- Very high v: quadratic drag dominates.
- 90 degrees: vertical drop (no horizontal motion).

## Visual fallback

Canvas2D only. Three colored trajectories on common axes; current positions
shown as dots; ground line and legend.

## Citations

- Marion and Thornton, Classical Dynamics 5e Ch. 2 (`marion-thornton`).
- Adair 1990, The Physics of Baseball (`adair1990`).

## Stretch goals

- Magnus / spin lift (curveball, see magnus-effect-spinning-ball entry).
- Wind (constant horizontal drag offset).
- Variable air density vs altitude.

## Risk register

- Quadratic drag with high v_0 can produce very steep numerical gradients
  near launch; dt = 0.01 is conservative enough.
