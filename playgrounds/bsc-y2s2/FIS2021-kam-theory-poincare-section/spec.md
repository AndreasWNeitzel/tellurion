---
title: KAM Theory - The Standard Map
slug: kam-theory-poincare-section
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Crank K through 0.9716 and watch the last invariant curve, the golden torus, dissolve as the chaotic sea breaks across the cylinder.'
one_paragraph: 'The Chirikov standard map p -> p + K sin theta, theta -> theta + p is the canonical model of the KAM transition. It is an exact area-preserving twist map (Jacobian determinant identically 1), so the Poincare section is a faithful Hamiltonian snapshot. At K = 0 the action p is conserved (horizontal tori); as K grows KAM tori break, rational ones first as island chains, and the last golden-mean torus is destroyed at Greene K_c ~ 0.9716, above which p diffuses globally. The scene iterates a grid of seed orbits and highlights the golden torus, reporting its width and the regime, so the KAM picture (most tori survive a small perturbation, the most-irrational one survives longest, and its destruction opens global chaos) is visible as you raise K through K_c. Reference: Lichtenberg and Lieberman, Regular and Chaotic Dynamics; Tabor, Chaos and Integrability in Nonlinear Dynamics.'
tags: [mechanics, chaos, kam, poincare, live-readout]
difficulty: 4
tier: advanced
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 6
curriculum_year: 'L:F-2Y-2S'
primary_uc: FIS2021
primary_citation: lichtenberg-lieberman
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
  - "Griffiths, Introduction to Quantum Mechanics, Third ed."
---

# KAM Theory - The Standard Map

## Explainer

### What you are looking at

When you perturb an integrable system (a clockwork of nested
invariant tori), the tori do not all dissolve at once. KAM theory
says the most irrational ones survive longest while resonant ones
shred into island chains and chaos. The playground iterates the
Chirikov standard map and you watch, in the Poincare section, order
give way to chaos as the perturbation grows.

### The standard map

The kicked-rotor stroboscopic map on the $(\theta, p)$ cylinder:

$$p_{n+1} = p_n + K\sin\theta_n,
  \qquad
  \theta_{n+1} = \theta_n + p_{n+1}\pmod{2\pi},$$

with one knob, the stochasticity parameter $K$. It is the universal
local model for a perturbed Hamiltonian near a resonance; each
plotted point is one return to the section.

### KAM and the route to global chaos

- $K=0$: integrable. $p$ is conserved, every orbit is a horizontal
  line, a smooth invariant torus.
- Small $K$: most tori merely deform and survive (the KAM theorem):
  the section is mostly smooth curves, with thin chaotic layers and
  island chains at the rational (resonant) tori, the resonances that
  KAM's small-divisor condition excludes.
- Larger $K$: tori break in order of how rational their winding
  number is. The very last barrier to survive is the torus with the
  most-irrational (golden-mean) winding number; it is destroyed at
  the critical $K_c\approx0.9716$ (Greene). Above that, no rotational
  torus spans the cylinder and chaotic orbits diffuse in $p$
  without bound (global chaos).

This is the canonical picture of the transition to Hamiltonian chaos
and underlies particle-accelerator dynamic aperture, planetary
long-term stability, and tokamak field-line confinement. The
playground seeds many orbits plus the golden torus and sweeps $K$ so
you see the islands, the breakup order, and the last-torus threshold.

### Things to try

- Set $K=0$ then small: watch smooth curves with islands appear at
  resonances while most tori survive (KAM).
- Push $K$ toward $\sim0.97$ and watch the golden-mean torus, the
  last barrier, finally break and chaos connect across the cylinder.
- Above $K_c$ follow one chaotic orbit and watch $p$ diffuse with no
  bound (global stochasticity).

### Where this comes from

The standard map, the KAM theorem and the last-torus / Greene
threshold follow Lichtenberg and Lieberman, *Regular and Chaotic
Dynamics*, and Strogatz, *Nonlinear Dynamics and Chaos*, Chapter 12.

## Physical setup

The standard map on the (theta, p) torus, stochasticity parameter
`K`, seeded from a grid of orbits plus the golden-mean torus.

## Governing equations

`p' = p + K sin theta (mod 2 pi)`, `theta' = theta + p' (mod 2 pi)`.
Jacobian `det = (1 + K cos theta) - K cos theta = 1`. Inverse
`theta = theta' - p'`, `p = p' - K sin theta`. Greene critical
`K_c ~ 0.9716` for the golden torus. Quasilinear diffusion
`D ~ K^2/2` (with Rechester-White Bessel corrections).

## Numerical method

Direct iteration of the exact map; the Poincare section is the
plotted point cloud; the golden-torus orbit `p0 = 2 pi phi` is
overlaid. Deterministic (fixed seed grid, no RNG). Reference:
Lichtenberg and Lieberman, Regular and Chaotic Dynamics (2nd ed.),
Ch. 4; Goldstein, Poole and Safko,
Classical Mechanics (3rd ed.), Ch. 11.

## Controls

- stochasticity K: the order-to-chaos knob.
- orbits: number of seed tori.
- iterations: points per orbit.
- Reset.

## Expected qualitative features

- K = 0: perfectly horizontal lines (conserved p).
- K small: gently wavy KAM curves with thin island chains.
- K near K_c: the golden torus is the last clean curve; it breaks.
- K > K_c: a connected chaotic sea, surviving islands embedded.

## Invariants and acceptance thresholds

- `det J = 1` for all `(theta, K)` (1e-12).
- `K = 0`: `p` conserved, `theta` advances by `p`; spread `< 1e-9`.
- The map is exactly invertible (1e-9).
- Golden torus: `p`-spread small for `K < K_c`, `> 2 pi` (diffuses)
  for `K > K_c`.
- `(pi,0)` is an elliptic island for `0 < K < 4` (`|tr| < 2`),
  hyperbolic beyond.
- Diffusion blocked below `K_c`; grows at large `K`; quasilinear
  `D = K^2/2` exactly.
- Deterministic from the seed.

## Limiting cases for verification

- `K -> 0`: integrable, straight lines.
- `K -> K_c^-`: the golden torus is the last survivor.
- `K >> K_c`: global stochastic diffusion of `p`.

## Visual fallback

Static frame: the Poincare section at the captured `K`.

## Citations

- Lichtenberg and Lieberman, Regular and Chaotic Dynamics (2nd
  ed.), Ch. 4.
- Goldstein, Poole and Safko, Classical Mechanics (3rd ed.),
  Ch. 11.

## Stretch goals

- Greene's residue criterion computed live for the golden orbit.
- The accelerator modes and anomalous (Levy) diffusion windows.

## Risk register

- Standard-map diffusion has strong Bessel-function corrections to
  `K^2/2`; tests assert robust trends, not a fragile ratio.
- The golden torus is approximated by `p0 = 2 pi phi`; the true
  noble curve needs a continued-fraction seed (out of scope).
