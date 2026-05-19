---
title: "Fourier Epicycle Drawing"
slug: fourier-epicycle-drawing
status: verified
audience: portfolio
created: 2026-05-15
primary_uc: M3012
supporting_ucs: []
curriculum_year: bsc-y3s1
hook: 'A chain of rotating circles, sorted largest to smallest, redraws any closed path through the discrete Fourier transform.'
one_paragraph: 'For N complex sample points, compute C_k via DFT and reconstruct z(t) = sum_k C_k exp(2 pi i k t / N). With M epicycles the reconstruction error decreases monotonically; full N/2 reproduces the path within float precision.'
tags: [numerics, waves, interactive-drag, animation]
difficulty: 3
tier: medium
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 4
share_state_keys: [n_epicycles]
---

# Fourier Epicycle Drawing

A chain of rotating circles (epicycles) traces a target shape. Each circle rotates at a harmonic frequency with radius equal to the DFT coefficient magnitude; the tip of the last arm draws the curve. Sliding the epicycle count from 1 to N/2 visibly improves the fit; the RMS error vs the original path shrinks monotonically.

## Explainer

### What you are looking at

A chain of spinning circles, each riding on the tip of the last, with
the final tip tracing a target shape (a silhouette, a signature). Add
more circles and the drawing gets sharper. This is the discrete Fourier
transform made visible: any closed curve is a sum of rotations.

### Treating the path as a complex signal

Sample the target curve as $N$ points and write each as a complex
number $z_j = x_j + i y_j$. Its discrete Fourier transform is

$$C_k = \frac1N\sum_{j=0}^{N-1} z_j\,e^{-2\pi i k j/N}.$$

Each coefficient $C_k$ is one circle: its magnitude $|C_k|$ is the
radius, its phase is the starting angle, and $k$ is how many turns it
makes per loop. Reconstructing the path is just adding the circles back
up:

$$z(t) = \sum_k C_k\,e^{2\pi i k t/N}.$$

### Why more circles means a better drawing

Sort the circles by radius $|C_k|$ and chain them largest first. With
one circle you get a blob; each extra circle adds a finer harmonic that
carves in more detail, and the RMS error to the original path shrinks
monotonically as you include more terms. This is exactly Fourier
series convergence: low frequencies set the gross shape, high
frequencies the sharp corners. It is the same math behind JPEG, audio
compression, and orbital epicycles, here drawn as literal rotating
arms.

### Things to try

- Start with 1 epicycle (a circle) and slide the count up: watch the
  sketch resolve from blob to exact outline.
- Watch the largest circles set the overall shape and the tiny fast
  ones add the corners.
- Note the error curve falling monotonically with the number of
  epicycles, Fourier convergence.

### Where this comes from

The discrete Fourier transform, the epicycle (Fourier-series)
reconstruction, and its convergence follow Folland, *Fourier Analysis
and Its Applications*, Chapter 2.

## Physical setup

For $N$ complex sample points $z_j = x_j + i y_j$ on the path, the DFT is
$$C_k = \frac{1}{N} \sum_{j=0}^{N-1} z_j e^{-2\pi i k j / N}.$$
The reconstruction $z(t) = \sum_k C_k e^{2\pi i k t / N}$ is animated by walking $t$ from $0$ to $N$. Coefficients sorted by $|C_k|$ place the largest circles innermost.

## Controls

- Epicycle-count slider (1 to $N/2$). Every selected epicycle's arm is drawn; the readout reports both the epicycle count and how many circles are large enough to be visible (the high-order radii are sub-pixel).
- Preset gallery: Earth outline, heart (upright), butterfly (Fay's curve), spirograph (hypotrochoid), figure-eight, 5-star, letter A (a true A: two diagonals and a crossbar, no base).
- A multi-winding preset (butterfly, spirograph) traverses over a proportionally longer period so the pen speed is comparable across presets.

## Invariants

- Parseval: $\sum |C_k|^2 = (1/N) \sum |z_j|^2$ within $10^{-10}$.
- Full $N/2$ epicycles reconstruct the path within $10^{-6}$ px RMS.
- Adding more epicycles monotonically reduces RMS error.

## Citations

Folland, "Fourier Analysis and Its Applications" ch. 2 (`folland1992`).
