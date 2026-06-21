---
title: Projectile with Drag and the Magnus Force in 3D
slug: projectile-drag-magnus-3d
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Put sidespin on the ball and it does not just fall short, it swerves out of the plane entirely.'
one_paragraph: 'A ball is launched under gravity, quadratic drag and the spin-dependent Magnus force, integrated with RK4, and flown along its real trajectory over a ground grid in orthographic pseudo-3D. A faint reference path (the same launch with no spin) shows where it would otherwise land, so the bend you see is the spin alone, and ground-shadow tracks make the lateral curve unambiguous. Because the Magnus force is perpendicular to both velocity and spin, sidespin curves the ball out of the launch plane, backspin lifts it and lengthens the range, and topspin presses it down and shortens it. The diagnostic sweeps the spin rate and plots the range and the lateral deflection at landing, with the live operating point.'
tags: [mechanics, animation, live-readout, 3d]
difficulty: 2
tier: hero
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
curriculum_year: 'L:F-1Y-1S'
primary_uc: F1006
primary_citation: marion-thornton
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
  - "Marion, Thornton, Classical Dynamics of Particles and Systems, Fifth ed."
---

# Projectile with Drag and the Magnus Force in 3D

## Explainer

### What you are looking at

The clean parabola of school physics is a vacuum fiction. The
playground flies one ball along its real trajectory, with air drag and
spin, over a 3D ground grid, alongside a faint reference path showing
where the same ball would land with no spin. The gap between the two,
made plain by the ground-shadow tracks, is the Magnus bend: drag sets
how far it reaches, spin sets how it curves.

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
bend). The 3D view plus the ground-shadow track makes the out-of-plane
Magnus deflection obvious, which a flat plot hides. The diagnostic then
sweeps the spin rate so the dependence is quantitative, not just visual.

### Things to try

- Keep sidespin and raise the spin rate: the path peels off the
  straight reference and the shadow track curves across the grid.
- Switch to backspin and topspin: the ball lifts past the reference or
  drops short of it, range instead of lateral bend.
- Set spin to none: the path collapses onto the reference, just gravity
  and drag, no Magnus push.

### Where this comes from

Quadratic drag and the Magnus force on a spinning projectile follow
Halliday, Resnick and Walker, *Fundamentals of Physics*, Chapters 4
and 6, and Adair, *The Physics of Baseball*.

## Physical setup

A unit-mass ball is launched from the origin and flies over an
oblique-projected ground grid. Its real trajectory (drag plus the
chosen spin) is drawn bright; a faint dashed reference shows the same
launch with no spin. Ground-shadow tracks (both paths projected onto
z = 0) and landing markers make the lateral deflection legible. A short
spin-axis glyph rides the ball.

## Governing equations

$$\dot{\mathbf v}=-g\hat z-c\,|\mathbf v|\,\mathbf v
+c_M\,(\boldsymbol\omega\times\mathbf v).$$

The Magnus term is, by construction, perpendicular to both `v` and
`omega`.

## Numerical method

RK4 on `(p, v)` with `dt = 0.002`, terminating at the ground crossing
(`z = 0`) with a linear interpolation for the exact landing point.

## Controls

- spin axis: sidespin / backspin / topspin / none.
- spin rate (0 to 80 rad/s).
- launch speed (15 to 45 m/s) and angle (10 to 70 deg).
- Reset, Pause.

## Expected qualitative features

- Sidespin curves the path off the straight no-spin reference; the
  shadow track sweeps sideways across the grid.
- Backspin lengthens the range (lift) and topspin shortens it
  (down-force); neither produces lateral bend.
- The diagnostic shows the lateral deflection growing with spin rate
  for sidespin, and the range moving up or down for back/topspin.

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

Source: Marion and Thornton, *Classical Dynamics*, 5th ed., Ch. 2; R. K. Adair, *The Physics of Baseball*.
