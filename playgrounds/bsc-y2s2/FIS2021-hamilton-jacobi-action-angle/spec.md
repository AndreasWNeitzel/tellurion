---
title: Action-Angle Variables
slug: hamilton-jacobi-action-angle
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Ramp the spring constant slowly and the energy doubles while the action barely twitches: the adiabatic invariant, made visible.'
one_paragraph: 'Action-angle variables for a bound one-degree-of-freedom system. The action J = (1/2pi) contour p dq is the enclosed phase area over 2pi; the conjugate angle theta winds at the constant rate omega(J) = dH/dJ. The scene shows the phase orbit with that area shaded beside the action-angle picture, where the harmonic orbit becomes a circle of radius sqrt(2J) swept uniformly. The harmonic oscillator is isochronous (omega = w0 at any amplitude); the pendulum is anharmonic (omega drops as the swing widens, vanishing at the separatrix); and under a slow change of w0 the action J stays nearly constant while the energy tracks w0, the adiabatic invariant that underlies, for example, the slow pumping of a swing. Reference: Goldstein, Classical Mechanics, Chapter 10; Landau and Lifshitz, Mechanics, Chapter 7.'
tags: [mechanics, hamiltonian, action-angle, multi-panel, live-readout]
difficulty: 4
tier: advanced
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 6
curriculum_year: 'L:F-2Y-2S'
primary_uc: FIS2021
primary_citation: goldstein-mech
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
  - "Goldstein et al., Classical Mechanics."

---

# Action-Angle Variables

## Explainer

### What you are looking at

For a bound oscillator there is a magic change of coordinates that
makes the motion trivial: one variable (the action) stays perfectly
constant, and the other (the angle) just advances at a steady rate.
The playground shows any 1D bound system in both its messy phase
portrait and its clean action-angle form.

### The action and the angle

For a 1-degree-of-freedom system with Hamiltonian $H(q,p)$, a bound
orbit is a closed loop in the $(q,p)$ plane. Define the action as the
phase-space area it encloses (divided by $2\pi$):

$$J = \frac{1}{2\pi}\oint p\,dq.$$

$J$ depends only on the energy, so along any single orbit it is an
exact constant of the motion. Its conjugate angle $\theta$ then obeys

$$\dot\theta = \frac{\partial H}{\partial J} = \omega(J)
  = \text{const},$$

so $\theta$ winds uniformly from $0$ to $2\pi$ once per period. In
action-angle variables every bound oscillator is just a point
circling at constant angular speed; all the dynamics is in the single
function $\omega(J)$.

### Why this is powerful

- $J$ is an adiabatic invariant: change a parameter slowly and $J$
  stays fixed even though $E$ does not (the basis of the old quantum
  theory, $J=n\hbar$, and of why a slowly shortened pendulum keeps
  its action).
- It linearizes the problem and is the natural starting point for
  canonical perturbation theory and KAM theory (tori labelled by
  their actions).
- The frequency $\omega(J)=dE/dJ$ exposes the anharmonicity: it is
  constant for the harmonic oscillator (isochronous) but decreases
  with amplitude for the pendulum and increases for the quartic well.

The playground draws the orbit in $(q,p)$, shades the enclosed action
area, and shows the angle advancing uniformly while $J$ stays pinned,
across the harmonic, pendulum and quartic potentials.

### Things to try

- Pick the harmonic well and confirm $\omega$ is independent of
  amplitude (equal-area annuli, isochronous).
- Switch to the pendulum and watch $\omega(J)$ drop as the amplitude
  (and $J$) grows, slowing near the separatrix.
- Vary the energy and watch the orbit change while $\theta$ always
  advances uniformly and $J$ equals the enclosed area.

### Where this comes from

Action-angle variables, the adiabatic invariant and $\omega=dH/dJ$
follow Goldstein, *Classical Mechanics*, Chapter 10, and Landau and
Lifshitz, *Mechanics*, Section 49.

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
and Safko, Classical Mechanics (3rd ed.), Ch. 10; Landau and Lifshitz, Mechanics (3rd ed.),
Sec. 49-50.

## Controls

- potential: harmonic, pendulum, quartic, and Kepler radial (the
  one orbital, non-pendulum example: V_eff = -1/r + L^2/(2 r^2)).
- energy E: the orbit size (for Kepler, the bound radial energy).
- omega0 / L: the natural frequency, or the Kepler angular momentum.
- ramp speed: 0 static, low adiabatic, high sudden; perturbs the
  parameter so the action is conserved or visibly broken on demand.
- Reset, Pause.

## Expected qualitative features

- A J(t) strip: with the ramp off or slow the action trace is flat
  on its reference (status "J conserved (adiabatic)", dJ/J ~ 1e-8);
  ramp fast and it visibly drifts (status turns to "J drifting"),
  the adiabatic theorem failing in real time. This is the explicit
  demonstration that J is the conserved quantity.
- The phase orbit and its shaded area scale with E; the readout
  `J = area/2pi`.
- Harmonic: a circle on the right, the angle marker rotating at a
  constant rate independent of E.
- Pendulum/quartic/Kepler: the period (and the marker) slow as E
  grows; the Kepler radial orbit runs between perihelion and
  aphelion (an asymmetric phase loop).

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
  Ch. 10.
- Landau and Lifshitz, Mechanics (3rd ed.), Sec. 49-50
 .

## Stretch goals

- The Hamilton-Jacobi generating function S(q, J) explicitly.
- A separatrix-crossing demo where the adiabatic invariant jumps.

## Risk register

- The action integrand is inverse-sqrt singular at the turning
  points; a `q = mid + h cos u` substitution removes it.
- The pendulum is taken in libration only (`E < 2 w0^2`); the
  rotation branch is out of scope.
