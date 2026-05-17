---
title: Atwood Machine with a Massive Pulley
slug: atwood-machine-constrained
status: verified
audience: portfolio
created: 2026-05-17
hook: 'The pulley is not just a frictionless point: give it mass and the two rope tensions stop being equal.'
one_paragraph: 'A physical Atwood machine with a pulley of finite moment of inertia. The rope constraint plus the pulley torque equation give a = (m1-m2)g/(m1+m2+I/R^2) and unequal tensions T1 = m1(g-a), T2 = m2(g+a). Sliders, a disk/ring selector and a zero-mass pulley make the inertia correction visible; v(t) and a(t) trace in a side panel.'
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

# Atwood Machine with a Massive Pulley

## Physical setup

Two masses `m1`, `m2` hang from an inextensible massless rope over a
pulley of mass `M`, radius `R` and moment of inertia `I`. The rope does
not slip, so both masses share one coordinate and the pulley angular
speed is `v/R`. Weight and tension force arrows (length proportional to
force) are drawn on each block; the pulley carries a spinning spoke and
its drawn heft grows with `M`.

## Governing equations

$$a=\frac{(m_1-m_2)g}{m_1+m_2+I/R^2},\quad
T_1=m_1(g-a),\quad T_2=m_2(g+a),$$

with `I = 1/2 M R^2` (uniform disk) or `I = M R^2` (thin ring), and the
pulley torque relation `(T1 - T2) R = I a / R`.

## Numerical method

RK4 on `(x, v)` with `dt = 0.002` (the acceleration is
state-independent, so this is also an exactness check on the
integrator). The rig loops when travel exceeds 1.5 m.

## Controls

- `m1`, `m2`, pulley `M` sliders; disk/ring selector; Reset, Pause.

## Expected qualitative features

- Unequal masses accelerate immediately (autoplay).
- A massive pulley measurably reduces `a` and splits `T1 != T2`.
- A ring brakes harder than a disk of the same mass.
- Equal masses give a static, balanced rig.

## Invariants and acceptance thresholds

- Total mechanical energy conserved within 1e-6 over 1e4 steps.
- Massless pulley recovers `(m1-m2)g/(m1+m2)` within 0.1%.
- Tensions equal for `M = 0`, `T1 > T2` for `M > 0`, and
  `(T1-T2)R = I a/R`.
- Equal masses give exactly zero acceleration; `|a| < g` always.

## Limiting cases for verification

- `M -> 0`: classical Atwood result, equal tensions.
- `m1 = m2`: equilibrium, `a = 0` for any pulley.

Source: Marion and Thornton, *Classical Dynamics*, 5th ed., Sec. 2
(`marion-thornton`); Kleppner and Kolenkow, *An Introduction to
Mechanics*, Ch. 6.
