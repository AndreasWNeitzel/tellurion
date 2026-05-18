---
title: Projectile with Drag and the Magnus Force in 3D
slug: projectile-drag-magnus-3d
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Put sidespin on the ball and it does not just fall short, it swerves out of the plane entirely.'
one_paragraph: 'A whole volley of balls is launched almost together (a few degrees of azimuthal fan) under gravity, quadratic drag and the spin-dependent Magnus force, integrated with RK4. Each ball carries a different sidespin, swept continuously from strong one way, through zero, to strong the other way (a colour gradient). Because the Magnus force is perpendicular to both velocity and spin, each ball curves out of the launch plane by a different amount, so the volley splays into a three-dimensional ribbon over the ground with per-ball shadows. That lateral spread is intrinsically 3D and cannot be read off a flat plot. The camera is a fixed perspective (constant scale, no auto-zoom); azimuth and height sliders rotate it.'
tags: [mechanics, animation, live-readout]
difficulty: 2
tier: medium
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
curriculum_year: 'L:F-1Y-1S'
primary_uc: F1006
share_state_keys: []
---

# Projectile with Drag and the Magnus Force in 3D

## Explainer

### What you are looking at

The clean parabola of school physics is a vacuum fiction. The
playground fires three identical balls at once, in vacuum, with air
drag, and with drag plus spin, over a 3D ground grid, so you see
exactly how much air and spin bend a real trajectory and why a
sideways-spinning ball curves out of its launch plane.

### The three forces

Each ball obeys

$$m\frac{d\mathbf v}{dt}
  = m\mathbf g
  - \tfrac12\rho C_D A\,|\mathbf v|\,\mathbf v
  + S\,\boldsymbol\omega\times\mathbf v.$$

- Gravity alone gives the symmetric vacuum parabola, range maximal at
  $45^\circ$.
- Quadratic drag $-\tfrac12\rho C_D A|\mathbf v|\mathbf v$ always
  opposes motion, so it shortens the range, makes the descent
  steeper than the ascent (broken symmetry), and lowers the optimal
  launch angle below $45^\circ$. There is no closed form; it is
  integrated numerically.
- The Magnus force $S\,\boldsymbol\omega\times\mathbf v$ from spin is
  perpendicular to both the velocity and the spin axis, so a vertical
  spin axis curves the ball sideways, lifting it out of the launch
  plane entirely. This is genuinely 3D: the trajectory is a space
  curve, not a planar arc, which is why the scene is drawn with an
  oblique 3D camera.

### Why it matters

This is the physics of every curved free kick, slider, and topspin
lob: drag sets the reach, the Magnus force sets the curve, and the
spin-axis orientation chooses which way (lift, dip, or sideways
bend). The 3D view makes the out-of-plane Magnus deflection obvious,
which a 2D plot hides. The playground sweeps speed, angle, drag and
spin and shows all three balls diverge from the vacuum parabola.

### Things to try

- Compare the vacuum vs drag balls: the drag one falls short with an
  asymmetric, steeper descent.
- Add sidespin and watch the third ball curve out of the launch
  plane (the 3D Magnus deflection).
- Flip the spin axis to backspin/topspin and watch the ball float or
  dip instead of curving sideways.

### Where this comes from

Quadratic drag and the Magnus force on a spinning projectile follow
Halliday, Resnick and Walker, *Fundamentals of Physics*, Chapters 4
and 6, and Adair, *The Physics of Baseball*.

## Physical setup

A unit-mass ball is launched from the origin. Three copies fly
simultaneously over an oblique-projected ground grid: vacuum (grey
dashed), quadratic drag (amber) and drag plus Magnus (cyan). A
spinning ball with a spin-axis arrow rides the Magnus path; landing
markers show where each lands.

## Governing equations

$$\dot{\mathbf v}=-g\hat z-c\,|\mathbf v|\,\mathbf v
+c_M\,(\boldsymbol\omega\times\mathbf v).$$

The Magnus term is, by construction, perpendicular to both `v` and
`omega`.

## Numerical method

RK4 on `(p, v)` with `dt = 0.002`, terminating at the ground crossing
(`z = 0`) with a linear interpolation for the exact landing point.

## Controls

- launch speed, elevation sliders; max |spin| (the gradient extent);
  number of balls in the volley.
- camera azimuth and height sliders (fixed perspective, no auto-zoom);
  Reset, Pause.

## Expected qualitative features

- The volley leaves almost together then fans into a 3D ribbon: balls
  with opposite spin curve to opposite sides, the zero-spin ball stays
  in the launch plane.
- The lateral spread grows with |spin| and is visibly out-of-plane
  (the case for showing this in 3D, not a 2D plot).
- Rotating the camera does not rescale the scene (constant scale).

## Invariants and acceptance thresholds

- Vacuum range and apex match the analytic parabola within 0.2%.
- Magnus force perpendicular to both `v` and `omega` (dot < 1e-12).
- Quadratic drag strictly shortens the range.
- Sidespin produces lateral deflection > 1 m; topspin produces none.
- Backspin range greater than topspin range.
- Drag-free, spin-free flight conserves `1/2 v^2 + g z` within 0.1%.

## Limiting cases for verification

- `c = 0, cM = 0`: exact projectile parabola.
- `omega = 0`: reduces to pure-drag trajectory.

Source: Marion and Thornton, *Classical Dynamics*, 5th ed., Ch. 2
(`marion-thornton`); R. K. Adair, *The Physics of Baseball*.
