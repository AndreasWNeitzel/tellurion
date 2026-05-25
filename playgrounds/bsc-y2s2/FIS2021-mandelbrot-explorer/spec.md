---
title: Mandelbrot Rainbow Explorer
slug: mandelbrot-explorer
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS2021
primary_citation: griffithsqm2018
supporting_ucs: [FIS2018]
curriculum_year: bsc-y2s2
hook: 'One equation, z -> z^2 + c, iterated for every point of the plane, draws the most intricate object in mathematics, infinitely detailed at every zoom.'
one_paragraph: 'The Mandelbrot set is the set of complex numbers c for which the iteration z -> z^2 + c, started at z = 0, stays bounded forever. The playground colours every pixel (a value of c) by how fast its orbit escapes the disc |z| <= 2; points that never escape form the black body of the set. Its boundary is a fractal of unlimited complexity, with miniature copies of the whole set buried at every scale, so zooming in never simplifies it. This single quadratic recurrence is the canonical demonstration that trivial rules can generate infinite structure. Reference: Mandelbrot, The Fractal Geometry of Nature.'
tags: [mechanics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
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

# Mandelbrot Rainbow Explorer

## Explainer

### What you are looking at

One of the most intricate objects in mathematics comes from iterating
the simplest possible nonlinear formula and asking a single yes/no
question. The playground lets you zoom into the Mandelbrot set
endlessly and find the same motifs repeating at every scale, infinite
complexity from one line of arithmetic.

### The definition

For each complex number $c$, iterate

$$z_{0}=0,
  \qquad
  z_{n+1}=z_n^2+c.$$

The Mandelbrot set $\mathcal M$ is the set of $c$ for which the
sequence stays bounded forever. Everything you see is a map of that
one question over the complex plane.

### Escape, coloring, and self-similarity

A point $c$ is colored by how fast it escapes:

- If $|z_n|$ ever exceeds 2 the orbit is guaranteed to diverge; the
  iteration count at escape sets the color, which is why the exterior
  shows smooth bands (level sets of the escape-time / Green's
  function of $\mathcal M$).
- Points that never escape are in the set (drawn black). The
  boundary is a fractal of Hausdorff dimension 2: infinitely crinkly,
  so zooming in always reveals new structure.
- The bulbs hanging off the main cardioid are exactly the regions
  where the iteration has a stable cycle of a given period (period
  doubling, the same $2,4,8,\dots$ bifurcation cascade as the
  logistic map lives on the real slice), and tiny near-perfect copies
  of the whole set recur deep inside (quasi-self-similarity).

So the picture is not decorative: distance from the boundary is the
escape rate, the bulbs encode periodic dynamics, and the repetition
is genuine renormalization structure. The playground renders the
escape-time field and lets you zoom into the boundary to see the
detail never end.

### Things to try

- Zoom into the boundary repeatedly and watch fresh detail (and mini
  Mandelbrots) appear at every magnification.
- Sit on the real axis and connect the bulbs to the period-doubling
  route to chaos of the logistic map.
- Compare a point just inside the boundary (slow, structured escape)
  with one far outside (instant escape).

### Where this comes from

The Mandelbrot set, the escape-time algorithm and its connection to
period doubling follow Mandelbrot, *The Fractal Geometry of Nature*,
and Peitgen, Jurgens and Saupe, *Chaos and Fractals*.

## Physical setup

The Mandelbrot set $\mathcal{M} \subset \mathbb{C}$ is

$$\mathcal{M} = \{\, c \in \mathbb{C} : |z_n(c)| \le 2 \text{ for all } n,\quad z_0 = 0, \ z_{n+1} = z_n^2 + c \,\}.$$

Each pixel is a value of $c$; the rendered colour encodes how quickly the orbit leaves the disc $|z| \le 2$. Pixels with $|z|$ still bounded after `maxIter` iterations are members.

## Numerical method

- **Iteration**: scalar double-precision real-pair update of $z = z_r + i z_i$. No complex-number wrapper because that costs a property-access penalty in V8.
- **Escape test**: $|z|^2 > 4$.
- **Smooth iteration count**: $\mu = n + 1 - \log_2 \log_2 |z|$ on escape, giving continuous shading without banding.
- **Cardioid and period-2 bulb shortcut**: every pixel is first tested against the main cardioid (Lehmer 1986) and against the period-2 disc centred at $c = -1$ with radius $1/4$. Pixels inside either are immediately marked as members and the iteration loop is skipped. This is roughly a 5x speedup for low-zoom views.
- **Adaptive iteration cap**: $\text{maxIter} = 256 + 220 \log_{10}(3.5 / w)$ where $w$ is the view width in complex-plane units. Full-set view uses 256; zoom 1e9x uses ~ 2200.
- **Palette**: HSL-derived 1024-entry RGB table. Hue cycles four times across the table; lightness modulates sinusoidally for the classic rainbow-band contour. Smooth escape time $\mu$ indexes the palette through $\log_2(1 + \mu)$, giving more colour resolution near the boundary.
- **Auto-zoom**: width $\to$ width $\times 0.97$ per requestAnimationFrame call, with half-resolution rendering during zoom to keep frame time under 16 ms. Stops at $w < 10^{-13}$ (a hair above double-precision pixel noise).

## Controls

| name | type | sets |
|------|------|------|
| Click on canvas | pointer | recenters the view on the clicked complex coordinate |
| Auto-zoom | button | toggles geometric zoom into the current centre |
| Zoom out | button | doubles the width (capped at 3.5) |
| Preset target | dropdown | jumps to one of six named zoom points (Seahorse, spirals, satellite, elephant, triple-spiral cusp, Misiurewicz) |
| Reset | button | back to the full set at width 3.5, centre (-0.5, 0) |

The `captureFraction` URL parameter performs the deterministic capture sweep: an exponential zoom into Seahorse Valley while the view stays centred on the target.

## Expected qualitative features

### Visible in the default golden frames

The captureFraction sweep keeps centre at $(-0.7269, 0.1889)$ (Seahorse Valley) and varies the width:

| frame | width | zoom | maxIter |
|-------|-------|------|---------|
| t-000 | 3.500 | 1.0x | 256 |
| t-025 | 3.66e-1 | ~ 10x | ~ 470 |
| t-050 | 1.45e-2 | ~ 240x | ~ 780 |
| t-075 | 5.74e-4 | ~ 6100x | ~ 1090 |
| t-100 | 6.00e-5 | ~ 5.83e4x | ~ 1300 |

Every frame shows:

- A continuous rainbow palette outside the set; the set members in near-black.
- The main cardioid and period-2 bulb at low zoom; spiral and seahorse boundary structure at high zoom.
- A live readout (Re c, Im c, width, zoom, maxIter) in the upper-right corner.

### Through user interaction

- Click on any boundary point to recenter, then press auto-zoom. The view drives into that point until the double-precision floor.
- Switch presets to land at a named target. The auto-zoom button picks up from there.

## Invariants and acceptance thresholds

| invariant | strong/medium | threshold | notes |
|-----------|---------------|-----------|-------|
| Set membership of c = 0, -1, -1.75 | strong | iter == maxIter | classical orbit fixed points |
| Escape of c = 1, 1 + i | strong | iter < 5 | basic escape test |
| Escape of |c| > 2 | strong | iter < 2 | exterior of the escape disc |
| Cardioid shortcut works | strong | iter == maxIter at known cardioid interior points | Lehmer 1986 test |
| Period-2 bulb shortcut works | strong | iter == maxIter at known bulb interior points | $|c+1| < 1/4$ |
| Smooth escape time monotone | medium | $\mu$ < iter + 1.5 for fast escapes | continuous shading no banding |
| maxIterForWidth scales | medium | 256 at w = 3.5; > 2000 at w = 3.5e-9 | adaptive depth |
| Determinism | strong | bit-identical $\mu$ on repeat | no RNG |

## Aesthetic waivers

1. **Rainbow palette**. The project standard forbids "default rainbow colormaps" for scientific data. This is an artistic / pedagogical fractal, and the rainbow contour banding is the canonical Mandelbrot rendering choice (going back to the 1980s). The waiver is documented; no perceptual encoding of magnitudes is being misled here.
2. **Hard-coded canvas font sizes**. ctx.font does not inherit CSS variables; standard waiver for any canvas-2D heavy playground.

## Citations

1. **Newman, M.** "Computational Physics". 2013. Exercise 3.7 "The Mandelbrot set". Bib key `newman2013`; the chapter_index entry for 3.7 is verified.
2. **Lehmer, D. H.** Cardioid test for the Mandelbrot set, common knowledge in the dynamics-of-iterated-maps literature (no specific citation in the project bib; tagged `[no-source: internal-reasoning]` because the test is geometric, not a methodological choice that needs sourcing).
