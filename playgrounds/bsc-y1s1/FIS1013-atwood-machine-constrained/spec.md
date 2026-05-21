---
title: Atwood Machine with a Massive Pulley
slug: atwood-machine-constrained
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Two weights, one rope: the same gravity acts on both, yet the rope tension is exactly what keeps the lighter one from simply falling.'
one_paragraph: 'An Atwood machine focused on the gravity-versus-tension balance. With an ideal (massless) pulley the rope tension is equal on both sides and a = (m1-m2)g/(m1+m2): each block carries a weight arrow m g down and a tension arrow T up, and the net (m1-m2)g is what accelerates the pair. A block stops when it reaches the pulley or the floor (no teleport reset), and you can grab and tug either block with the mouse. A toggle switches to the double (compound) machine, where a movable pulley carrying m2 and m3 hangs opposite m1 and the rope tensions satisfy T = 2 T2. An optional pulley-mass slider is the advanced case where the moment of inertia splits the tensions, T1 = m1(g-a), T2 = m2(g+a).'
tags: [mechanics, animation, live-readout]
difficulty: 2
tier: medium
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
curriculum_year: 'L:F-1Y-1S'
primary_uc: F1006
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

# Atwood Machine with a Massive Pulley

## Explainer

### What you are looking at

An Atwood machine is two weights on a rope over a pulley, the classic
demo of how a constraint (the inextensible rope) couples two motions
into one. The twist here is a heavy pulley: its rotational inertia
slows everything down and the rope tension is no longer the same on
both sides. The playground shows the masses moving and the tensions
live.

### The constraint and the ideal case

The rope does not stretch, so both masses share one speed and
acceleration magnitude $a$, and the pulley spins at
$\alpha = a/R$. With a massless, frictionless pulley the classic
result is

$$a = \frac{(m_1 - m_2)\,g}{m_1 + m_2},$$

less than $g$ because the heavier mass must drag the lighter one up.

### Adding the pulley's inertia

A real pulley of moment of inertia $I$ must be spun up, which costs
torque, so the two rope tensions differ ($T_1\neq T_2$) and that
difference supplies the angular acceleration. Writing Newton's law
for each mass and the rotational equation $\,(T_1-T_2)R = I\alpha\,$
for the pulley, with $\alpha=a/R$, gives

$$a = \frac{(m_1 - m_2)\,g}
  {m_1 + m_2 + I/R^2}.$$

The pulley contributes an effective added mass $I/R^2$ (for a uniform
disk, $I=\tfrac12 M R^2$, so it adds $M/2$). The heavier the pulley,
the more sluggish the system and the larger the tension asymmetry
$T_1-T_2 = I a / R^2$. Energy is still conserved: the lost potential
energy now also goes into the pulley's rotational kinetic energy
$\tfrac12 I\omega^2$. The playground sweeps the masses and pulley
inertia and shows $a$, both tensions, and the energy bookkeeping.

### Things to try

- Set the pulley massless and recover $a=(m_1-m_2)g/(m_1+m_2)$ with
  $T_1=T_2$.
- Increase the pulley mass and watch the acceleration drop and the
  two tensions split apart.
- Make $m_1=m_2$: the system is balanced and stays at rest whatever
  the pulley.

### Where this comes from

The constrained Atwood machine with a massive pulley follows
Kleppner and Kolenkow, *An Introduction to Mechanics*, Chapter 6, and
Taylor, *Classical Mechanics*, Chapter 3.

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

- `machine` selector: single Atwood / double (compound).
- `m1`, `m2` (and `m3` in double mode) sliders.
- `pulley M` slider (advanced; default 0 = ideal massless pulley with
  equal tensions).
- Reset, Pause. Grab and tug any block with the mouse or touch.

## Expected qualitative features

- Ideal pulley: equal tensions, a = (m1-m2)g/(m1+m2); the weight and
  tension arrows make the gravity-versus-tension balance explicit.
- A block stops at the pulley or the floor and stays there (no
  teleport reset); Reset or a tug restarts it.
- Dragging a block moves the other oppositely (inextensible rope);
  releasing hands the tugged velocity back to the dynamics.
- Double machine: m1 against a movable pulley carrying m2, m3; the
  rope tensions satisfy T = 2 T2; balancing m1 against the lower pair
  freezes the rig.
- Advanced: a massive pulley reduces `a` and splits `T1 != T2`.
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
