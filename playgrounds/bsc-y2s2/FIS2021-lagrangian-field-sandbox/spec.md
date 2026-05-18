---
title: Lagrangian Sandbox
slug: lagrangian-field-sandbox
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Watch the energy readout sit still to six figures while a double pendulum thrashes chaotically: Noether, made visible.'
one_paragraph: 'A sandbox of canonical analytical-mechanics systems (simple pendulum, double pendulum, elastic pendulum, Kepler orbit) whose Euler-Lagrange equations are derived in closed form from L = T - V and integrated by the verified shared RK4 engine. The left panel animates the mechanism, the right is the phase portrait (q, q-dot), and the readouts are the conserved quantities Noether predicts: the Hamiltonian (no explicit time dependence) and the angular momentum where the potential is rotationally symmetric (Kepler and the gravity-free spring, but not the gravity-loaded pendulum). The headless sim.js is gate-tested for the small-amplitude pendulum period, the Euler-Lagrange right-hand side, energy conservation for every system, the symmetry/conservation correspondence, the double-pendulum normal modes, time-reversibility and the libration/rotation separatrix.'
tags: [mechanics, lagrangian, dynamics, multi-panel, live-readout]
difficulty: 4
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 7
curriculum_year: 'L:F-2Y-2S'
primary_uc: FIS2021
share_state_keys: []
---

# Lagrangian Sandbox

## Explainer

### What you are looking at

Every one of these mechanisms (pendulum, double pendulum, spring
pendulum, cart-pole) is derived from the same single recipe: write
the kinetic minus potential energy, turn one crank, integrate. The
playground is a sandbox that does exactly that for several systems so
you see one method generate them all, including the chaotic ones.

### The Lagrangian recipe

Pick generalized coordinates $q_i$ (angles, lengths, whatever is
convenient). Form the Lagrangian

$$L(\mathbf q,\dot{\mathbf q}) = T - V$$

(kinetic minus potential energy), then the equations of motion are
the Euler-Lagrange equations, one per coordinate:

$$\frac{d}{dt}\frac{\partial L}{\partial\dot q_i}
  - \frac{\partial L}{\partial q_i} = 0.$$

No free-body diagrams, no constraint forces (the rod tension, the
track normal force never appear): the constraints are built into the
choice of coordinates. The same three lines produce the simple
pendulum, the double pendulum, the elastic pendulum and the planar
cart-pole; only $T$ and $V$ change.

### What it reveals

- Conserved quantities follow from symmetries of $L$ (Noether):
  energy from time-independence, momentum from ignorable
  coordinates.
- Coupled, nonlinear systems like the double pendulum come out
  automatically, and they are chaotic: two nearly identical starts
  diverge exponentially (sensitive dependence), which the sandbox
  shows by running twin trajectories.
- The integrator must be symplectic to keep the energy from drifting
  over long runs, the practical reason analytical mechanics and
  geometric integration go together.

The playground integrates the chosen system, draws the mechanism and
its phase portrait/energy, and lets you compare a regular system
(simple/elastic pendulum at low energy) with a chaotic one (double
pendulum), all from the one Euler-Lagrange engine.

### Things to try

- Run the simple pendulum and watch energy stay flat (symplectic
  integration, time-translation symmetry).
- Switch to the double pendulum and launch two near-identical
  starts; watch them track then diverge (chaos).
- Try the elastic pendulum and see energy slosh between the spring
  and swing modes (internal resonance).

### Where this comes from

The Lagrangian formulation, the Euler-Lagrange equations and these
canonical systems follow Lemos, *Analytical Mechanics*, Chapters 2
and 3, and Taylor, *Classical Mechanics*, Chapters 7 and 11.

## Physical setup

One of: simple pendulum `[th, thd]`; double pendulum
`[t1, t2, w1, w2]`; elastic pendulum `[r, th, rd, thd]`; planar
Kepler `[x, y, vx, vy]`. Parameters: gravity `g`, initial amplitude.

## Governing equations

Euler-Lagrange `d/dt(dL/dq-dot) - dL/dq = 0`. Pendulum
`thdd = -(g/l) sin th`; the double pendulum the standard coupled
pair; elastic pendulum `rdd = r thd^2 - (k/m)(r-l0) + g cos th`,
`thdd = (-g sin th - 2 rd thd)/r`; Kepler `r-ddot = -mu r/|r|^3`.
Energy `H = T + V`; angular momentum `L = x vy - y vx` (Kepler) or
`r^2 thd` (spring), conserved iff the potential is rotationally
symmetric. The drawn level set is, for the pendulum,
`thd = +-sqrt(2(E0 + m g l cos th)/(m l^2))`, and for Kepler radial
motion `r-dot^2 = 2(E0 + mu/r - L0^2/(2 r^2))` with turning points at
peri- and apoapsis.

## Numerical method

Classical RK4 from the shared `ode-rk` engine (gate-tested
separately); fixed `dt = 1/240` with an accumulator. Deterministic
from the initial conditions, no RNG. Reference: Goldstein, Poole and
Safko, Classical Mechanics (3rd ed.), Ch. 1-3 (`goldstein-mech`);
Landau and Lifshitz, Mechanics (3rd ed.), Sec. 1-7
(`landau-mechanics`).

## Controls

- system: pendulum, double, elastic, Kepler.
- gravity g: the field strength. For Kepler it sets the gravitational
  parameter `mu = g/9.81`; the planet is launched at a fixed fraction
  of the local circular speed so the orbit shape is fixed by
  amplitude and gravity changes only the period (Kepler's third law),
  which keeps the ellipse bound and in the panel for every `g`.
- amplitude: the initial displacement / orbit eccentricity.
- speed: time scaling.
- Reset, Pause.

## Expected qualitative features

- Two named panels: configuration space `q(t)` (the body in real
  space) and phase space `(q, q-dot)`; the on-canvas line states the
  point of having both.
- Pendulum: small swings are near-harmonic; large ones slow at the
  top; above the separatrix it rotates (the phase loop opens).
- Double pendulum: chaotic thrashing, yet `H` barely moves.
- Elastic pendulum: a beating exchange between swing and stretch.
- Kepler: a closed ellipse with the Sun drawn at the focus and the
  true Cartesian orbit traced; raising gravity shortens the period
  without changing the orbit's shape (Kepler III); the radial phase
  point rides the effective-potential contour between peri- and
  apoapsis.
- For the one-degree-of-freedom systems (pendulum, Kepler radial
  motion) the exact conserved-energy level set `H = E0` is drawn as a
  dashed gold curve; the trajectory never leaves it, which is
  Noether's theorem made geometric.
- The `dH/H` readout stays near zero throughout.

## Invariants and acceptance thresholds

- Small-amplitude pendulum period `= 2 pi sqrt(l/g)` (0.5%).
- Pendulum Euler-Lagrange `thdd = -(g/l) sin th` exact.
- Energy conserved by RK4 for every system (`|dH/H| < 1e-3`).
- Angular momentum conserved for Kepler and the `g=0` spring
  (1e-4), and NOT conserved once gravity breaks the symmetry.
- Double-pendulum modes `omega^2 = (2 -+ sqrt2) g/L`.
- Forward then backward RK4 recovers the state (1e-6).
- Libration below / rotation above the separatrix.
- Deterministic from identical initial conditions.

## Limiting cases for verification

- Small angle: simple-harmonic period, elliptic phase loop.
- `g = 0` spring: a central oscillator, `L` conserved.
- High energy pendulum: pure rotation, `thd` never reverses.

## Visual fallback

Static frame: the mechanism and the phase trajectory at the captured
time.

## Citations

- Goldstein, Poole and Safko, Classical Mechanics (3rd ed.),
  Ch. 1-3 (`goldstein-mech`).
- Landau and Lifshitz, Mechanics (3rd ed.), Sec. 1-7
  (`landau-mechanics`).

## Stretch goals

- A user-drawn chain of pendula (n-link) with the same engine.
- Explicit Noether-current readout for an arbitrary symmetry.

## Risk register

- The double pendulum is chaotic; RK4 conserves energy well but
  trajectories diverge, which is the physics, not a bug.
- Angular momentum is shown as `-` for systems where rotation is
  not a symmetry, rather than a misleading near-constant.
