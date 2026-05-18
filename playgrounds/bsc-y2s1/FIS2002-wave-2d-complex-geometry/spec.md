---
title: 2D Waves in a Drawable Geometry
slug: wave-2d-complex-geometry
status: verified
audience: portfolio
created: 2026-05-17
hook: 'Send a circular wave at two slits and the textbook interference fan blooms past the wall, the central maximum landing exactly on the axis.'
one_paragraph: 'The scalar wave equation in two dimensions, solved by an explicit leapfrog scheme with rigid walls and an absorbing sponge. Presets give a free circular wavefront, single-slit diffraction, double-slit interference with an on-axis central maximum, and an obstacle that casts a shadow the wave bends into. The primary scene is the physical displacement field with a tanh-compressed water map so the faint transmitted pattern is visible; the side panel reads the screen intensity along a far column. The numerics live in the shared wave engine (extended here with rigid barriers, slits and a sponge); the time step satisfies the 2D CFL bound. The shared engine and the scene layer are gate-tested for wave speed, CFL, damped-energy decay, slit-versus-wall transmission, the symmetric central double-slit maximum, hard-wall phase inversion, and circular-wavefront isotropy.'
tags: [waves, pde, diffraction, interference, animation, live-readout]
difficulty: 4
tier: advanced
hero_candidate: true
renderer: canvas2d
estimated_engagement_minutes: 5
curriculum_year: 'L:F-2Y-1S'
primary_uc: FIS2002
share_state_keys: []
---

# 2D Waves in a Drawable Geometry

## Explainer

### What you are looking at

Put obstacles in the path of a wave and it does not just stop: it
bends around corners, squeezes through gaps and spreads on the far
side, and forms interference patterns behind two slits. The
playground solves the real 2D wave equation on a geometry you draw,
so diffraction and interference emerge from the physics rather than
being faked.

### The wave equation

The membrane (or shallow-water) displacement $u(x,y,t)$ obeys

$$\frac{\partial^2 u}{\partial t^2}
  = c^2\,\nabla^2 u,$$

with $c$ the wave speed. Rigid obstacles impose $u=0$ on their
boundaries (a hard wall reflects); open edges absorb. A monochromatic
point source drives one corner at frequency $f$, so the wavelength is
$\lambda = c/f$.

### Why geometry produces diffraction

The single rule that explains everything you see is Huygens's
principle: every point of a wavefront re-emits a little spherical
wavelet, and the new front is their envelope. Near an obstacle the
wavelets are no longer cancelled symmetrically, so the wave bends.
The amount of bending is set by the ratio of wavelength to feature
size:

- A gap much wider than $\lambda$ passes a near-collimated beam with
  only edge diffraction.
- A gap comparable to $\lambda$ acts as a fresh point source: the
  wave spreads in a broad fan (strong diffraction).
- Two such gaps give a two-source interference pattern, with maxima
  where the path difference is $m\lambda$, the Young double-slit
  result, here arising naturally from the simulated field.

This is why you can hear around a corner (sound's metre wavelength
diffracts) but not see around it (light's sub-micron wavelength does
not). The playground updates the field as you draw walls and slits
and change the frequency, with a live readout of the maximum
post-step amplitude to confirm the scheme is stable.

### Things to try

- Open a slit much wider than $\lambda$ and see a near-straight beam;
  narrow it to $\sim\lambda$ and watch it fan out (diffraction).
- Cut two slits and watch the interference fringes form behind them.
- Raise the frequency (shorten $\lambda$) and watch all the
  diffraction and bending diminish.

### Where this comes from

The 2D wave equation, Huygens's principle, and slit
diffraction/interference follow Hecht, *Optics*, Chapters 9 and 10,
and French, *Vibrations and Waves*, Chapter 7.

## Physical setup

A vibrating membrane (or shallow water) in a 2D box with rigid
obstacles. A monochromatic point source on the left radiates toward a
wall with slits or an obstacle; the far side shows diffraction and
interference. The domain edges are an absorbing sponge so the pattern
is not contaminated by box reflections.

## Governing equations

The damped scalar wave equation

`u_tt = c^2 (u_xx + u_yy) - gamma u_t`,

with rigid (Dirichlet `u = 0`) barriers. Two coherent slits give the
two-source condition `r1 - r2 = m lambda`; on the symmetry axis the
path difference is zero, so a centred double slit is constructive
there in any regime.

## Numerical method

Explicit leapfrog (5-point Laplacian), `dx = 1`, time step at the 2D
CFL bound `c dt < dx / sqrt(2)` (safety 0.9). Rigid cells are held at
zero; a quadratic sponge band absorbs outgoing waves. The engine is
`shared/js/engine/wave-2d-cpu.js`, extended with `makeBarrier`,
`addWallWithSlits`, `makeSponge`, `stepBarriered` and `addSourceRing`;
the original four exports are unchanged so the existing wave heroes do
not regress. Reference: Crawford, *Waves* (Berkeley Physics Course
Vol. 3), Ch. 7 (`crawford-waves`); Hecht, *Optics* (5th ed.), Ch. 10.

## Controls

- preset: free point source, single slit, double slit, obstacle.
- wavelength (cells): sets the source wavelength and the fringe scale.
- damping gamma: attenuates the field with propagation distance.
- Reset, Pause.

## Expected qualitative features

- Free: a circular wavefront expanding at speed `c`.
- Single slit: a single broad diffraction lobe.
- Double slit: a symmetric interference fan with the central maximum
  on the axis and fringes whose spacing follows the two-source law.
- Obstacle: a shadow behind the block that diffraction partly fills.
- Raising `gamma` dims the far field; the readout energy drops.

## Invariants and acceptance thresholds

Engine (`tests/engines/wave-2d-cpu.test.mjs`):
- Disturbance front advances linearly in time (wave speed).
- Bounded at the CFL `dt`, divergent well above it.
- Damped total energy decreases monotonically and exponentially.
- Slitless wall blocks transmission; a slit passes `> 8x` the energy.
- Double slit: central maximum within 6 cells of the axis, mirror
  symmetry `< 0.18`, on-axis amplitude `> 1.5x` the local mean.
- Hard wall inverts the reflected pulse (fixed-end phase flip).

Scene (`invariants.test.mjs`):
- Four named presets; CFL `dt = 0.9 / sqrt(2)` at `c = 1`.
- Free source radiated-amplitude anisotropy `< 0.3` (near ring),
  `< 0.5` farther out (5-point-stencil numerical anisotropy).
- Slitless wall vs single slit transmission ratio `> 6`.
- Double slit symmetric with a strong on-axis maximum.
- Obstacle far energy between 2% and 85% of the unobstructed value.
- Damping drains the scene energy below half within 400 steps.

## Limiting cases for verification

- No barrier: the free source reproduces a circular wavefront.
- `gamma = 0`: energy is conserved up to sponge absorption.

Source: Crawford, *Waves* (Berkeley Physics Course Vol. 3), Ch. 7
(`crawford-waves`); Hecht, *Optics* (5th ed.), Ch. 10 (`hecht2017`).
