---
title: 1D Ising Renormalization-Group Flow
slug: renormalization-group-flow-1d
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Decimate every other spin and watch the couplings flow: every trajectory drains into the disordered sink, the exact statement that the 1D Ising chain has no phase transition.'
one_paragraph: 'Exact real-space decimation renormalization group for the 1D Ising chain in a field. Removing every other spin (rescale b = 2) renormalizes the couplings exactly: K'' = 1/4 ln[cosh(2K+h)cosh(2K-h)/cosh^2 h], h'' = h + 1/2 ln[cosh(2K+h)/cosh(2K-h)], with K = beta J, h = beta H. The scene is the flow field in the (u = tanh K, h) plane (so K = 0 is the left edge, K to infinity the right), the stable disordered sink at the origin, the unstable zero-temperature point at u = 1, and a traced trajectory from a draggable start; a second view is the zero-field map K'' = 1/2 ln cosh 2K iterating to zero as a cobweb. Every flow runs to K = 0: no finite-temperature fixed point, hence no transition in 1D, the only critical point being the unstable T = 0 one. Summing the per-step free-energy constants reconstructs the exact free energy, so the renormalization-group picture and the transfer-matrix solution agree. Reference: Kardar, Statistical Physics of Fields, Chapter 4; Goldenfeld, Lectures on Phase Transitions and the Renormalization Group.'
tags: [statistical-mechanics, renormalization-group, phase-transition, flow, live-readout]
difficulty: 4
tier: advanced
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 6
curriculum_year: 'L:F-3Y-1S'
primary_uc: FIS3008
primary_citation: goldenfeld
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

# 1D Ising Renormalization-Group Flow

## Explainer

### What you are looking at

Take an Ising chain, then squint: average out every other spin and ask
what coupling the remaining spins effectively have. Repeat. Where the
coupling flows under this zooming-out is the renormalization group, the
idea that earned a Nobel Prize and explains why utterly different
systems share the same critical behavior.

### Decimation

For the 1D Ising chain with reduced couplings $K = \beta J$,
$h = \beta H$, sum out every other spin exactly. The remaining spins
obey the same form but with renormalized couplings:

$$K' = \tfrac14\ln\!\frac{\cosh(2K+h)\cosh(2K-h)}{\cosh^2 h},$$

$$h' = h + \tfrac12\ln\!\frac{\cosh(2K+h)}{\cosh(2K-h)},$$

plus a constant that accumulates the free energy. At zero field this
collapses to the clean recursion $K' = \tfrac12\ln\cosh 2K$.

### Reading the RG flow

Iterate the map and watch where $(K, h)$ goes. Its fixed points and the
flow between them are the whole story:

- $K^* = 0$ (infinite temperature): a stable fixed point. Every finite
  $K$ flows to it.
- $K^* = \infty$ (zero temperature): the only other fixed point.

Because the only stable fixed point at finite temperature is the
disordered one, the 1D Ising chain has no phase transition at any
$T > 0$, exactly the known exact result, now seen as a property of the
RG flow rather than computed by hand. In two or more dimensions a new,
unstable fixed point appears at finite $K$: that critical fixed point,
and the way the flow is repelled from it, is what produces a phase
transition and universal critical exponents. The playground iterates
the decimation and shows the coupling flowing to its fixed point.

### Things to try

- Start at any finite $K$ and watch it flow to $K^* = 0$: no order
  survives coarse-graining, hence no transition in 1D.
- Add a field $h$ and watch it grow under the flow (the field is a
  relevant perturbation).
- Note the free energy assembling from the constants shed at each
  decimation step.

### Where this comes from

The exact 1D Ising decimation recursion and the RG-flow / fixed-point
picture follow Kardar, *Statistical Physics of Fields*, and Goldenfeld,
*Lectures on Phase Transitions and the Renormalization Group*.

## Physical setup

The 1D Ising chain `H = -J sum s_i s_{i+1} - H sum s_i`, reduced
couplings `K = beta J`, `h = beta H`. Coarse-grain by summing out
every other spin (decimation, rescale factor `b = 2`).

## Governing equations

Exact decimation recursion:
`K' = 1/4 ln[cosh(2K+h) cosh(2K-h) / cosh^2 h]`,
`h' = h + 1/2 ln[cosh(2K+h) / cosh(2K-h)]`,
per-spin free-energy constant
`lnC = ln2 + 1/4 ln[cosh(2K+h) cosh(2K-h)] + 1/2 ln cosh h`,
so `phi(K,h) = 1/2 lnC + 1/2 phi(K',h')`. Zero field reduces to
`K' = 1/2 ln cosh 2K`. Exact transfer-matrix free energy:
`phi = K + ln[cosh h + sqrt(sinh^2 h + e^{-4K})]`.

## Numerical method

Direct iteration of the closed-form map (no approximation); a
numerically stable `ln cosh`. Free energy reconstructed by summing
`(1/2)^{n+1} lnC` along the flow, terminating at the decoupled
`(K=0, h)` sink where the remainder is exactly `ln(2 cosh h)`.
Reference: Goldenfeld, Lectures on Phase Transitions and the RG,
Ch. 9; Nelson and Fisher, Ann. Phys. 91, 226 (1975).

## Controls

- start K, start h: the initial couplings (also drag in the plane).
- RG steps: how many decimations to trace.
- view: the flow plane, the spin-chain decimation cascade, or the
  zero-field cobweb.
- Reset.

## Expected qualitative features

- Chain decimation view: a stack of representative seeded spin
  chains, one per RG level. Each step halves the chain and
  renormalizes K by the exact recursion (sim.js); a high start K
  begins with long correlated domains and disorders down the
  cascade, a low start K is disordered from the top. Either way the
  bottom is a random (disordered-sink) chain, the concrete statement
  that 1D Ising has no finite-T order.
- Every trajectory flows left to the `K = 0` sink: no finite-T
  transition (the headline 1D result).
- `h = 0` is an invariant line; the unstable point sits at `u = 1`
  (`T = 0`), the only critical point.
- The cobweb staircases monotonically down to `K* = 0`.
- `f RG` and `f exact` agree to the displayed precision.

## Invariants and acceptance thresholds

- Zero-field recursion `K' = 1/2 ln cosh 2K`, `h` stays 0 (1e-12).
- Recursion matches the brute-force decimation sum (1e-10).
- `(0,0)` is a fixed point; the sink is super-stable.
- `K -> 0` for every start; with a field `h` converges to a finite
  residual (decoupled paramagnet), `h -> 0` only at `h0 = 0`.
- Zero-temperature point: `K' = K - ln2/2` (unstable), `h' ~ 2h`
  (field relevant) for large `K`.
- Correlation length halves under one decimation (`b = 2`, 5e-3).
- RG-reconstructed free energy equals the exact transfer matrix
  (1e-9).

## Limiting cases for verification

- `h = 0`: the flow stays on `h = 0`, `K -> 0`.
- `K -> infinity`: `K' ~ K - ln2/2`, `h' ~ 2h` (the T = 0 fixed
  point, both directions away from it).
- Free energy: RG sum equals `K + ln[cosh h + sqrt(sinh^2 h +
  e^{-4K})]` everywhere.

## Visual fallback

Static frame: the flow field with the trajectory traced for the
captured number of steps, or the cobweb staircase.

## Citations

- Goldenfeld, Lectures on Phase Transitions and the RG, Ch. 9
 .
- Nelson and Fisher, Ann. Phys. 91, 226 (1975).

## Stretch goals

- 2D Migdal-Kadanoff approximate RG showing a true finite-T fixed
  point, for contrast.
- The scaling-field linearization and the (trivial) 1D exponents.

## Risk register

- `cosh` overflows at large `K`; a stable `ln cosh` keeps the map
  exact out to `K ~ 100`.
- The field does not vanish under the flow; the free-energy tail
  uses the exact decoupled value `ln(2 cosh h)`, not `ln 2`.
