---
title: Logistic Map Cobweb and Bifurcation Diagram
slug: logistic-cobweb
status: in-progress
audience: portfolio
created: 2026-05-13
---

# Logistic Map Cobweb and Bifurcation Diagram

## Physical setup

The playground visualizes the iterated logistic map on x in [0, 1] with parameter r in (0, 4]. The map is the archetypal discrete-time dynamical system exhibiting period-doubling bifurcations, the Feigenbaum cascade, and chaos. Two panels display complementary views: a cobweb diagram traces iterates from an initial condition x_0 via the graphical construction (staircase of segments between the curve y = r x (1 - x) and the diagonal y = x), and the bifurcation diagram scatters attractor points x as a function of r, revealing the cascade and the chaotic sea. The playground enforces deterministic iteration; all randomness is controlled by the RNG seed.

## Governing equations

The logistic map is a first-order nonlinear recurrence:

$$x_{n+1} = f(x_n; r) = r x_n (1 - x_n)$$

where $r \in (0, 4]$ is the bifurcation parameter and $x_n \in [0, 1]$ is the state. The dynamics depend sensitively on r: for small r the iterates converge to a fixed point; as r increases, the attractor bifurcates from period 1 to period 2, then 4, then 8, and so on, at an accumulation point $r_\infty \approx 3.5699...$, beyond which the motion is chaotic (with embedded periodic windows).

## Numerical method

- **Discretization**: pure iteration. No integrator. Each iteration is one evaluation of $f$, computed as `x_next = r * x * (1 - x)` in IEEE 754 double precision.
- **Iteration counts (rendering pass, bifurcation panel)**: per r value, run a base burn-in of 256 iterations to let high-period transients (up to period 64) decay, then plot the next 200 steady-state points. Total 456 iterations per r, with a horizontal grid of $4 \times 10^3$ r values across r in [2.5, 4.0]; redraws on zoom recompute only the visible r window.
- **Iteration counts (cobweb panel)**: up to 1000 iterations per orbit, drawn as a graphical staircase.
- **Lyapunov estimator**: at a fixed r, discard a burn-in of $10^3$ iterations, then accumulate $N = 2 \times 10^5$ terms of $\ln |f'(x_n)|$ where $f'(x) = r(1 - 2x)$. The 2-sigma margin against the 0.7 percent invariant gate at r = 4 is conservative under the natural invariant density $\rho(x) = 1 / (\pi \sqrt{x(1-x)})$ (Strogatz Section 10.5 Liapunov Exponent).
- **Lyapunov zero-handling**: if $|f'(x_n)| < 10^{-12}$, skip the term and decrement N. At r = 4 the probability of hitting this band under $\rho$ is $\sim 2 \times 10^{-12} / \pi$ per step, so the skip count is negligible. Without this guard, a single near-miss at $x_n = 1/2$ injects $\ln(0) = -\infty$ and poisons the sum.
- **Feigenbaum delta computation (invariant test)**: use the superstable cascade $R_n$ (Strogatz Section 10.3 Logistic Map: Analysis), defined as the parameter values at which the orbit through $x_0 = 1/2$ has period $2^n$. Equivalently, $R_n$ is the root of $g_n(r) = f^{2^n}(1/2; r) - 1/2$. Locate each $R_n$ for $n = 1, \dots, 6$ by bisection around the Feigenbaum extrapolation $R_n \approx R_{n-1} + (R_{n-1} - R_{n-2}) / \delta$ to tolerance $10^{-12}$ (universality of the ratio is the subject of Strogatz Section 10.6 Universality and Experiments). Compute $\delta_n = (R_{n-1} - R_{n-2})/(R_n - R_{n-1})$ for $n = 3, 4, 5$. The superstable cascade converges to the same Feigenbaum constant as the bifurcation cascade with the same geometric rate. Anchors: $R_0 = 2$ (period-1 superstable: $f(0.5; 2) = 0.5$), $R_1 = 1 + \sqrt{5} \approx 3.23607$ (period-2 superstable, closed form from solving $f(f(1/2; r); r) = 1/2$ in r). The rendering of the bifurcation panel uses a different, coarser algorithm (period-folding sweep) since the panel does not need to meet the 0.1 percent threshold.
- **Spatial domain**: x in [0, 1] for all panels.
- **Boundary conditions**: none (scalar iteration).
- **RNG**: PRNG from `shared/js/render/rng.js` seeded with `0xC0FFEE` by default. Used only if x_0 jitter is applied to disambiguate near attractor-merge points; baseline runs use a fixed x_0 (typically x_0 = 0.1).

## Controls

| name | type | units | range | default | sets |
|------|------|-------|-------|---------|------|
| r | drag handle | dimensionless | (0, 4] | 2.5 | bifurcation parameter; direct manipulation on bifurcation panel |
| x_0 | text input or readout | dimensionless | [0, 1] | 0.1 | initial condition for cobweb panel; stretch goal: direct drag |
| reset | button | N/A | N/A | N/A | reinitialize the orbit and reset the bifurcation readouts |
| play/pause | button | N/A | N/A | play | toggle live iteration (cobweb trace animates if paused, can step forward) |
| period-doubling zoom | button set or slider | dimensionless | 1 to 5 | 1 | magnify the bifurcation panel horizontally around the cascade region; used to estimate Feigenbaum delta at each zoom level |

## Expected qualitative features

- The cobweb diagram shows a staircase pattern converging to fixed points at low r (e.g., r = 2.5), period-2 oscillations around r = 3.0, and chaotic wandering around r = 3.9.
- The bifurcation diagram exhibits a clear period-doubling cascade from r = 3.0 to r_inf = 3.5699..., with successive bifurcations at r_1 ~ 3.0, r_2 ~ 3.449, r_3 ~ 3.5441, r_4 ~ 3.5644, and r_5 ~ 3.5686, with Feigenbaum delta ratios converging to 4.669201609...
- Beyond r_inf the diagram shows a chaotic band interspersed with periodic windows (notably around r ~ 3.83).
- The Lyapunov exponent transitions from negative (stable fixed point) to zero at bifurcation points to positive in the chaotic region.
- At r = 4 the Lyapunov exponent is ln 2 ~ 0.6931..., a known analytic result.
- The live readout updates in real time when r is dragged, showing r to 6 decimal places, the detected period (or chaotic flag), and the Lyapunov estimate.

## Invariants and acceptance thresholds

| invariant | strong/medium/weak | threshold | notes |
|-----------|-------------------|-----------|-------|
| Feigenbaum delta convergence | strong | $\delta_5 = (R_4 - R_3)/(R_5 - R_4)$ within 0.1 percent of 4.669201609 | superstable cascade located by bisection on $f^{2^n}(1/2; R_n) = 1/2$ to tolerance $10^{-12}$ |
| Lyapunov exponent at r = 4 | strong | $\|\lambda - \ln 2\| < 0.01 \cdot \ln 2$ over $N = 2 \times 10^5$ iterations after $10^3$ burn-in | analytic value $\ln 2 \approx 0.69314718$; estimator is ensemble-ergodic under $\rho(x) = 1/(\pi \sqrt{x(1-x)})$ |
| Attractor periodicity (period detection) | medium | detected period matches visual period count in bifurcation panel for all r in (3.0, 3.57); no false positives beyond transient window | transient-sensitive but necessary for live readout credibility |

A visual SSIM fallback of > 0.92 against committed golden frames at seed 0xC0FFEE is used if computational invariants become ambiguous (e.g., attractor merge near secondary bifurcations).

## Limiting cases for verification

| limit | expected | source |
|-------|----------|--------|
| r -> 0 | x_n -> 0 for all x_0; fixed point at x* = 0 | elementary analysis |
| r = 1 | x_n -> 0; fixed point at x* = 0 | $f(x; 1) - x = -x^2 \le 0$ on [0, 1], so iterates decrease monotonically to 0 |
| r = 2 | fixed point x* = 1/2 (stable) | $f'(x) = r(1 - 2x)$, so $\|f'(1/2)\| = \|2(1 - 1)\| = 0$ |
| r = 3 | bifurcation from period 1 to period 2; x* = (r-1)/r = 2/3 loses stability | $\|f'(2/3)\| = \|3(1 - 4/3)\| = \|-1\| = 1$, marginal stability |
| r -> 4 | attractor becomes chaotic; Lyapunov exponent lambda = ln 2 | tent-map conjugacy; Strogatz Section 10.5 Liapunov Exponent |
| r in (3, 3.57) | successive bifurcations accumulate at r_inf; delta ratio approaches 4.6692... | Feigenbaum universality; Strogatz Section 10.6 Universality and Experiments |

## Visual fallback

Primary validation is via the two strong invariants. If period detection produces false positives or noise introduces spurious basin changes, a visual SSIM > 0.92 against five committed golden frames (captured at t = 0%, 25%, 50%, 75%, 100% of a full bifurcation sweep from r = 2.0 to r = 4.0 at seed 0xC0FFEE) is the secondary gate. Reference frames are stored in `playgrounds/logistic-cobweb/references/golden-frames/`.

## Citations

1. **Strogatz, Steven H.** "Nonlinear Dynamics and Chaos." 2nd ed., Westview/CRC Press, 2015. Bib key `strogatz2015`. Sections cited:
   - Section 10.1 Fixed Points and Cobwebs: cobweb construction.
   - Section 10.2 Logistic Map: Numerics: period-doubling sequence.
   - Section 10.3 Logistic Map: Analysis: superstable cycles and the cascade.
   - Section 10.5 Liapunov Exponent: definition for 1D maps, value lambda = ln 2 at r = 4 from the tent-map conjugacy.
   - Section 10.6 Universality and Experiments: Feigenbaum constants delta and alpha.

2. **Newman, Mark.** "Computational Physics." Revised printing, CreateSpace, 2013. Bib key `newman2013`. Exercise 3.6 "Deterministic Chaos and the Feigenbaum Plot" presents the bifurcation diagram exercise; the exercise title was confirmed via the exercise distribution at public.websites.umich.edu/~mejn/cp/. Newman 2013 does not contain a dedicated exercise on the Lyapunov exponent of the logistic map.

## Stretch goals

- Direct manipulation of x_0: drag the initial vertical drop on the cobweb panel to set x_0 interactively, with instant cobweb redraw.
- Parameter animation: play a sweep of r from r = 2 to r = 4 at a user-controlled speed, with both panels animating together.
- Histogram overlay on bifurcation panel showing the distribution of attractor points in a sliding r window (density of states in the chaotic region).
- Floating-point precision stress test: toggle double vs. single precision to visualize round-off error accumulation in the chaotic regime.
- Full-screen Lyapunov exponent heatmap: r vs. log(|dx|) showing divergence rates as a 2D color field.

## Aesthetic deviations

- The bifurcation density panel uses a monochrome ramp from `--surface` to `--fg`, not the project default `viridis` colormap. Bifurcation diagrams are conventionally drawn as black-ink density plots in the chaos literature (Strogatz Section 10.2 Logistic Map: Numerics figure, Newman Exercise 3.6 figures); a multi-hue colormap obscures the period-doubling structure. The single-channel scalar (orbit count per pixel) is well-represented by a perceptually monotonic monochrome ramp.

## Risk register

1. **Period detection ambiguity near bifurcations and accumulation points.** Transient decay time grows as $r_n - r \to 0$; a 256-iteration burn-in may be insufficient to distinguish a period-64 orbit from chaos. Mitigation: fold-tolerance on $|x_n - x_{n+T}|$ at $10^{-8}$, cap reported period at $2^6 = 64$, fall through to "chaotic" beyond. The Feigenbaum invariant test sidesteps this entirely by using multiplier-bisection, which does not depend on period detection.

2. **Bifurcation panel rendering budget.** A dense sweep ($4 \times 10^3$ r values, 456 iterations each, $\sim 2 \times 10^6$ ops) computed every drag event will exceed the 60 fps budget. Mitigation: render the bifurcation panel once into an offscreen ImageData canvas at page load and cache. Only redraw on zoom changes (new r window). The cobweb panel and live readouts redraw on drag.

3. **Lyapunov ln-of-zero singularity at r = 4.** Without guarding against $|f'(x_n)| = 0$ near $x_n = 1/2$, the Lyapunov sum collects a $-\infty$ on the first close approach (expected within tens of iterations) and poisons the estimate. Mitigation: skip terms with $|f'(x_n)| < 10^{-12}$ and decrement N. Implemented as a single conditional in the inner loop.
