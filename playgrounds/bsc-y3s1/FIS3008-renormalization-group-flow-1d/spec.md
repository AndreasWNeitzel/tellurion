---
title: 1D Ising Renormalization-Group Flow
slug: renormalization-group-flow-1d
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Decimate every other spin and watch the couplings flow: every trajectory drains into the disordered sink, the exact statement that the 1D Ising chain has no phase transition.'
one_paragraph: 'Exact real-space decimation renormalization group for the 1D Ising chain in a field. Removing every other spin (rescale b = 2) renormalizes the couplings exactly: K'' = 1/4 ln[cosh(2K+h)cosh(2K-h)/cosh^2 h], h'' = h + 1/2 ln[cosh(2K+h)/cosh(2K-h)], with K = beta J, h = beta H. The scene is the flow field in the (u = tanh K, h) plane (so K = 0 is the left edge, K to infinity the right), the stable disordered sink at the origin, the unstable zero-temperature point at u = 1, and a traced trajectory from a draggable start; a second view is the zero-field map K'' = 1/2 ln cosh 2K iterating to zero as a cobweb. Every flow runs to K = 0: no finite-temperature fixed point, hence no transition in 1D, the only critical point being the unstable T = 0 one. Summing the per-step free-energy constants reconstructs the exact transfer-matrix free energy. The headless sim.js is gate-tested for the zero-field recursion, agreement with the brute-force decimation sum, the fixed-point structure, flow to disorder, the correlation-length halving and the exact free-energy reconstruction.'
tags: [statistical-mechanics, renormalization-group, phase-transition, flow, live-readout]
difficulty: 4
tier: advanced
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 6
curriculum_year: 'L:F-3Y-1S'
primary_uc: FIS3008
share_state_keys: []
---

# 1D Ising Renormalization-Group Flow

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
Ch. 9 (`goldenfeld`); Nelson and Fisher, Ann. Phys. 91, 226 (1975)
(`nelson-fisher1975`).

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
  (`goldenfeld`).
- Nelson and Fisher, Ann. Phys. 91, 226 (1975) (`nelson-fisher1975`).

## Stretch goals

- 2D Migdal-Kadanoff approximate RG showing a true finite-T fixed
  point, for contrast.
- The scaling-field linearization and the (trivial) 1D exponents.

## Risk register

- `cosh` overflows at large `K`; a stable `ln cosh` keeps the map
  exact out to `K ~ 100`.
- The field does not vanish under the flow; the free-energy tail
  uses the exact decoupled value `ln(2 cosh h)`, not `ln 2`.
