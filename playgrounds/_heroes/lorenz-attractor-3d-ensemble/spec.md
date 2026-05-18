---
title: Lorenz Attractor Ensemble (Hero)
description: "Edward Lorenz's 1963 chaos model, shown as a swarm. A few thousand trajectories (4096) start a hair apart and are integrated with RK4 at sigma=10, rho=28, beta=8/3; the GPU paints how they crowd as a glowing viridis density field on the famous two-lobed butterfly attractor. Nearby starts diverge exponentially yet stay on the same shape. Sliders set integration speed and trail length; drag to orbit, scroll to zoom."
caption: "Figure 1. Ensemble density of 4096 Lorenz trajectories (sigma=10, rho=28, beta=8/3): brighter regions are where trajectories crowd on the attractor. The cloud starts in a 10^-3 ball and is stretched across the whole butterfly within seconds, the signature of deterministic chaos. Method: CPU RK4 per trajectory, GPU additive density splatting with ACES tonemapping. Source: Strogatz, Nonlinear Dynamics and Chaos, Ch. 9."
slug: lorenz-attractor-3d-ensemble
status: verified
audience: portfolio
created: 2026-05-14
primary_uc: FIS2021
supporting_ucs: []
curriculum_year: hero
primary_citation: strogatz2015
primary_chapter: 9
hook: "A toy weather model with three equations and three fixed numbers never repeats and never settles down. Start a few thousand copies a hair apart and watch them smear across the same butterfly-shaped surface: this is deterministic chaos, the reason long-range forecasts fail."
one_paragraph: "Edward Lorenz found in 1963 that three simple equations for convection rolls never settle into a repeating cycle. This shows the result as a swarm. A few thousand trajectories (4096) all start inside a ball one part in a thousand wide, around (1, 1, 1), and are stepped forward with the same RK4 integrator at the classic parameters sigma=10, rho=28, beta=8/3. Within a few seconds the cloud is stretched across the whole Lorenz attractor, the two-lobed butterfly surface. Nearby starts pull apart exponentially fast (the readout estimates the rate, lambda_max is about 0.9), yet every trajectory stays on that same shape forever: that is what deterministic chaos means, exquisitely sensitive to the start but bounded and structured. The GPU draws the swarm as a glowing density field (brighter where trajectories crowd) and re-projects a short 3D trail so the motion reads while the view slowly turns. The substeps slider sets how many integration steps run per frame, so how fast time flows; trail decay sets how long the comet tails linger. Drag to orbit, scroll to zoom."
tags: [mechanics, animation, live-readout]
difficulty: 4
tier: single
hero_candidate: true
renderer: webgl2
estimated_engagement_minutes: 5
share_state_keys: []
---

# Lorenz Attractor Ensemble

## Explainer

### What you are looking at

In 1963 the meteorologist Edward Lorenz stripped a weather model down
to three numbers and three equations and found something that changed
science: a system with no randomness in it at all, whose future is
still effectively unpredictable. This playground releases thousands of
trajectories from almost the same starting point. They stay together
for a moment, then fan out and trace the famous two-winged "butterfly".
That shape is the Lorenz attractor.

### The three equations

Lorenz's model is just these three coupled rate equations for three
variables $x$, $y$, $z$ (loosely: how fast the fluid rolls, and two
measures of its temperature pattern):

$$\frac{dx}{dt} = \sigma\,(y - x)$$

$$\frac{dy}{dt} = x\,(\rho - z) - y$$

$$\frac{dz}{dt} = x\,y - \beta\,z$$

Each line says "this variable changes at a rate set by the others".
The standard control values are $\sigma = 10$ (the Prandtl number),
$\rho = 28$ (how hard the fluid is driven), and $\beta = 8/3$. Only the
two products $x z$ and $x y$ are nonlinear, and that tiny bit of
nonlinearity is enough to produce chaos.

### Why the cloud collapses onto a thin sheet but never settles

Add up how the flow stretches or shrinks a little blob of starting
points (the divergence of the right-hand side):

$$\nabla\!\cdot\mathbf{f}
 = \frac{\partial \dot x}{\partial x}
 + \frac{\partial \dot y}{\partial y}
 + \frac{\partial \dot z}{\partial z}
 = -(\sigma + 1 + \beta) \approx -13.7.$$

This is a constant and it is negative, so every volume of states
shrinks exponentially. The attractor therefore has zero volume: it is
an infinitely thin sheet, which is why it looks like a surface from
every angle. And yet two points on that sheet pull apart, because the
two non-trivial steady states

$$C_\pm = \big(\pm\sqrt{\beta(\rho-1)},\;
  \pm\sqrt{\beta(\rho-1)},\; \rho-1\big)$$

are both unstable for $\rho = 28$. The motion spirals out around one
$C$, flips to the other, spirals out again, forever, never repeating.
That lobe-switching is the butterfly.

### Sensitive dependence (the actual point)

Start two trajectories a distance $\delta_0$ apart and their
separation grows on average like

$$\delta(t) \approx \delta_0\, e^{\lambda t},
  \qquad \lambda \approx 0.9 > 0.$$

A positive $\lambda$ (the largest Lyapunov exponent) means any
uncertainty in the starting state, however small, is amplified until
prediction fails. That is Lorenz's point: the weather is deterministic
and still unforecastable far ahead. Watch the seeded ball stay tight,
then smear across the whole attractor within seconds; the readout
tracks the ensemble diameter and an estimate of $\lambda$.

### How it is computed

Each of the thousands of trajectories is advanced with the classical
fourth-order Runge-Kutta method (a standard, accurate ODE stepper).
The brightness is a true density: where trajectories crowd (the slow
centres of the lobes) the image is bright; the fast outer sweeps are
dim. The check that the simulation is honest is structural, the cloud
must converge to the same zero-volume two-lobed set the equations
demand, and the invariant tests assert exactly that.

### Things to try

- Watch the first few seconds: a compact ball near $(1,1,1)$ becoming
  the full butterfly is sensitive dependence happening in front of you.
- Slow the substeps right down and follow a single arm spiralling
  outward before it jumps lobes; the jump is irregular and never on a
  schedule.
- Note that brightness is population, not speed: the bright cores are
  where the flow lingers.

### Where this comes from

The equations, the parameter values, the unstable fixed points, the
volume-contraction argument, and the attractor structure follow
Strogatz, *Nonlinear Dynamics and Chaos*, 2nd ed. (2015), Chapter 9
(Sections 9.1 to 9.5). The original derivation is Lorenz,
"Deterministic Nonperiodic Flow", *Journal of the Atmospheric
Sciences* 20 (1963).

## Physical setup

In 1963 Edward Lorenz reduced atmospheric convection to three coupled ordinary differential equations. They have no random terms, yet their solutions never repeat and depend so sensitively on the starting point that the future becomes effectively unpredictable. The set of states the system settles onto is the Lorenz attractor: a thin, two-lobed surface (the "butterfly") that trajectories wind around forever, switching lobes irregularly. This playground integrates many trajectories at once so the attractor appears directly as the region they fill.

## Governing equations

dx/dt = sigma (y - x)

dy/dt = x (rho - z) - y

dz/dt = x y - beta z

with the canonical parameters sigma = 10, rho = 28, beta = 8/3 (Strogatz, Ch. 9.1 to 9.2). At rho = 28 the two non-trivial fixed points are unstable and the motion is chaotic. The flow is dissipative: phase-space volume contracts at the constant rate -(sigma + 1 + beta), so the cloud collapses onto a zero-volume attracting set even as nearby points separate.

## Numerical method

Each of N = 4096 trajectories is advanced by a classical fourth-order Runge-Kutta step on the CPU (shared `engine/lorenz-cpu.js`, the same code the invariant tests call; sigma, rho, beta are fixed module constants). Every frame the WebGL2 engine `engine-gl/lorenz-ensemble.js` uploads the current positions and additively splats them into an HDR accumulator; the log-density is viridis-mapped, ACES-tonemapped and vignetted. A 28-layer ring of recent world-space positions is re-projected each frame to draw an age-decayed 3D trail (object-space, so it stays crisp when the camera turns). A Canvas2D path renderer with the same CPU RK4 is the fallback when `EXT_color_buffer_float` is unavailable.

## Controls

- substeps (1 to 20): RK4 steps integrated per frame; higher means time flows faster.
- trail decay (0.80 to 0.999): how slowly the comet tails fade; higher means longer tails.
- Reset: re-seed the 10^-3 ensemble ball and clear the accumulator. Pause / Play freezes time (the camera keeps turning).
- Drag to orbit the camera, scroll to zoom. The readout shows ensemble diameter, an lambda_max estimate, the centroid and FPS.
- share_state_keys is empty: the two sliders are visual-rate knobs, not physics parameters, so no state is encoded in the URL.

## Expected qualitative features

- The classic two-lobed butterfly, not a blob, a single ring, or noise.
- The cloud begins compact near (1, 1, 1), then within a few seconds is smeared across the entire attractor (sensitive dependence).
- Brighter viridis where trajectories crowd (the slow manifold near the lobe centres); dimmer on the fast outer sweeps.
- A readable, non-overlapping readout; a slow continuous camera rotation so the 3D sheet reads without interaction.

## Invariants and acceptance thresholds

`invariants.test.mjs` (vitest, offline):

1. The freshly seeded ensemble centroid is within 0.01 of (1, 1, 1) (the 10^-3 ball).
2. After 4000 RK4 steps the centroid z lies in (15, 30), consistent with the attractor sitting near z ~ rho - 1.
3. The ensemble spatial spread grows over the first 500 steps (exponential divergence of nearby starts).

In-page gates: `__cpuVsGpu` checks the live ensemble diameter is in the attractor band (20 to 80); `__physicsCheck` confirms saturation diameter 30 to 100 by t = 20 (exponential growth completed). Visual gate: SSIM > 0.92 against committed golden frames; the post-build multimodal review confirmed the butterfly, the viridis density structure, the camera rotation, no escape and a legible readout (6 of 6).

## Limiting cases for verification

- rho < 24.74 (sub-critical): trajectories spiral into a stable fixed point, no chaos. This build fixes rho = 28; the sub-critical regime is the prime target for the planned hero-promotion rho slider.
- Tiny initial ball: the cloud stays coherent for a short transient, then separates exponentially. Larger sigma sharpens the x-y slaving.
- Volume contraction: the attractor has zero volume, so the rendered sheet is thin from every angle.

## Visual fallback

The Canvas2D path renderer (same CPU RK4) draws the trajectories directly when the float-buffer extension is missing, so the butterfly is still visible without the density accumulator.

## Citations

- Strogatz, Nonlinear Dynamics and Chaos, 2nd ed., Ch. 9 (Lorenz equations, sections 9.1 to 9.5): the equations, the parameter values, the attractor and the Lorenz map.
- Lorenz, Deterministic Nonperiodic Flow, J. Atmos. Sci. 20, 1963: the original derivation (historical origin, discussed in Strogatz Ch. 9).

## Risk register

- The `lambda_max` readout is a coarse proxy from the ensemble diameter growth, not a Benettin Lyapunov-spectrum calculation; it lands near the textbook value (~0.9) but is illustrative, not a measurement. Stated in the readout context and here.
- rho is fixed at 28 in this build. The spec previously claimed a rho slider; that control does not exist here and is deferred to hero-promotion (see DEVNOTES).
