---
title: 2D Point-Vortex Dynamics
slug: vortex-dynamics-2d
status: verified
audience: portfolio
created: 2026-05-17
primary_uc: FIS3025
supporting_ucs: []
curriculum_year: bsc-y3s2
primary_citation: saffman1992
hook: 'Ideal point vortices advect one another through the flow each induces. A plus/minus pair shoots off in a straight line at exactly Gamma/2 pi d; three or more give Aref''s integrable-to-chaotic vortex motion, all with the Hamiltonian conserved to better than 0.1%.'
one_paragraph: 'An interactive 2D point-vortex system: N ideal vortices of fixed circulation, each advected by the Biot-Savart velocity the others induce. It is a Hamiltonian system (Saffman; Aref) with conserved total circulation, linear and angular impulse, and Kirchhoff-Routh Hamiltonian. The Canvas2D scene shows the vortices (warm = positive, cool = negative circulation) and tracer particles that ride the induced flow as persistent streaklines, so the dipole''s travelling recirculation, the co-rotating pair''s orbit, and the multi-vortex chaos are directly visible. Presets give a translating dipole (which moves at exactly v = Gamma/2 pi d), a co-rotating equal pair, a tripole and a quadrupole. The headline readout is the relative drift of the Hamiltonian, held under 1e-3 by an RK4 integrator; circulation and impulse are conserved to round-off / integrator precision. Physics is the gate-tested shared sim.js; deterministic.'
tags: [fluids, vortex, hamiltonian, conserved-invariants, live-readout]
difficulty: 4
tier: medium
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 5
share_state_keys: [vortex_preset, strength]
---

# 2D Point-Vortex Dynamics

## Explainer

### What you are looking at

Idealize a 2D fluid's swirl into a handful of point vortices, each a
pure spin of fixed strength. They do not spin themselves; each is
carried by the flow of all the others. Two opposite vortices shoot off
in a straight line (a smoke ring's cross-section); a pile of like
vortices waltzes; four or more go chaotic.

### The equations of motion

Each vortex $a$ has circulation $\Gamma_a$ and position
$\mathbf r_a$. The velocity it feels is the 2D Biot-Savart sum of all
the others (never itself):

$$\dot{\mathbf r}_a = \sum_{b\ne a}
  \frac{\Gamma_b}{2\pi}\,
  \frac{\hat z\times(\mathbf r_a - \mathbf r_b)}
  {|\mathbf r_a - \mathbf r_b|^2}.$$

Remarkably this is a Hamiltonian system: the conjugate "coordinates"
are the vortex positions themselves, weighted by circulation, and the
Hamiltonian is the interaction energy
$H = -\tfrac{1}{4\pi}\sum_{a<b}\Gamma_a\Gamma_b\ln|\mathbf r_a-
\mathbf r_b|$.

### Integrable, then chaotic

Because it is Hamiltonian with conserved total circulation, linear
impulse, and angular impulse, the dynamics is integrable for
$N\le3$ vortices and generically chaotic for $N\ge4$ (Aref). Two
clean cases the playground showcases:

- A vortex dipole (equal and opposite $\Gamma$) self-propels in a
  straight line at constant speed, exactly the way a vortex ring
  translates.
- A co-rotating pair (equal same-sign $\Gamma$) orbits its centroid at
  fixed radius.

Add a fourth vortex and the trajectories become sensitively dependent
and tangle, deterministic chaos in an ideal fluid. The playground lets
you place vortices and watch dipoles cruise, pairs orbit, and the
four-vortex tangle.

### Things to try

- Make a $+\Gamma/-\Gamma$ dipole and watch it translate in a straight
  line (the vortex-ring mechanism).
- Make two same-sign vortices and watch them orbit their midpoint.
- Add a fourth vortex and watch the motion go chaotic (Aref).

### Where this comes from

The point-vortex Biot-Savart dynamics, its Hamiltonian structure, and
the integrable/chaotic boundary follow Aref (1983) and Saffman,
*Vortex Dynamics*.

## Physical setup

`N` ideal point vortices in an unbounded 2D inviscid fluid. Vortex
`a` has a fixed circulation `Gamma_a` and position `r_a(t)`. Each
vortex is passively advected by the velocity field induced by all the
others (a vortex does not advect itself). The induced velocity at a
point `p` is the 2D Biot-Savart sum. The resulting motion is
Hamiltonian: for `N <= 3` it is integrable, for `N >= 4` generally
chaotic (Aref). A vortex pair of equal and opposite circulation is a
dipole that translates in a straight line; an equal co-rotating pair
orbits its centroid.

## Governing equations

```math
\dot{\mathbf r}_b = \sum_{a \ne b} \frac{\Gamma_a}{2\pi}\,
  \frac{\hat z \times (\mathbf r_b - \mathbf r_a)}{|\mathbf r_b - \mathbf r_a|^2},
\qquad
H = -\frac{1}{4\pi}\sum_{a<b}\Gamma_a\Gamma_b\,\ln|\mathbf r_a - \mathbf r_b| .
```

Conserved quantities: total circulation `sum Gamma_a`; linear impulse
`P = sum Gamma_a r_a`; angular impulse `L = sum Gamma_a |r_a|^2`; and
the Kirchhoff-Routh Hamiltonian `H` (Saffman 1992; Aref 1983;
Batchelor sec. 7.3). The translating dipole (circulations `+Gamma`,
`-Gamma`, separation `d`) moves at the exact analytic speed

```math
v = \frac{\Gamma}{2\pi d}.
```

A small core radius `(|r|^2 + 1e-6)` desingularises the kernel near
close approaches without affecting well-separated configurations.

## Numerical method

Classical RK4 on the first-order system above (the point-vortex
equations are first order in position). RK4 with a small step keeps
`H` to ~0.1% over a long run; circulation is conserved exactly (the
strengths are constants), and linear and angular impulse are
conserved to integrator precision. No engine reuse is required (a
few-body O(N^2) Biot-Savart ODE, not one of the shared heavy
engines). Rendering uses a persistence fade so tracer dots accumulate
into streaklines that reveal the induced flow, then decay.

## Controls

- configuration: select dipole / co-rotating pair / tripole /
  quadrupole, default dipole.
- strength: circulation multiplier slider `0.2` to `2.5`, default
  `1.0` (scales every `Gamma_a`).
- speed: time steps per frame slider `1` to `8`, default `3`.
- reset, pause: buttons (pause freezes the motion).
- Live monospace readouts: `H` relative drift (the headline), total
  circulation, linear-impulse magnitude, angular impulse.
- Share-state keys: `vortex_preset`, `strength` (parseUrlState
  restore plus a Copy-URL button).

## Expected qualitative features

- Dipole: the `+/-` pair travels in a straight line at constant
  speed, carrying a closed recirculation bubble of tracers; the
  separation stays constant.
- Co-rotating pair: two equal vortices orbit their common centroid at
  fixed separation (rigid rotation).
- Tripole: bounded, quasi-periodic three-vortex motion (integrable).
- Quadrupole: richer, sensitive multi-vortex motion (chaotic for
  generic data).
- Tracer streaklines spiral around each vortex with the sign of its
  circulation and are swept by the collective flow.
- `H` drift readout stays at ~`1e-3` or below; total circulation and
  impulse readouts are constant.

## Invariants and acceptance thresholds

Checked offline through `sim.js` in `invariants.test.mjs` (no GPU):

- total circulation conserved exactly (strong): unchanged over 4000
  steps (the strengths are constants of motion).
- Hamiltonian conserved (strong): relative drift `< 1e-3` over 6000
  steps for the tripole.
- linear and angular impulse conserved (strong): relative change
  `< 1e-6` over 3000 steps for the quadrupole.
- dipole translation (strong): the pair moves at `v = Gamma/2 pi d`
  to `< 0.2%`, in a straight line (no transverse drift), with the
  separation preserved.
- co-rotating rigidity (strong): an equal pair keeps its separation
  to `< 0.1%` over 4000 steps (pure rotation).
- determinism (medium): identical inputs reproduce the trajectory
  exactly.

Visual gate: five Playwright frames (init, 25, 50, 75, terminal) of
the deterministic dipole sweep (index-seeded tracers; the streakline
persistence accumulated deterministically), SSIM at least `0.92` vs
committed golden frames.

## Limiting cases for verification

- single vortex: stationary (it does not advect itself).
- dipole: exact straight-line translation at `Gamma/2 pi d`.
- equal co-rotating pair: rigid rotation, constant separation.
- `Gamma -> 0`: motion freezes.

## Visual fallback

Pure Canvas2D over a deterministic RK4 ODE: no WebGL, no RNG (tracers
are index-seeded in capture), so the headless capture and SSIM gate
are robust. The invariants run GPU-free in node.

## Citations

In `docs/CITATIONS.bib`:

- Saffman, Vortex Dynamics, CUP 1992 (`saffman1992`), the
  point-vortex Hamiltonian, conserved impulse, and the pair speed.
- Aref, Annu. Rev. Fluid Mech. 15 (1983) 345 (`aref1983`),
  integrable/chaotic N-vortex motion.
- Batchelor, An Introduction to Fluid Dynamics, CUP 1967, sec. 7.3
  (`batchelor1967`), line vortices and induced velocity.

## Stretch goals

- Vortices in a half-plane (image vortices) and the wall-bounded
  dipole rebound.
- A Poincare section for the chaotic four-vortex case.
- Continuous vorticity via a vortex-blob method.

## Risk register

- Close-approach singularity: mitigated by a tiny core radius; the
  gated configurations stay well separated so invariants hold.
- Integrator drift: RK4 keeps `H` to ~0.1%; reported honestly via the
  live drift readout, not hidden.
- Engagement: a few moving dots would be dull; mitigated by the
  persistent tracer streaklines that paint the induced flow and the
  four distinct preset behaviours.

## Implementation notes

`sim.js` is self-contained (`createState`, `step` RK4,
`inducedVelocity`, `totalCirculation`, `linearImpulse`,
`angularImpulse`, `hamiltonian`, `dipoleSpeed`, `preset`);
`invariants.test.mjs` imports it directly. `playground.js` is pure
Canvas2D with persistence-fade streaklines, index-seeded tracers in
capture (deterministic), a throttled readout, and the
`?deterministic=1&capture=NAME&captureFraction=F` capture contract.
