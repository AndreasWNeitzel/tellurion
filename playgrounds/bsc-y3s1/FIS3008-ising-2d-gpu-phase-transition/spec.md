---
title: The 2D Ising Phase Transition
slug: ising-2d-gpu-phase-transition
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Cool a lattice of spins through the Onsager temperature and watch a disordered fizz lock into magnetic domains, the order parameter rising as the exact m = [1 - sinh^{-4}(2J/T)]^{1/8}.'
one_paragraph: 'A square lattice of two-state spins interacts through the Ising energy H = -J sum_<ij> s_i s_j, favouring neighbours that point the same way; thermal fluctuations are applied with the Metropolis rule at temperature T. This is the simplest model with a true phase transition. Above the Onsager critical temperature Tc = 2J / ln(1 + sqrt(2)) the lattice is paramagnetic with no net magnetization; below it the up-down symmetry breaks spontaneously and ordered domains grow, the magnetization following Onsager''s exact curve with critical exponent beta = 1/8. The live lattice is shown beside that exact m(T) curve with the current operating point and a trail of measured samples; the magnetic susceptibility, read from the size of the magnetization fluctuations, diverges at Tc and the dynamics critically slow down there as domains of every size appear. Drag the temperature through Tc to watch the order emerge. Reference: Onsager 1944; Yeomans, Statistical Mechanics of Phase Transitions.'
tags: [statistical-mechanics, monte-carlo, phase-transition, lattice, live-readout]
difficulty: 4
tier: hero
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 7
curriculum_year: 'L:F-3Y-1S'
primary_uc: FIS3008
primary_citation: onsager1944
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
  - "Carroll, Spacetime and Geometry: An Introduction to General Relativity."
---

# The 2D Ising Phase Transition

## Explainer

### What you are looking at

A grid of magnetic spins, each up or down, each preferring to match its
neighbors. Cool it and the whole sheet spontaneously magnetizes; heat
it and the order melts. The switch is razor-sharp at one critical
temperature. The 2D Ising model is the simplest system with a true
phase transition, and one of the few solved exactly.

### The model

Spins $s_i = \pm1$ on a periodic lattice with energy

$$H = -J\sum_{\langle ij\rangle} s_i s_j, \qquad J = 1,$$

(neighbors aligned lowers energy). It is simulated by Metropolis Monte
Carlo: propose a flip, compute $\Delta E = 2 s_i\sum_\text{nb} s_j$,
accept with probability $\min(1, e^{-\Delta E/T})$. A checkerboard
update order makes this exact and parallel because each sublattice
couples only to the other.

### The exact phase transition

Onsager solved this in 1944. There is a critical temperature

$$T_c = \frac{2J}{\ln(1+\sqrt2)} \approx 2.269,$$

below which the system has a spontaneous magnetization

$$m(T) = \left[1 - \sinh^{-4}(2J/T)\right]^{1/8} \quad (T < T_c),$$

and zero above. The exponent $1/8$ is exact and universal: it does not
depend on lattice details, only on dimensionality and symmetry. Near
$T_c$ the susceptibility (magnetization fluctuations) diverges and
domains appear at every size, the scale invariance that defines
criticality. The playground sweeps $T$ and shows the spin field
ordering, the magnetization curve, and the fluctuation peak at $T_c$.

### Things to try

- Cool below $T_c \approx 2.27$ and watch one spin direction take over
  (spontaneous symmetry breaking).
- Sit right at $T_c$ and watch domains of all sizes flicker, the
  critical scale invariance.
- Heat above $T_c$ and watch the magnetization vanish into thermal
  noise.

### Where this comes from

The Ising energy, Metropolis dynamics, and the exact Onsager
$T_c$ and $\beta = 1/8$ results follow Newman and Barkema, *Monte Carlo
Methods in Statistical Physics*, with the exact solution from Onsager
(1944) and Yang (1952).

## Physical setup

An L x L periodic square lattice of spins `s_i = +-1`, energy
`H = -J sum_<ij> s_i s_j` (J = 1, zero field). The control is the
temperature `T = kT/J`.

## Governing equations

Metropolis acceptance for a single flip: `dE = 2 s_i (J*nb + h)`,
accept with probability `min(1, exp(-dE/T))`. Exact 2D results
(Onsager 1944, Yang 1952): `Tc = 2J/ln(1+sqrt2) ~ 2.2692`,
`m(T) = [1 - sinh(2J/T)^{-4}]^{1/8}` for `T < Tc` (else 0), so the
order-parameter exponent is `beta = 1/8`. Susceptibility from
fluctuations: `chi = N (<M^2> - <|M|>^2)/T`.

## Numerical method

Checkerboard single-spin Metropolis: all `(x+y)` even sites then all
odd, exact for the nearest-neighbour Ising coupling because a
sublattice couples only to the other. Deterministic at a fixed seed
(`mulberry32` via `rng.js`). The sweep, energy and magnetization are
the shared `lattice-mc` engine; the playground adds the running
estimators. Reference: Newman and Barkema, Monte Carlo Methods in
Statistical Physics, Ch. 3; Onsager,
Phys. Rev. 65, 117 (1944).

## Controls

- temperature T: the order/disorder knob (quenches/anneals live).
- sweeps / frame: simulation speed.
- start: hot (random) or cold (aligned) initial state.
- Reset, Pause.

## Expected qualitative features

- `T >> Tc`: salt-and-pepper, `|M| ~ 0`, `E/spin ~ 0`.
- `T -> 0`: a single ordered domain, `|M| -> 1`, `E/spin -> -2J`.
- Near `Tc`: clusters of every size, the measured point sits on the
  Onsager curve's knee, susceptibility spikes, relaxation slows.
- The measured-sample trail traces out the Onsager curve as T varies.

## Invariants and acceptance thresholds

- Onsager `Tc` within 0.5 percent and exact to 1e-9.
- `M -> +-1` as `T -> 0` (`|M| > 0.95` at T = 1), `E/spin -> -2J`.
- Disordered at high T (`|M| < 0.12` at T = 6).
- Susceptibility peaks near `Tc` (`chi(Tc) > 3 chi` off-critical).
- Measured `|M|` below `Tc` tracks Onsager within 0.08-0.10.
- Magnetization exponent `beta = 1/8` (5e-3).
- Engine suite (tests/engines/lattice-mc): saturation, hot disorder,
  ferromagnetic phase vs Onsager, ergodicity, determinism, snapshot.

## Limiting cases for verification

- `T -> 0`: ground state, `|M| = 1`, `E/spin = -2J`.
- `T -> infinity`: random spins, `|M| -> 0`, `E/spin -> 0`.
- `T < Tc`: `|M|` matches the exact Onsager-Yang magnetization.

## Visual fallback

Static frame: the lattice at the captured temperature beside the
Onsager curve and the measured operating point.

## Citations

- Onsager, Phys. Rev. 65, 117 (1944).
- Newman and Barkema, Monte Carlo Methods in Statistical Physics,
  Ch. 3.

## Stretch goals

- Wolff cluster updates to beat critical slowing down.
- Binder cumulant crossing for a finite-size `Tc` estimate.

## Risk register

- Critical slowing down means single-spin dynamics relax slowly near
  `Tc`; the capture thermalizes 700 sweeps per frame and the live
  view is honest about the sluggishness (it is the physics).
- A 512^2 GPU lattice is out of scope under the Canvas2D stack rule;
  144^2 sustains 60 fps and shows the same universal behaviour.
