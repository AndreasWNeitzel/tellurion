---
title: Quantum Tunnelling (Hero)
description: A Crank-Nicolson wavepacket hits a barrier you can raise, lower and sculpt. Part reflects, part tunnels through; a classical ball with the same energy always bounces. Probability is conserved to round-off every step.
caption: Figure 1. Crank-Nicolson TDSE; potential terrain V(x) and the phase-coloured probability curtain |psi|^2, with a classical-ball contrast. Source: Griffiths, Quantum Mechanics, Ch. 2.
slug: quantum-tunnelling-barrier-3d
status: verified
audience: portfolio
created: 2026-05-19
program: EVF
course: EVF Quantum Mechanics and Technology
suite: summer-school-hero-suite
primary_uc: EVF
supporting_ucs: []
curriculum_year: hero
primary_citation: griffiths-qm
primary_chapter: 2
hook: 'A ball always bounces off a wall taller than it can climb. A quantum particle does not: watch it leak straight through.'
one_paragraph: 'A Gaussian wavepacket evolving under the time-dependent Schrodinger equation, solved by Crank-Nicolson so the total probability is conserved to round-off at every step. The terrain is the potential V(x); the luminous curtain is the probability density, coloured by the quantum phase. A classical ball with the same mean energy is launched alongside: it always reflects off a barrier taller than its energy, while the quantum packet partly tunnels through. Raise, widen and sculpt the barrier and watch the transmitted fraction change; the resonant double barrier transmits almost perfectly at special energies.'
tags: [quantum, animation, live-readout, webgl2, hero]
difficulty: 5
tier: single
hero_candidate: true
renderer: webgl2
estimated_engagement_minutes: 7
share_state_keys: [V0, bw, k0]
---

# Quantum Tunnelling

## Explainer

### What you are seeing and why it matters

A classical ball that does not have enough energy to get over a hill
rolls back, every time. A quantum particle is a wave, and a wave does
not stop dead at a wall; a little of it leaks out the far side. So a
particle facing a barrier it could never climb classically still has a
real chance of being found beyond it. That is quantum tunnelling, and
it is not exotic trivia: it is how the Sun fuses hydrogen, how alpha
decay happens, how a scanning tunnelling microscope images atoms, and
how flash memory is written. The curtain you see is the probability of
finding the particle at each point; watch it split at the barrier into
a reflected part and a transmitted part while the classical ball just
bounces.

### Try this

- "thin barrier": a tall but thin wall still leaks a visible packet
  through. Now switch to "thick barrier": the same height, wider,
  transmits almost nothing.
- Lower "barrier V0" below the packet energy: it sails over (mostly
  transmits) like a classical particle would.
- "resonant double": at the right energy the double barrier transmits
  near-perfectly (resonant tunnelling, the basis of the tunnel diode).
- Hold Shift and drag on the scene to sculpt the terrain yourself.

### The equation (collapsible)

$$i\,\frac{\partial\psi}{\partial t}
  =-\tfrac12\frac{\partial^2\psi}{\partial x^2}+V(x)\,\psi
  \quad(\hbar=m=1).$$

Crank-Nicolson: $(1+\tfrac{i\,dt}{2}H)\psi^{n+1}
=(1-\tfrac{i\,dt}{2}H)\psi^n$, which is unitary, so
$\int|\psi|^2dx$ is conserved. Rectangular-barrier transmission
$T(E)=\big[1+\frac{V_0^2\sinh^2(\kappa a)}{4E(V_0-E)}\big]^{-1}$,
$\kappa=\sqrt{2(V_0-E)}$.

## Physical setup

A wavepacket of mean wavenumber $k_0$ (energy $\approx k_0^2/2$)
launched from the left toward a barrier of height $V_0$, width $a$.
A classical point of the same energy is integrated alongside.

## Numerical method

Crank-Nicolson on $N=2048$ points; the complex tridiagonal solve
reuses `shared/js/engine/cn-tridiag.js`. Engine
`shared/js/engine/tdse-cn-cpu.js` (DOM-free, tested in
`tests/tdse-cn.test.mjs`). Render:
`shared/js/engine-gl/tdse-landscape-3d.js`.

### Stack note (WebGL2 relaxation)

Project default is Canvas2D/SVG; relaxed to WebGL2 (a phase-coloured
2048-sample probability curtain over a potential terrain at 60 fps is
not feasible in Canvas2D). Reuses `createGL2` / `compileProgram`;
default framebuffer + in-shader ACES.

## INTERACTIVITY (standard S4)

- Camera orbit (drag): yes, shared orbit camera over the landscape.
- Camera zoom (scroll): yes.
- Camera pan: not applicable (the landscape is the subject; fixed
  target keeps the barrier framed; stated).
- Direct manipulation: Shift-drag on the scene sculpts the potential
  terrain (raises a soft bump where the cursor maps along x).
- Parameters: barrier height V0 (0 to 16); barrier width (0.5 to 8);
  packet k0 (1 to 6, energy ~ k0^2/2); packet spread sigma (2 to 10).
- Time controls: play, pause, single Step (8 sub-steps), Relaunch
  (reset the packet). No speed multiplier (sub-steps/frame are fixed;
  Step covers slow motion).
- Presets: thin barrier, thick barrier, resonant double, step
  potential.
- Probe/readout: live transmitted and reflected probability, their
  sum (must stay 1), the conserved norm, the packet energy and V0.

## Diagnostic plot (secondary)

A Canvas2D panel draws the analytic transmission coefficient T(E) for
the current rectangular barrier with the packet energy marked, so the
simulated split can be read against theory. Subordinate to the 3D
landscape (S3).

## Expected qualitative features

1. On load the packet is already moving toward the barrier (S5).
2. At the barrier it visibly splits: a reflected lobe and a
   transmitted lobe, while the classical ball bounces (S6).
3. Thin vs thick barrier dramatically changes the transmitted
   fraction; the resonant double spikes near unity at special E.
4. The norm readout stays at 1 to five decimals throughout.

## Invariants and acceptance thresholds

| invariant | threshold | location |
| probability conserved every step (CN unitarity) | < 1e-6 | invariants test |
| reflection + transmission = 1 | < 1e-3 | invariants test |
| tunnelling decreases with barrier thickness | strict | invariants test |
| classical ball reflects off a too-tall barrier | strict | invariants test |
| analytic T(E): zero-barrier = 1, monotone, T->1 high E | strict | invariants test |
| solver deterministic | exact | invariants test |

Confirmed in `invariants.test.mjs` and `tests/tdse-cn.test.mjs`.

## Limiting cases for verification

- V0 = 0: full transmission, no reflected lobe.
- V0 >> E, wide: near-total reflection, an exponentially small
  tunnelled tail.
- E >> V0: classical-like, packet sails over.

## Citations

- Griffiths, Introduction to Quantum Mechanics, 3rd ed., CUP 2018,
  Ch. 2 (`griffiths-qm`).
- Press, Teukolsky, Vetterling and Flannery, Numerical Recipes,
  3rd ed., CUP 2007, Sec. 19.2 (`numerical-recipes`).

## Risk register

- Crank-Nicolson is unconditionally stable and exactly unitary; the
  norm-drift invariant guards the implementation.
- Dirichlet ends: the run length keeps the packet off the boundary;
  the flux split is read after the packet clears the barrier.
- Golden determinism: capture fixes a per-fraction preset, step
  count and camera.
