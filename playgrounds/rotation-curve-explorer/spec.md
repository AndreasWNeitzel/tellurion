---
title: Rotation Curve Explorer
slug: rotation-curve-explorer
status: in-progress
audience: portfolio
created: 2026-05-13
---

# Rotation Curve Explorer

## Physical setup

A model spiral galaxy is decomposed into three mass components, each contributing an axisymmetric circular velocity squared at radius $R$:

- Bulge: Hernquist profile, $v_b^2(R) = G M_b R / (R + a_b)^2$.
- Disk: Miyamoto-Nagai with $z = 0$, $v_d^2(R) = G M_d R^2 / (R^2 + (a_d + b_d)^2)^{3/2}$.
- Halo: NFW, $v_h^2(R) = G M_{200} / R \cdot [\ln(1 + R/r_s) - (R/r_s)/(1 + R/r_s)] / [\ln(1 + c) - c/(1 + c)]$, where $r_s = R_{200} / c$ and $R_{200}$ is set by $M_{200}$.

The total circular velocity at each $R$ is $v(R) = \sqrt{v_b^2 + v_d^2 + v_h^2}$. The playground generates a synthetic "ground truth" rotation curve with fixed parameters and adds a small Gaussian noise floor at each radius. The user adjusts sliders for the mass and scale of each component to fit the synthetic data; the chi-squared misfit is reported live.

Units: $R$ in kpc; $v$ in km/s; masses in $10^{10} M_\odot$. $G$ is taken in the consistent unit system so that $G M / r$ has units of (km/s)$^2$ with $G = 4.302 \times 10^{-6}$ in (kpc) (km/s)$^2$ / $M_\odot$, or $G \approx 4.302 \times 10^4$ in (kpc) (km/s)$^2$ / ($10^{10} M_\odot$).

## Governing equations

Hernquist bulge (Binney-Tremaine Section 2.2):

$$\Phi_b(R) = -\frac{G M_b}{R + a_b}, \qquad v_b^2(R) = -R \frac{d\Phi_b}{dR} = \frac{G M_b R}{(R + a_b)^2}.$$

Miyamoto-Nagai disk evaluated in the equatorial plane ($z = 0$; Binney-Tremaine Section 2.3):

$$\Phi_d(R, 0) = -\frac{G M_d}{\sqrt{R^2 + (a_d + b_d)^2}}, \qquad v_d^2(R) = \frac{G M_d R^2}{(R^2 + (a_d + b_d)^2)^{3/2}}.$$

NFW halo (Binney-Tremaine Section 2.2; the dimensionless mass profile $g(c) = \ln(1+c) - c/(1+c)$):

$$v_h^2(R) = \frac{G M_{200}}{R} \cdot \frac{\ln(1 + R/r_s) - (R/r_s)/(1 + R/r_s)}{g(c)}.$$

Total: $v(R) = \sqrt{v_b^2(R) + v_d^2(R) + v_h^2(R)}$.

## Numerical method

- **Discretization**: closed-form analytic profiles; no ODE or PDE integration. Each velocity component is one floating-point evaluation per radius.
- **Synthetic data set**: 18 radii log-spaced in $R \in [1, 50]$ kpc. True parameters (frozen): $M_b = 1 \times 10^{10} M_\odot$, $a_b = 0.5$ kpc; $M_d = 6 \times 10^{10} M_\odot$, $a_d = 4$ kpc, $b_d = 0.3$ kpc; $M_{200} = 1.5 \times 10^{12} M_\odot$, $c = 12$. Noise floor 4 km/s Gaussian per radius, seeded at 0xC0FFEE so the data set is deterministic.
- **Chi-squared metric**: $\chi^2 = \sum_i ((v_\text{obs}(R_i) - v_\text{model}(R_i; \theta)) / \sigma_i)^2$ with $\sigma_i = 4$ km/s. Reported live as the user adjusts sliders. The reduced chi-squared is $\chi^2 / (N_\text{points} - N_\text{params})$.
- **RNG**: `shared/js/render/rng.js` seeded at 0xC0FFEE for the noise draws. No randomness elsewhere.

## Controls

| name | type | units | range | default | sets |
|------|------|-------|-------|---------|------|
| M_b (bulge mass) | slider | $10^{10} M_\odot$ | 0.1 to 10 | 1.0 | Hernquist bulge mass |
| M_d (disk mass) | slider | $10^{10} M_\odot$ | 1 to 20 | 6.0 | Miyamoto-Nagai disk mass |
| M_200 (halo mass) | slider | $10^{12} M_\odot$ | 0.3 to 5 | 1.5 | NFW virial mass |
| c (halo concentration) | slider | dimensionless | 5 to 20 | 12 | NFW concentration parameter |
| reset | button | N/A | N/A | N/A | restore all sliders to the true-parameter values |

Scale lengths $a_b$, $a_d$, $b_d$ are fixed at their true values; only the four mass-and-concentration parameters are free in v1. (Stretch goal: open up scale-length sliders.)

## Expected qualitative features

### Visible in the default golden frames

The captureFraction sweep maps to the halo mass: $M_{200}$ varies from 0.3 (frac=0) to 5.0 (frac=1) while the other three sliders stay at their true values. The five frames show:

- t-000 ($M_{200} = 0.3$): halo curve well below the data; the total curve falls short at large $R$.
- t-025 ($M_{200} \approx 1.5$): halo + disk + bulge close to the true synthetic curve; data points lie on the model curve.
- t-050 ($M_{200} \approx 2.7$): halo dominates, the model overshoots at large $R$.
- t-075 ($M_{200} \approx 3.8$): halo over-large; chi^2 grows.
- t-100 ($M_{200} = 5.0$): worst over-fit; the total curve is well above the data at $R > 10$ kpc.

In every frame the synthetic data points are dark dots with error bars; the three component curves are colored ($--cat-1$, $--cat-2$, $--cat-3$); the total curve is the accent color.

### Available via user interaction

- Drag $M_{200}$ down to 0.3 and watch the outer rotation curve fall short of the data; flat curves indicate the halo dominance.
- Drag $c$ down to 5 to see the concentration parameter spread the halo mass out, lowering the inner rotation; up to 20 to concentrate it inward.
- The live chi^2 readout marks the goodness of fit; the lowest chi^2 occurs when all four sliders are at their true values.

## Invariants and acceptance thresholds

| invariant | strong/medium/weak | threshold | notes |
|-----------|-------------------|-----------|-------|
| Chi-squared at true parameters | strong | $\chi^2 / (N - 4) < 2.0$ when sliders are at the true values | with $N = 18$ data points and noise $\sigma = 4$ km/s, expected reduced $\chi^2$ is ~ 1 with standard deviation ~ sqrt(2/(N-4)) ~ 0.38; bound 2.0 absorbs single-seed statistical fluctuation |
| Synthetic data deterministic | strong | identical noise draws on repeated runs at seed 0xC0FFEE | guards against RNG drift |
| Asymptotic flatness | medium | with all components at true values, $v(R)$ varies by less than 30 km/s over $R \in [10, 50]$ kpc | the flat-rotation regime is the qualitative signature of a halo-dominated outer disk |

## Limiting cases for verification

| limit | expected | source |
|-------|----------|--------|
| $M_b = M_d = 0$, NFW only | rotation curve rises and flattens at $r_s$; this is the characteristic NFW signature | Binney-Tremaine Section 2.2 |
| $M_b = M_{200} = 0$, disk only | rotation rises and then falls $\propto 1/\sqrt{R}$ at large $R$ (Keplerian) | Binney-Tremaine Section 2.3 |
| $M_d = M_{200} = 0$, bulge only | Hernquist rotation rises and falls; peaks at $R \sim a_b$ | Binney-Tremaine Section 2.2 |
| Small $R$ inside the bulge | $v(R) \to \sqrt{G M_b / a_b^2} R$, linear rise | Binney-Tremaine Section 2.2 |

## Visual fallback

Primary validation is via the chi-squared invariant. SSIM > 0.92 against five committed golden frames at the halo-mass sweep is the secondary gate.

## Citations

1. **Binney, James and Tremaine, Scott.** "Galactic Dynamics", 2nd ed., Princeton University Press, 2008. Bib key `binneytremaine2008`. Sections cited:
   - Section 2.2 Spherical systems: Hernquist and NFW profiles, including the dimensionless NFW mass profile $g(c) = \ln(1 + c) - c/(1+c)$.
   - Section 2.3 Potential-density pairs for flattened systems: Miyamoto-Nagai disk evaluated at $z = 0$.
   Both sections are in chapter_index (added this session).
2. The synthetic data values and noise floor were chosen by the spec author to produce a typical massive-spiral rotation curve; no observational data set is used. Real observational rotation curves are published in e.g. de Blok et al. 2008 (SPARC sample), but that paper is not in the project bibliography so the playground does not reproduce or fit real data; the implementation is illustrative.

## Stretch goals

- Free up the scale-length sliders ($a_b$, $a_d$, $b_d$, $r_s$) and concentration so the user can tune all seven free parameters.
- Add residual panel below the main rotation curve.
- Toggle "real data" mode that loads an observed rotation curve (would require adding a published SPARC paper to the bibliography first).
- Bayesian credible-interval mode using the chi-squared as a likelihood.
- Component-separation visualization: dim the contributions in turn to show each component's signature.

## Risk register

1. **Floor-degeneracy of disk mass vs halo concentration.** The disk-mass slider and halo concentration are partially degenerate at the radii probed by the synthetic data set; multiple parameter combinations can give similar chi-squared. Mitigation: documented; the playground is exploratory, not a publication-grade fitter.
2. **NFW $g(c)$ singular as $c \to 0$.** The dimensionless NFW mass profile is well-defined for $c > 0$ but the implementation guards against $c < 1$ where $g(c)$ can underflow. Mitigation: slider range starts at $c = 5$.
3. **Asymptotic behavior at very small or very large $R$.** Outside the data range, the model is extrapolative; the readout reports chi^2 only over the data radii. The plot still extends to $R = 60$ kpc for visual context.
