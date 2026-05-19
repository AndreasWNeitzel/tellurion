---
title: Rotation Curve Explorer
slug: rotation-curve-explorer
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: AST2004
supporting_ucs: [MAA-GD]
curriculum_year: bsc-y2s1
hook: 'Plot a galaxy''s rotation speed against radius: the visible matter predicts a falling curve, the data stays flat, and only a dark halo bridges the gap.'
one_paragraph: 'If a galaxy''s mass were only its visible bulge and disk, orbital speeds in the outskirts should fall off like a Kepler curve. The playground builds a synthetic galaxy (a Hernquist bulge plus a Miyamoto-Nagai disk) and pits three rotation-curve models against a noisy mock observation: a point-mass Keplerian curve, visible-matter-only, and visible plus an NFW dark-matter halo. The same visible mass sits in all three; only the halo model tracks the data beyond about 10 kpc, where the measured curve refuses to fall. This is the single cleanest classroom argument for dark matter. Reference: Carroll and Ostlie, An Introduction to Modern Astrophysics, Ch. 24; Navarro, Frenk and White 1996.'
tags: [stellar, exoplanets, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Rotation Curve Explorer

## Explainer

### What you are looking at

Measure how fast stars orbit at different distances from a galaxy's
center and plot speed versus radius: the rotation curve. Newtonian
gravity from the visible stars and gas predicts the speed should fall
off at large radius. It does not, it stays flat. That single stubborn
fact is the strongest everyday evidence for dark matter, and the
playground lets you fit the three competing models to mock data.

### Where the rotation-curve formula comes from

Stars in a galaxy's outer disc move on roughly circular orbits. The
centripetal acceleration $v_c^2/R$ equals the inward gravitational
acceleration from the enclosed mass:

$$\boxed{\;\frac{v_c^2(R)}{R} = \frac{G\,M(<R)}{R^2}
       \;\Longrightarrow\;
       v_c(R) = \sqrt{\frac{G\,M(<R)}{R}}.\;}$$

This is exact for a spherical mass distribution (Newton's shell
theorem) and a very good approximation for a thin disc once $R$ is
beyond the disc scale length.

### The expected falloff

If the visible matter were point-like at the centre, the outer speed
would be Keplerian:

$$v_K(R) = \sqrt{\frac{G\,M_\text{vis}}{R}} \;\propto\; \frac{1}{\sqrt R},$$

so doubling $R$ multiplies the speed by $1/\sqrt 2 \approx 0.71$. With
a realistic bulge (Hernquist 1990) and disc (Miyamoto and Nagai 1975):

- *Hernquist bulge*: $\Phi_b(R) = -G M_b / (R + a_b)$, contributing
  $v_b^2(R) = G M_b R / (R + a_b)^2$.
- *Miyamoto-Nagai disc* (axisymmetric, on the midplane $z = 0$):

$$\Phi_d(R, z = 0) = -\frac{G M_d}{\sqrt{R^2 + (a_d + b_d)^2}},
\quad
v_d^2(R) = \frac{G M_d\,R^2}{[R^2 + (a_d + b_d)^2]^{3/2}}.$$

Both turn over past the disc scale length and decline as $R^{-1/2}$
at large $R$. The data REFUSES to decline.

### Adding a dark-matter halo: NFW

The Navarro, Frenk and White (1997) profile is the cosmological
prediction for collisionless dark-matter halos:

$$\rho_{\rm NFW}(R) = \frac{\rho_s}{(R/r_s)\,(1 + R/r_s)^2},$$

with scale radius $r_s$ and characteristic density $\rho_s$. The
enclosed-mass integral gives

$$M_{\rm NFW}(<R) = 4\pi\,\rho_s\,r_s^3\,\bigg[\ln(1 + x) - \frac{x}{1 + x}\bigg],
\qquad x \equiv R / r_s,$$

so the halo contribution to the rotation curve is

$$\boxed{\;v_h^2(R) = \frac{G\,M_{200}}{R}\,
   \frac{\ln(1 + x) - x/(1+x)}{\ln(1 + c) - c/(1 + c)},
   \qquad c = R_{200} / r_s.\;}$$

Here $R_{200}$ is the radius at which the mean enclosed density is
200 times critical (the conventional virial radius), $M_{200}$ the
mass within it, and $c$ the concentration parameter.

The total curve is the quadrature sum:

$$v_{\rm tot}^2(R) = v_b^2(R) + v_d^2(R) + v_h^2(R).$$

At large $R$, $v_h^2$ approaches $G M_{\rm vir}/R$ slowly enough that
$v_{\rm tot}$ stays essentially flat over many disc scale lengths,
exactly matching the observed flatness in spiral galaxies.

### Symbols, at a glance

- $R$, galactocentric cylindrical radius (kpc).
- $v_c(R)$, circular speed at $R$ (km/s).
- $M(<R)$, mass enclosed within radius $R$.
- $M_b$, $a_b$, Hernquist bulge mass and scale length.
- $M_d$, $a_d$, $b_d$, Miyamoto-Nagai disc mass, radial and vertical
  scales.
- $\rho_s$, $r_s$, NFW characteristic density and scale radius.
- $R_{200}$, $M_{200}$, virial radius and mass; $c$, concentration.
- $G = 4.302 \times 10^{-6}\,\mathrm{kpc\,(km/s)^2\,M_\odot^{-1}}$ in
  the practical galactic-dynamics units.

### Things to try

- Toggle the Keplerian and visible-only models and watch them fall
  below the data at large radius.
- Switch on the dark halo and watch the curve flatten onto the points.
- Note all three models share the same visible mass: the data, not
  the stars, demand the halo.

### Bibliographic origin

The flat-rotation-curve evidence is in Rubin and Ford, *Astrophys. J.*
**159** (1970) 379 (Andromeda), extended to ~60 spirals in Rubin,
Ford and Thonnard, *Astrophys. J.* **238** (1980) 471. The original
papers for the components: Hernquist, *Astrophys. J.* **356** (1990)
359; Miyamoto and Nagai, *Publ. Astron. Soc. Japan* **27** (1975)
533; Navarro, Frenk and White, *Astrophys. J.* **490** (1997) 493
(the NFW profile, from cosmological N-body simulations). The textbook
synthesis is Binney and Tremaine, *Galactic Dynamics* (2nd ed.,
Princeton 2008), Ch. 2, with the dark-matter chapter in Sec. 2.6.

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
