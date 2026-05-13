---
title: Rotation Curve Explorer
slug: rotation-curve-explorer
status: in-progress
audience: portfolio
created: 2026-05-13
---

# Rotation Curve Explorer

## Physical setup

A face-on synthetic spiral galaxy with a Hernquist bulge ($M_b = 10^{10} M_\odot$, $a_b = 0.5$ kpc) and a Miyamoto-Nagai disk ($M_d = 6 \times 10^{10} M_\odot$, $a_d = 4$ kpc, $b_d = 0.3$ kpc), seen from above. The same visible mass is present in all three models; what changes is the assumption about unseen mass.

Three rotation-curve models share the visible-matter inventory:

1. **Keplerian (point mass)**: the entire visible mass is concentrated at the centre, giving $v(R) = \sqrt{G M_\text{tot} / R}$ outside the central cap.
2. **Visible matter only**: bulge plus disk, no halo.
3. **Visible + dark matter**: bulge plus disk plus an NFW halo ($M_{200} = 1.5 \times 10^{12} M_\odot$, $c = 12$).

The synthetic observation set was drawn from model 3 (the truth) at 16 log-spaced radii in $[1, 28]$ kpc with $\sigma = 6$ km/s Gaussian noise. The pedagogy is that only model 3 fits the data at $R > 10$ kpc.

## Governing equations

For each visible component:

$$v_b^2(R) = \frac{G M_b R}{(R + a_b)^2}, \qquad v_d^2(R) = \frac{G M_d R^2}{(R^2 + (a_d + b_d)^2)^{3/2}}.$$

The NFW halo contributes

$$v_h^2(R) = \frac{G M_{200}}{R} \frac{\ln(1+x) - x/(1+x)}{\ln(1+c) - c/(1+c)}, \quad x = R / r_s, \quad r_s = R_{200}/c, \quad R_{200} = 206 (M_{200}/10^{12})^{1/3} \text{ kpc}.$$

The total $v(R)^2$ for each model is the sum of its components. Angular speed is $\Omega(R) = v(R) / R$; for tracer stars in the top-down view we use $\Omega(R) = 1.022 \, v(R) / R$ rad/Gyr (the 1.022 converts km/s to kpc/Gyr).

## Numerical method

- **No integration**. All component velocity profiles are evaluated in closed form.
- **Tracer stars**: 4 spiral arms with 80 stars each, log-spaced in radius from 1 to 25 kpc, phase $\varphi_i = \varphi_\text{arm} + 0.55 \ln(R / R_\text{min})$ with azimuthal scatter $\sigma_\varphi = 0.07$ rad and radial scatter $\sigma_R = 0.18$ kpc. Plus 140 bulge stars sampled from a Gaussian cloud with FWHM 1.5 kpc.
- **Animation**: stars advance as $\varphi(t) = \varphi_0 + \Omega(R) \cdot t$. Time advances 0.012 Gyr per requestAnimationFrame call, looping back to zero at $t = 2.5$ Gyr. The captureFraction sweep maps to $t \in [0, 1.8]$ Gyr.
- **Seed**: 0xC0FFEE drives the tracer-star positions and the synthetic observation noise.

## Controls

| name | type | sets |
|------|------|------|
| Model radio (3 buttons) | radio | rotation-curve model: keplerian, visible, or dm |
| Pause/Play | button | freeze/resume the time advance |
| Reset t | button | set t = 0 |

The captureFraction URL parameter sweeps simulation time; an optional captureModel parameter selects which model is captured (default: dm).

## Expected qualitative features

### In the default golden frames

The captureFraction sweep holds the model fixed at `dm` and varies $t \in [0, 1.8]$ Gyr. Every frame shows:

- A circular galaxy panel on the left with bulge (red) and disk (dark) tracer stars in a 4-arm spiral pattern.
- A solar-circle dashed ring at $R = 8$ kpc.
- A single highlighted tracer at $R = 8$ kpc in the active-model accent colour, orbiting at $\Omega_\text{dm}(8)$ rad/Gyr.
- An inset rotation curve panel on the right plotting all three model curves plus the 16 synthetic observations with error bars. The active-model curve is bold.
- A legend below the inset and a live readout (model, t, v(R=8), $\chi^2$) in the top-right.

At $t = 0$ the spiral arms are crisp; at $t = 1.8$ Gyr they have wound up enough to be visually distinct from the IC. The solar-circle tracer completes roughly $0.4 / 0.22 \approx 8$ orbits in this interval.

### Through user interaction

- Switch to Keplerian: the rotation curve drops as $R^{-1/2}$, the outer tracers slow dramatically, and the inset shows the data points sitting well above the curve at $R > 10$ kpc.
- Switch to visible-only: the outer rotation curve declines moderately; the data still lie above the curve, demonstrating the missing-mass problem.
- Switch back to DM: the curve flattens at $\sim 200$ km/s and tracks the data.

## Invariants and acceptance thresholds

| invariant | strong/medium | threshold | notes |
|-----------|---------------|-----------|-------|
| DM model fits its own data | strong | $\chi^2 / N < 2$ | by construction |
| Keplerian fit quality | strong | $\chi^2_\text{kepler} > 50 \chi^2_\text{dm}$ | outer stars far too slow |
| Visible-only fit quality | strong | $\chi^2_\text{visible} > 20 \chi^2_\text{dm}$ | declining $v(R)$ misses data |
| Galaxy radial preservation | strong | $|R(t) - R(0)| < 10^{-9}$ | circular orbits at fixed $R$ |
| DM-model asymptotic flatness | strong | $v_\max - v_\min < 35$ km/s on $[8, 28]$ kpc | NFW + Miyamoto-Nagai works out |
| Keplerian: $v^2 R = $ const | strong | $\le 10^{-6}$ relative drift between $R = 10$ and $R = 25$ | basic Kepler |
| Visible-only is below DM at large R | strong | $\Delta v(25) > 50$ km/s | unambiguous gap |
| Inner-galaxy degeneracy | medium | all three models within 30 percent at $R = 4$ kpc | bulge dominates here |

## Limiting cases

| limit | expected | source |
|-------|----------|--------|
| $R \to 0$ in Kepler | capped at $R = 0.5$ kpc to keep $\Omega$ finite | implementation detail |
| $R \to \infty$ in disk | $v_d \propto R^{-1/2}$ | Miyamoto-Nagai analytic |
| $R \to \infty$ in halo | $v_h \to 0$ slowly | NFW $\ln(1+x)/x \to 0$ |
| Solar circle ($R = 8$, DM) | $v \approx 220$ km/s, period $\approx 220$ Myr | Milky-Way benchmark |

## Aesthetic waivers

1. **Three categorical model colours plus the bulge accent.** Standard says one accent at a time. Here the three model curves and the bulge tracers must all be distinguishable; the three model colours come from the dedicated cat-1/cat-2/cat-3 categorical scale (built for exactly this), and the bulge tracer is in `--accent-warm`. Approved.
2. **Canvas 2D text at 10 px and 11 px hard-coded.** Same constraint as the schwarzschild playground: `ctx.font` does not inherit CSS variables.

## Citations

1. **Binney, J. and Tremaine, S.** "Galactic Dynamics", 2nd edition, Princeton, 2008. Bib key `binneytremaine2008`. Sections:
   - Section 2.1 (Spherical systems): Hernquist bulge potential.
   - Section 2.2 (Potential theory of axisymmetric systems): Miyamoto-Nagai disk.
   - Section 2.3 (Potential-density pairs for flattened systems): NFW halo.
   chapter_index verified.

## Stretch goals

- Add MOND as a fourth model and compare with the DM fit.
- Let the user drag the bulge or disk mass slider and watch the inset curve respond live.
- Add a thin-disk gravitational dragline (gas rotation curve from 21 cm) as an alternative data set.
