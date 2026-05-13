---
title: Mandelbrot Set Explorer
slug: mandelbrot-explorer
status: in-progress
audience: portfolio
created: 2026-05-13
---

# Mandelbrot Set Explorer

## Physical setup

The Mandelbrot set is the set of complex parameters $c$ for which the iteration $z_{n+1} = z_n^2 + c$ starting from $z_0 = 0$ remains bounded. The playground colors each pixel of the $c$-plane by the iteration count at which $|z| > 2$, the analytic escape threshold; pixels that stay bounded through the maximum iteration count are rendered as set membership (dark). The visualization is the canonical fractal density plot, with the set shown as a connected dark region (the cardioid + period bulbs) embedded in colored escape-time bands. The playground supports keyboard arrow keys to recenter and reset.

## Governing equations

For each $c \in \mathbb{C}$ in the view window:

$$z_0 = 0, \qquad z_{n+1} = z_n^2 + c$$

The escape time is the smallest $n$ such that $|z_n| > 2$. The Mandelbrot set is the set of $c$ with infinite escape time (i.e., $|z_n| \le 2$ for all $n$). In practice the rendering uses a finite cutoff `MAX_ITER` and treats pixels at the cutoff as set members.

## Numerical method

- **Discretization**: per-pixel scalar iteration in IEEE 754 double precision. The 720x480 canvas is mapped to a fixed view of the complex plane in $(\Re c, \Im c)$.
- **Escape test**: $|z|^2 > 4$, equivalent to $|z| > 2$, avoiding a sqrt per step.
- **Iteration cap**: `MAX_ITER = 256`. Pixels at the cap are colored as set members (the darkest tone).
- **Smooth coloring**: at the moment of escape, the smooth iteration count is $\mu = n + 1 - \log_2(\log_2(|z_n|))$. The grayscale ramp uses $t = \mu / \text{MAX\_ITER}$.
- **Color mapping**: monochrome grayscale, from `--surface` (off-white, never-escaping or just-escaping at high $\mu$) to `--fg` (charcoal, immediate escape at low $\mu$). The Mandelbrot tradition is monochrome density rendering; using viridis here was waived for the same reason as `playgrounds/logistic-cobweb` (the fractal escape time is a single-channel density, well represented by a perceptually monotonic monochrome ramp).
- **Rendering stride**: full 720x480 = 345,600 pixels at 256 iterations max = 88 million ops worst-case. Rendered once into an offscreen `ImageData` on first paint and on every view change; the live readout updates on hover without re-rendering.
- **RNG**: not used. Deterministic.

## Controls

| name | type | units | range | default | sets |
|------|------|-------|-------|---------|------|
| view center | drag handle (canvas) | complex plane | $|c| \le 2$ | $(-0.5, 0)$ | center of the view window; double-click to reset |
| view width | slider | complex-plane units | 0.5 to 4.0 | 3.5 | width of the view in the real direction (height scales proportionally) |
| reset | button | N/A | N/A | N/A | restore default view center and width |

There is no play/pause: the rendering is static. (The spec waives the play/pause requirement from AESTHETIC.md because this playground is not time-evolving.)

## Expected qualitative features

### Visible in the default golden frames

The captureFraction sweep maps to the view width: width = 3.5 - 3.0 * frac, so wider at frac=0 and zoomed-in at frac=1. View center stays at (-0.5, 0).

- t-000: full Mandelbrot set at width 3.5, classic cardioid plus period bulbs.
- t-025: zoomed to width 2.75; cardioid edge and main period-2 bulb on the left visible.
- t-050: zoomed to width 2.0; the period-2 bulb and main cardioid dominate.
- t-075: width 1.25; the period-2 bulb is the focal point.
- t-100: width 0.5; deep zoom on the period-2 bulb showing self-similar structure.

In every frame the set membership is dark (charcoal); the surrounding bands are progressive shades of monochrome lightness.

### Available via user interaction

- Drag the view across the cardioid to see escape-time bands sharpen near the boundary.
- At small widths (< 0.1) the smooth coloring banding becomes visible (an artifact of the integer MAX_ITER cap).

## Invariants and acceptance thresholds

| invariant | strong/medium/weak | threshold | notes |
|-----------|-------------------|-----------|-------|
| Set membership at $c = 0$ | strong | iteration stays bounded ($|z| \le 2$) for the full MAX_ITER = 256 cycles | $z_0 = 0 \to z_1 = 0$ stays at 0 forever; trivially bounded |
| Set membership at $c = -1$ | strong | iteration stays bounded for MAX_ITER cycles | $z_0 = 0 \to z_1 = -1 \to z_2 = 0$, period-2 orbit |
| Escape at $c = 1$ | strong | escapes in $\le 4$ iterations | $z_0 = 0 \to 1 \to 2 \to 5 \to 26$; reaches $|z| > 2$ at $n = 3$ |
| Escape at $c = 1 + i$ | strong | escapes in $\le 4$ iterations | classic exterior point |
| Boundary period-3 at $c = -1.75$ | medium | iteration oscillates among three distinct points within numerical tolerance after burn-in | the canonical period-3 bulb on the real axis |

## Limiting cases for verification

| limit | expected | source |
|-------|----------|--------|
| $|c| > 2$ | always escapes within 1 iteration | $|z_1| = |c| > 2$ trivially |
| $c = 0$ | always remains at $z = 0$ | by definition |
| $c$ inside the main cardioid | stays bounded; orbit converges to the attracting fixed point | Newman Exercise 3.7 |
| $c$ on the boundary | sensitive dependence; smooth coloring becomes noisy | Strogatz Section 10.4 Periodic Windows (parameter-window analog in the complex-quadratic family) |

## Visual fallback

Primary validation is via the four membership-test invariants. SSIM > 0.92 against five committed golden frames is the secondary gate.

## Citations

1. **Newman, Mark.** "Computational Physics." Revised printing, CreateSpace, 2013. Bib key `newman2013`. Exercise 3.7 "The Mandelbrot set" presents this exact rendering. Verified in chapter_index.
2. **Strogatz, Steven H.** "Nonlinear Dynamics and Chaos." 2nd ed., Westview/CRC Press, 2015. Bib key `strogatz2015`. Section 10.4 Periodic Windows discusses analogous bifurcation structure in the real-axis cross-section of the Mandelbrot set; the period-doubling cascade on the real axis of the complex-quadratic family maps to the logistic-map cascade via the change of variable $c = (1 - r^2)/4$ or similar. Verified in chapter_index.

## Stretch goals

- Zoom in / zoom out buttons that geometrically scale the view width.
- Hover readout: report the (Re c, Im c) of the pixel under the cursor and its escape time.
- Toggle viridis / cividis colormap once the shared `colormaps.js` viridis polynomial is fixed (the project TODO at the top of that file).
- Render Julia set side by side for a given $c$ value.
- Higher MAX_ITER tier for deep zooms (e.g., 1024 or adaptive).

## Risk register

1. **Render-time stall at deep zoom.** A 720x480 render at 256 iterations is ~88 million ops; in JS this takes ~50 ms in the worst case. Mitigation: render is synchronous on view change; double-buffer if needed in future. For the visual capture, this is fine.
2. **Quantization at low MAX_ITER.** With MAX_ITER = 256, deep zooms (width < 0.01) show heavy banding because the smooth coloring resolution becomes too coarse. Mitigation: documented in spec; future work would adapt MAX_ITER to view width.
3. **Pixel-perfect determinism.** Floating-point sums in the inner loop are commutative-associative-free, so the rendered image depends on the order of pixel iteration. Mitigation: enforce row-major iteration and document; the visual SSIM gate is the canonical check.
