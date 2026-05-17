---
title: Projectile with Drag and the Magnus Force in 3D
slug: projectile-drag-magnus-3d
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Put sidespin on the ball and it does not just fall short, it swerves out of the plane entirely.'
one_paragraph: 'A ball launched in 3D under gravity, quadratic drag and the spin-dependent Magnus force, integrated with RK4. Three trajectories fly at once over a perspective ground grid: vacuum, drag only, and drag plus Magnus. Because the Magnus force is perpendicular to both velocity and spin, sidespin curves the flight laterally while backspin adds lift and topspin cuts the range.'
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

- launch speed, elevation, spin-rate sliders.
- spin-axis selector (sidespin, backspin, topspin, knuckle); Reset,
  Pause.

## Expected qualitative features

- Vacuum is the longest, symmetric parabola; drag shortens it.
- Sidespin swerves the cyan path out of the vertical plane.
- Backspin lifts and lengthens; topspin dips and shortens.

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
