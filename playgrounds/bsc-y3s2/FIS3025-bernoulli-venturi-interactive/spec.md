---
title: Bernoulli and the Venturi Effect
slug: bernoulli-venturi-interactive
status: verified
audience: portfolio
created: 2026-05-17
primary_uc: FIS3025
supporting_ucs: []
curriculum_year: bsc-y3s2
primary_citation: tritton
hook: 'Narrow a pipe and the fluid speeds up; Bernoulli then forces the static pressure down exactly where the flow is fast. The piezometer columns dip at the throat, and the two conserved quantities hold to machine precision because the model is the exact algebra, not a simulation.'
one_paragraph: 'Steady incompressible flow through a variable-area pipe (a Venturi). Mass conservation fixes the volume flow Q = A(x) v(x) = const, so the fluid must speed up where the pipe narrows; Bernoulli''s relation p + 1/2 rho v^2 = const along a horizontal streamline then forces the static pressure to drop exactly where the flow is fastest, the counter-intuitive heart of the effect. The scene draws the pipe, tracer particles accelerating through the throat, piezometer columns whose heights read the local static pressure (tall in the wide sections, a stub at the throat), and a thin-airfoil lift cartoon driven by the same principle. Readouts confirm that the flux A v and the Bernoulli constant stay fixed along the pipe. Controls set the throat ratio, the flow rate and the fluid density. Reference: Faber, Fluid Dynamics for Physicists, Chapter 4; Batchelor, An Introduction to Fluid Dynamics, Chapter 3.'
tags: [fluids, bernoulli, continuity, closed-form, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [throat_ratio, flow_rate, density]
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

# Bernoulli and the Venturi Effect

## Explainer

### What you are looking at

Push fluid through a pipe that narrows. It speeds up in the throat, and
(the surprising part) the pressure there drops. That pressure drop is
why a Venturi meter measures flow, why a carburettor draws fuel, and,
in essence, why a wing lifts. The playground lets you reshape the
constriction and watch speed and pressure trade off.

### Two conservation laws

For steady, incompressible, inviscid flow in a horizontal pipe of
varying area $A(x)$:

- Continuity (mass): the volume flow rate is constant,

$$Q = A(x)\,v(x) = \text{const}
  \;\Longrightarrow\; v \propto \frac1A.$$

  Narrow the pipe and the fluid must speed up.

- Bernoulli (energy along a streamline, no gravity term for a
  horizontal pipe):

$$p + \tfrac12\rho v^2 = \text{const}.$$

### The Venturi effect

Combine them: where $A$ is smallest, $v$ is largest, so $p$ is
*lowest*. The throat is the fastest, lowest-pressure point. The
pressure difference between the wide section and the throat is

$$\Delta p = \tfrac12\rho\big(v_\text{throat}^2 - v_\text{wide}^2\big),$$

which (via continuity) depends only on the area ratio and the flow
rate, so measuring $\Delta p$ gives $Q$, the Venturi flowmeter. The
same "faster flow, lower pressure" is the textbook account of lift over
a cambered airfoil. The playground sweeps the throat area and shows the
speed rise and pressure dip in lockstep.

### Things to try

- Narrow the throat and watch the speed spike and the static pressure
  fall there (lowest $p$ at the narrowest point).
- Hold area, raise the flow rate $Q$, and watch $\Delta p$ grow as
  $Q^2$.
- Note the pressure recovers downstream where the pipe widens again
  (ideal, lossless flow).

### Where this comes from

Continuity, Bernoulli's theorem, and the Venturi pressure drop follow
the standard treatment in Feynman, *Lectures on Physics* Vol. II,
Chapter 40, and any fluid-mechanics text (e.g., Faber, *Fluid Dynamics
for Physicists*).

## Physical setup

Steady, incompressible, inviscid flow along a horizontal pipe whose
cross-sectional area `A(x)` varies (a smooth constriction, the
Venturi). Two conservation laws fix everything. Mass conservation
(continuity): the volumetric flow rate `Q = A(x) v(x)` is the same at
every station, so the fluid speeds up where the pipe narrows.
Bernoulli's theorem along a streamline (no gravity term for a
horizontal pipe): `p + 1/2 rho v^2` is constant, so the static
pressure falls exactly where the speed rises. The throat is therefore
the fastest, lowest-pressure point, the Venturi effect, and the same
principle gives the pressure difference across a cambered airfoil.

## Governing equations

```math
Q = A(x)\,v(x) = \text{const}, \qquad
p(x) + \tfrac12\,\rho\,v(x)^2 = p_0 = \text{const}.
```

Hence `v(x) = Q / A(x)` and `p(x) = p_0 - 1/2 rho v(x)^2`. The pipe
profile is a smooth cosine constriction with inlet area normalised to
1 and throat area equal to the user's ratio `r in (0, 1]`:
`A(x) = 1 - (1-r)/2 (1 + cos 2 pi (x - 1/2))`. The thin-airfoil lift
cartoon uses `Delta p = 1/2 rho (v_top^2 - v_bottom^2)` and
`L = Delta p * chord` (faster over the top gives upward lift).

## Numerical method

There is no simulation: continuity and Bernoulli are evaluated in
closed form in `sim.js`, so the conserved quantities hold to
floating-point round-off and the run is bitwise deterministic. The
Canvas2D playground samples `v(x)` and `p(x)` along the pipe, draws
the walls, advects tracer particles at the local speed (`v = Q/A`,
so they visibly accelerate through the throat), draws the piezometer
columns (height proportional to the static pressure, clamped to the
panel headroom), and the airfoil-lift inset. No engine reuse is
required (the model is algebra, not one of the shared numerical
engines).

## Controls

- throat ratio: slider `0.15` to `1.0`, default `0.40` (1.0 = no
  constriction).
- flow rate `Q`: slider `0.2` to `2.0`, default `0.7` (= inlet
  speed, since the inlet area is 1).
- density `rho`: slider `0.5` to `3.0`, default `1.2`.
- reset, pause: buttons (pause freezes the tracer advection).
- Live monospace readouts: Bernoulli-constant relative spread and
  flux `A v` relative spread (the two invariants, both ~0), the
  throat speed, and the throat static pressure.
- Share-state keys: `throat_ratio`, `flow_rate`, `density`
  (parseUrlState restore plus a Copy-URL button).

## Expected qualitative features

- The pipe is an hourglass: wide at the ends, narrow at the throat.
- Tracer particles accelerate visibly through the throat and slow in
  the wide sections (`v propto 1/A`).
- Piezometer columns are tall in the wide sections and a stub at the
  throat: static pressure is lowest where the flow is fastest.
- Increasing the constriction (smaller throat ratio) deepens the
  pressure dip and raises the throat speed; raising `Q` or `rho`
  deepens it further.
- The airfoil inset shows an upward lift arrow that grows with the
  density and the top/bottom speed difference.
- Both invariant readouts stay at ~`1e-16` (machine zero): exact
  conservation.

## Invariants and acceptance thresholds

Checked offline through `sim.js` in `invariants.test.mjs` (no GPU):

- continuity (strong): the flux `A v` is constant along the pipe to
  a relative `< 1e-3` (in practice `~1e-16`), for several throat
  ratios.
- Bernoulli (strong): `p + 1/2 rho v^2` is constant along the pipe
  to a relative `< 1e-3` (in practice `~1e-16`), for several
  `(p_0, rho, Q, ratio)`.
- Venturi ordering (strong): the throat is strictly the fastest and
  strictly the lowest-pressure station; the throat area equals the
  ratio and the inlet area equals 1.
- inverse-area law (strong): `v(x) A(x) = Q` exactly at every
  sampled station.
- airfoil lift (medium): positive when the flow is faster over the
  top, zero at equal speeds, and exactly linear in `rho`.
- determinism (medium): identical inputs reproduce identical outputs.

Visual gate: five Playwright frames (init, 25, 50, 75, terminal) of
the deterministic tracer sweep, SSIM at least `0.92` vs committed
golden frames. Deterministic (no RNG; particles seeded by index in
capture mode).

## Limiting cases for verification

- `ratio -> 1`: uniform pipe, `v` constant, all columns equal, no
  pressure dip.
- `Q -> 0`: `v -> 0`, `p -> p_0` everywhere (stagnation).
- throat `ratio -> 0`: `v_throat -> infinity`, `p_throat ->
  -infinity` (the inviscid idealisation; the readout shows it).
- equal top/bottom speed: airfoil lift exactly zero.

## Visual fallback

Pure Canvas2D over closed-form algebra: no WebGL, no solver, no RNG,
so the headless capture and SSIM gate are robust and bitwise stable.
The invariants run GPU-free in node.

## Citations

In `docs/CITATIONS.bib`:

- Tritton, Physical Fluid Dynamics, 2nd ed., OUP 1988, ch. 5
  (`tritton`), Bernoulli's theorem and the Venturi.
- Batchelor, An Introduction to Fluid Dynamics, CUP 1967, sec. 3.5
  (`batchelor1967`), Bernoulli's theorem for steady inviscid flow.

## Stretch goals

- A real streamtube rendering with width proportional to `1/v`.
- A manometer-difference readout and a calibrated Venturi flow-meter
  mode (`Q` from the measured pressure drop).
- Compressible (subsonic) correction at high speed.

## Risk register

- Over-claiming a simulation: avoided. The model is exact algebra and
  the spec says so; the invariants are conservation identities, not
  numerical tolerances.
- Inviscid idealisation: at extreme constriction `p_throat` goes
  negative (cavitation in reality); shown honestly via the readout,
  not hidden.
- Engagement: a static diagram would be dull; mitigated by the
  accelerating tracer particles, the live columns, and the airfoil
  inset, all driven by the controls.

## Implementation notes

`sim.js` is self-contained closed-form physics (`pipeArea`,
`velocity`, `pressure`, `bernoulliConstant`, `diagnostics`,
`airfoilLift`); `invariants.test.mjs` imports it directly.
`playground.js` is pure Canvas2D: the pipe, index-seeded tracer
particles (deterministic in capture), the piezometer columns, the
airfoil inset, a throttled readout, and the
`?deterministic=1&capture=NAME&captureFraction=F` capture contract.
