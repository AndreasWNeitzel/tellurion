---
title: Single-Particle Motion: Drifts in E and B
slug: single-particle-em-drift-3d
status: verified
audience: portfolio
created: 2026-05-17
primary_uc: AST3014
supporting_ucs: []
curriculum_year: bsc-y3s1
primary_citation: chen1984
hook: 'A charged particle in E and B fields, pushed by the Boris integrator: a cyclotron helix, the universal E x B drift, grad-B and curvature drifts, and a magnetic mirror that reflects it while conserving the adiabatic invariant. The speed is constant to 1e-9 in a pure B field.'
one_paragraph: 'A single charged particle moves in static electric and magnetic fields under the Lorentz force m dv/dt = q(E + v x B). The presets isolate the building blocks of plasma orbit theory: the cyclotron helix at frequency omega_c = qB/m, the E x B drift v_d = E x B / B^2 (the same for every charge and mass, so the whole plasma drifts together), the grad-B and curvature drifts that arise in non-uniform fields, and a magnetic mirror that reflects the particle while the adiabatic invariant mu = m v_perp^2 / 2B stays nearly constant. A magnetic force does no work, so the speed is conserved while the trajectory curls; the readouts track |v| and mu so you can watch what is and is not conserved. Drag to orbit the 3D trajectory. Reference: Chen, Introduction to Plasma Physics and Controlled Fusion, Chapter 2.'
tags: [plasma, charged-particle, drifts, boris-pusher, live-readout]
difficulty: 4
tier: medium
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [drift_preset, b_field, charge]
---

# Single-Particle Motion: Drifts in E and B

## Explainer

### What you are looking at

A single charged particle in electric and magnetic fields does not just
circle: its gyration center slowly drifts sideways, and a converging
field can bounce it back. These guiding-center drifts and the magnetic
mirror are how the Van Allen belts, the aurora, and magnetic-
confinement fusion work.

### The equation

Just the Lorentz force, integrated:

$$m\,\dot{\mathbf v} = q\,(\mathbf E + \mathbf v\times\mathbf B),
  \qquad \dot{\mathbf r} = \mathbf v.$$

In a uniform $\mathbf B$ alone the solution is a helix: fast circular
gyration at the cyclotron frequency $\omega_c = qB/m$ plus free
streaming along $\mathbf B$.

### Guiding-center drifts

Split the motion into the fast gyration plus a slowly moving guiding
center. Any steady transverse force $\mathbf F$, or a gradient or
curvature of $\mathbf B$, pushes that center sideways:

$$\mathbf v_{E\times B} = \frac{\mathbf E\times\mathbf B}{B^2},
  \qquad
  \mathbf v_{\nabla B}\ \propto\ \frac{\nabla B\times\mathbf B}{B^3}.$$

The $\mathbf E\times\mathbf B$ drift is charge-independent (whole
plasmas move together); the grad-B and curvature drifts separate
charges and drive ring currents. These slow drifts are why confined
plasma still leaks across field lines.

### The magnetic mirror

Where $\mathbf B$ converges, the perpendicular speed must rise to keep
the adiabatic invariant

$$\mu = \frac{m\,v_\perp^2}{2B}$$

constant. Since total kinetic energy is fixed, the parallel speed drops
and can reverse: the particle is reflected. Two such mirrors make a
magnetic bottle (and the loss cone that lets steep-pitch particles
escape, the aurora). The playground lets you switch on $\mathbf E$,
field gradients, and a mirror and watch the helix drift and bounce.

### Things to try

- Uniform $\mathbf B$ only: a clean helix.
- Add perpendicular $\mathbf E$ and watch the guiding center slide at
  $\mathbf E\times\mathbf B/B^2$.
- Switch on a converging field and watch the particle mirror back,
  with $\mu = m v_\perp^2/2B$ held constant.

### Where this comes from

The Lorentz force, guiding-center drifts, and the magnetic-mirror
adiabatic invariant follow Chen, *Introduction to Plasma Physics and
Controlled Fusion*, Chapter 2.

## Physical setup

One non-relativistic charged particle (charge `q`, mass `m`) moving
under the Lorentz force in prescribed static `E` and `B` fields. In a
uniform `B` the motion is a helix: circular gyration at the cyclotron
frequency superposed on free streaming along `B`. Adding a force or a
field gradient makes the guiding centre drift across `B`: a uniform
`E` perpendicular to `B` gives the `E x B` drift; a gradient or
curvature of `B` gives the grad-B and curvature drifts; a field that
converges along its own direction (a magnetic bottle) reflects the
particle, the magnetic-mirror effect, conserving the adiabatic
invariant `mu = m v_perp^2 / 2B`.

## Governing equations

```math
m\,\dot{\mathbf v} = q\,(\mathbf E + \mathbf v \times \mathbf B), \qquad
\dot{\mathbf r} = \mathbf v .
```

Cyclotron frequency `omega_c = |q| B / m`; gyroradius
`r_L = m v_perp / (|q| B)`. Guiding-centre drifts (Chen 1984, ch. 2):

```math
\mathbf v_{E\times B} = \frac{\mathbf E \times \mathbf B}{B^2}, \qquad
\mathbf v_{\nabla B} = \frac{m v_\perp^2}{2 q B^3}\,\mathbf B \times \nabla B, \qquad
\mu = \frac{m v_\perp^2}{2 B} = \text{const (adiabatic)}.
```

`v_{E x B}` is independent of `q` and `m`. The magnetic-mirror field
is the paraxial, divergence-free bottle
`B_z = B_0 g(z)`, `B_r = -(r/2) B_0 g'(z)` with `g = 1 + b z^2`; the
radial component is what produces the reflecting force (an axial-only
`B_z(z)` would be unphysical and would not reflect).

## Numerical method

The Boris pusher (Boris 1970): a half electric kick, a magnetic
rotation, a half electric kick, then a position drift. It is
time-reversible and conserves `|v|` exactly when `E = 0`, the property
that makes it the standard charged-particle integrator. No engine
reuse is required (a single-particle ODE, not one of the shared heavy
engines). The 3D trajectory is rendered with a fixed-view
orthographic projection in Canvas2D with a persistence-fade trail;
this is an honest, documented deviation from the backlog's "webgl2"
sketch (a deterministic Canvas2D projection is gate-robust and the
physics, not the renderer, is the point).

## Controls

- preset: cyclotron / E x B / grad-B / curvature / magnetic mirror,
  default cyclotron.
- B strength: slider `0.3` to `3.0`, default `1.0` (scales `B_0`).
- charge: select `+1` or `-1` (shows the `E x B` drift is
  charge-independent while the gyration sense flips).
- speed: steps per frame slider `1` to `8`, default `3`.
- reset, pause: buttons.
- Live monospace readouts: `|v|` (the Boris invariant in pure B),
  `mu` (the adiabatic invariant), `omega_c`, and a preset-specific
  auxiliary (drift speed / `v_parallel` / kinetic energy).
- Share-state keys: `drift_preset`, `b_field`, `charge`.

## Expected qualitative features

- Cyclotron: a clean helix along `B`; `|v|` and `mu` constant,
  `omega_c = qB/m`.
- E x B: the helix's guiding centre slides sideways at
  `E x B / B^2`, the same for `q = +1` and `q = -1`.
- grad-B: a slow cross-field drift perpendicular to both `B` and
  `grad B`.
- curvature: a drift along the symmetry direction as the particle
  follows curved field lines.
- mirror: the particle spirals into the strong-field region, slows
  its parallel motion, and reflects; `mu` is conserved.

## Invariants and acceptance thresholds

Checked offline through `sim.js` in `invariants.test.mjs` (no GPU):

- speed conservation in pure B (strong): the Boris pusher keeps
  `|v|` constant to `< 1e-9` over 20000 steps.
- cyclotron period (strong): the orbit closes at
  `T_c = 2 pi m / (|q| B)` to `< 2%`.
- E x B drift (strong): the measured guiding-centre velocity equals
  `E x B / B^2` to `< 2%`, and is identical for `q = +1` and
  `q = -1`.
- magnetic mirror (strong): the particle reflects (`v_parallel`
  changes sign), the gyro-averaged `mu` is conserved to `< 10%`
  (stroboscopic, one sample per gyroperiod), and `|v|` is conserved
  to `< 1e-9` (E = 0).
- grad-B drift (medium): a clear cross-field displacement develops
  in the predicted direction.
- determinism (medium): identical inputs reproduce the trajectory
  exactly.

Visual gate: five Playwright frames (init, 25, 50, 75, terminal) of
the deterministic cyclotron sweep, SSIM at least `0.92` vs committed
golden frames. Deterministic (no RNG; the orthographic projection and
Boris pusher are bitwise-stable).

## Limiting cases for verification

- `E = 0`, uniform `B`: exact helix, `|v|` and `mu` conserved.
- `v_parallel = 0`, uniform `B`: a closed circle (pure gyration).
- E x B: charge- and mass-independent drift.
- slowly varying mirror: `mu` adiabatically conserved, the particle
  reflects (Northrop 1963).

## Visual fallback

Pure Canvas2D over a deterministic Boris ODE: no WebGL, no RNG, so
the headless capture and SSIM gate are robust. The invariants run
GPU-free in node.

## Citations

In `docs/CITATIONS.bib`:

- Chen, Introduction to Plasma Physics and Controlled Fusion, 2nd
  ed., Plenum 1984, ch. 2 (`chen1984`), the guiding-centre drifts
  and the mirror invariant.
- Boris, Proc. 4th Conf. Num. Sim. Plasmas (1970) (`boris1970`), the
  Boris pusher.
- Northrop, The Adiabatic Motion of Charged Particles, Interscience
  1963 (`northrop1963`), the adiabatic invariant.
- Jackson, Classical Electrodynamics, 3rd ed., Wiley 1998
  (`jackson1998`), the Lorentz force.

## Stretch goals

- A true WebGL 3D mode with an orbit camera (the backlog sketch).
- Relativistic Boris (the Vay or Higuera-Cary variant).
- A loss-cone diagram for the magnetic mirror.

## Risk register

- Unphysical mirror field: an axial-only `B_z(z)` has no reflecting
  force; mitigated by the paraxial divergence-free field with the
  radial component (caught by the reflection invariant during
  development).
- Instantaneous vs adiabatic `mu`: the instantaneous `mu` oscillates
  at the gyrofrequency; the gated invariant is the stroboscopic
  gyro-averaged `mu` (Northrop), tested in a deeply adiabatic regime.
- Renderer deviation: Canvas2D projection rather than WebGL 3D, an
  honest documented choice for gate robustness; the physics is
  unaffected.

## Implementation notes

`sim.js` is self-contained (`createState`, `step` Boris, `fields`
presets, `speed`, `magneticMoment`, `vParallel`, `exbDrift`,
`gyrofrequency`); `invariants.test.mjs` imports it directly.
`playground.js` is pure Canvas2D: a fixed-view orthographic
projection with a persistence-fade trail, drawn axes, a throttled
readout, and the `?deterministic=1&capture=NAME&captureFraction=F`
capture contract.
