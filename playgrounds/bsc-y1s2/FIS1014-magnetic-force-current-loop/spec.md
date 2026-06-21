---
title: Force and Torque on a Current Loop
slug: magnetic-force-current-loop
status: verified
audience: portfolio
created: 2026-06-21
primary_uc: FIS1014
supporting_ucs: []
curriculum_year: bsc-y1s2
primary_citation: griffithsem2017
primary_chapter: 6
hook: "A current loop in a uniform field feels no net force but a torque tau = m x B. Let it swing and it settles like a compass; add a commutator and it spins, which is an electric motor."
one_paragraph: "A loop of N turns and area A carrying current I is a magnetic dipole with moment m = N I A n. In a uniform field B the net force vanishes (the forces on opposite sides cancel) but the torque is tau = m x B, of magnitude N I A B sin(theta), maximal when the loop faces the field and zero when m is aligned with B, with orientation energy U = -m.B. The playground shows the loop rotating about a vertical axis with the force couple F = I L x B on its two axis-parallel sides, the current direction, and the moment vector m. In free mode it is a damped magnetic pendulum that settles to alignment; in motor mode a commutator reverses the current each half turn so the torque always drives one way and the loop spins to a terminal speed set by the load, with the |sin(theta)| torque ripple of a single-loop DC motor. The diagnostics plot torque versus orientation and the time series."
tags: [electromagnetism, magnetism, motor, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [mode, B, I]
invariants:
  - key: law
    label: the torque equals N I A B sin(theta)
    tolerance: 1e-3
  - key: energy
    label: the free undamped loop conserves rotational energy
    tolerance: 2e-3
  - key: terminal
    label: the motor reaches the terminal speed (2/pi) N I A B / gamma
    tolerance: 0.1
what_to_try:
  - Watch the free loop settle with its moment m aligned along B (the stable zero of the torque curve).
  - The force couple is largest when the loop faces the field and does no turning when m is along B.
  - Toggle to motor: the commutator flips the current each half turn so the loop spins one way; raise the load for a lower terminal speed.
references:
  - "Griffiths, Introduction to Electrodynamics, Fifth ed., Sec. 6.1.3 (torque on a magnetic dipole)."
  - "Halliday, Resnick and Walker, Fundamentals of Physics, Ch. 28 (magnetic force, the electric motor)."
---

# Force and torque on a current loop

## Physical setup

A rectangular loop of $N$ turns, width $W$, height $H$ (area $A = WH$), carrying
current $I$, hangs so it can rotate about a vertical axis in a uniform horizontal
field $\mathbf{B}$. Its magnetic moment is $\mathbf{m} = N I A\,\hat{\mathbf{n}}$.

## Equations

The two sides parallel to the rotation axis carry the force couple
$\mathbf{F} = I\mathbf{L}\times\mathbf{B}$; the net force is zero but the torque is

$$ \boldsymbol{\tau} = \mathbf{m}\times\mathbf{B}, \qquad |\boldsymbol{\tau}| = N I A B \sin\theta, $$

with $\theta$ the angle between $\mathbf{m}$ and $\mathbf{B}$ and orientation
energy $U = -\mathbf{m}\cdot\mathbf{B} = -N I A B\cos\theta$ (stable at
$\theta=0$, unstable at $\theta=\pi$). The equation of motion is
$I_\text{m}\ddot\theta = \tau - \gamma\dot\theta$. Free mode uses
$\tau = -N I A B\sin\theta$ (a magnetic pendulum). Motor mode adds a commutator
that reverses the current at $\theta=0,\pi$, giving $\tau = N I A B|\sin\theta|$,
which drives continuous rotation to the terminal speed
$\bar\omega = (2/\pi)\,N I A B/\gamma$ (the half-cycle-average drive balancing the
load).

## Numerical method

No engine. The ODE is advanced with a semi-implicit (symplectic) step, which
conserves the rotational energy of the undamped pendulum. The torque law and the
terminal speed are checked in the tests.

## Controls

- Toggle motor / free. Field $B$, current $I$, load $\gamma$. Reset and Pause.

## Expected qualitative features

1. The free loop swings and settles with $\mathbf{m}$ aligned along $\mathbf{B}$.
2. The force couple is maximal when the loop faces the field, zero when aligned.
3. The motor spins continuously to a terminal speed, with $|\sin\theta|$ torque
   ripple.

## Invariants and acceptance thresholds

- $|\tau| = N I A B\sin\theta$ at every orientation.
- The undamped free pendulum conserves $\tfrac12 I_\text{m}\dot\theta^2 + U$.
- The motor's time-averaged $\omega$ approaches $(2/\pi)N I A B/\gamma$.

## Citations

Griffiths, Introduction to Electrodynamics, 5th ed., Sec. 6.1.3. Halliday,
Resnick and Walker, Fundamentals of Physics, Ch. 28.
