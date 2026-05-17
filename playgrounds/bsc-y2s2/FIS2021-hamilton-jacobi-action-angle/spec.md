---
title: Action-Angle Variables
slug: hamilton-jacobi-action-angle
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Ramp the spring constant slowly and the energy doubles while the action barely twitches: the adiabatic invariant, made visible.'
one_paragraph: 'Action-angle variables for a bound one-degree-of-freedom system. The action J = (1/2pi) contour p dq is the enclosed phase area over 2pi; the conjugate angle theta winds at the constant rate omega(J) = dH/dJ. The scene shows the phase orbit with that area shaded beside the action-angle picture, where the harmonic orbit becomes a circle of radius sqrt(2J) swept uniformly. The harmonic oscillator is isochronous (omega = w0 for any amplitude); the pendulum is anharmonic (omega falls as the swing grows); and under a slow ramp of w0 the action J is adiabatically invariant while the energy tracks w0. The headless sim.js is gate-tested for the harmonic action from the contour integral, isochrony, the circle of radius sqrt(2J), uniform theta, pendulum anharmonicity, the energy/action inversion, the geometric area identity and adiabatic invariance.'
tags: [mechanics, hamiltonian, action-angle, multi-panel, live-readout]
difficulty: 4
tier: advanced
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 6
curriculum_year: 'L:F-2Y-2S'
primary_uc: FIS2021
share_state_keys: []
---

# Action-Angle Variables

## Physical setup

A 1-DOF bound system: harmonic `V = 1/2 w0^2 q^2`, pendulum
`w0^2 (1 - cos q)`, or quartic `1/4 w0^2 q^4`, at energy `E`.

## Governing equations

`J = (1/2 pi) contour p dq`, `p = sqrt(2(E - V))`;
`omega(J) = dH/dJ = 2 pi / T(E)`, `T = contour dq/p`. Harmonic:
`J = E/w0`, `omega = w0` (isochronous), orbit a circle of radius
`sqrt(2J)` in `(sqrt(w0) q, p/sqrt(w0))`. Adiabatic theorem: `J`
invariant under a slow `w0(t)`.

## Numerical method

The action and period are turning-point-desingularized midpoint
integrals; the orbit evolves by velocity-Verlet; the angle advances
by `omega dt`. Deterministic, no RNG. Reference: Goldstein, Poole
and Safko, Classical Mechanics (3rd ed.), Ch. 10
(`goldstein-mech`); Landau and Lifshitz, Mechanics (3rd ed.),
Sec. 49-50 (`landau-mechanics`).

## Controls

- potential: harmonic, pendulum, quartic.
- energy E: the orbit size.
- omega0: the natural frequency.
- adiabatic ramp: slowly vary w0 and watch J hold.
- Reset, Pause.

## Expected qualitative features

- The phase orbit and its shaded area scale with E; the readout
  `J = area/2pi`.
- Harmonic: a circle on the right, the angle marker rotating at a
  constant rate independent of E.
- Pendulum/quartic: the period (and the marker) slow as E grows.
- Adiabatic ramp: `dJ/J` stays near zero while `E` swings with `w0`.

## Invariants and acceptance thresholds

- Harmonic `J = E/w0` from the contour integral (0.1%).
- Harmonic isochronous: `omega = w0` for all `E` (0.2%).
- Orbit is a circle of radius `sqrt(2J)` (1e-6).
- `theta` advances in equal increments `= w0 dt` (1e-9).
- Pendulum anharmonic: `omega(J)` decreases with amplitude;
  small-swing `omega -> w0`.
- Energy/action inversion consistent (1e-9 harmonic, 5e-3 pendulum).
- `J = enclosed area / 2 pi` (2e-3).
- Adiabatic: `|dJ/J| < 2e-2` while `|dE/E| > 0.4` under a slow ramp.

## Limiting cases for verification

- Small amplitude: every potential is harmonic, `omega -> w0`.
- `E -> 2 w0^2` pendulum: the period diverges (separatrix).
- Slow ramp: `J` constant (adiabatic), `E ~ w0`.

## Visual fallback

Static frame: the phase orbit / shaded area and the action-angle
circle at the captured energy.

## Citations

- Goldstein, Poole and Safko, Classical Mechanics (3rd ed.),
  Ch. 10 (`goldstein-mech`).
- Landau and Lifshitz, Mechanics (3rd ed.), Sec. 49-50
  (`landau-mechanics`).

## Stretch goals

- The Hamilton-Jacobi generating function S(q, J) explicitly.
- A separatrix-crossing demo where the adiabatic invariant jumps.

## Risk register

- The action integrand is inverse-sqrt singular at the turning
  points; a `q = mid + h cos u` substitution removes it.
- The pendulum is taken in libration only (`E < 2 w0^2`); the
  rotation branch is out of scope.
