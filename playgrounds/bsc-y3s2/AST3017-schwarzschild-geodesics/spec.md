---
title: Schwarzschild Light Bending
slug: schwarzschild-geodesics
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: AST3017
supporting_ucs: []
curriculum_year: bsc-y3s2
---

# Schwarzschild Light Bending

## Physical setup

A horizontal plane wave of photons enters from the left and encounters a non-rotating black hole of mass $M = 1$ in the equatorial plane. Geometric units $G = c = M = 1$. Each photon is a null geodesic with two conserved quantities (Killing vectors of the Schwarzschild metric): energy $E$ and angular momentum $L$. The orbital fate is determined entirely by the impact parameter $b = L / E$; photons with $|b| < b_\text{crit} \equiv 3 \sqrt{3} \approx 5.196$ cross the photon sphere at $r = 3$ and are swallowed by the horizon at $r = 2$, while photons with $|b| > b_\text{crit}$ are deflected. Photons with $|b|$ just above $b_\text{crit}$ loop the photon sphere multiple times before escaping; photons with $|b|$ far above $b_\text{crit}$ are weakly deflected by $\sim 4M/b$ rad.

## Governing equations

For null geodesics in Schwarzschild, the radial motion reduces to a 1D Hamiltonian system in $(r, p_r)$ with affine parameter $\lambda$:

$$\frac{1}{2} p_r^2 + V_\text{null}(r; L) = \tfrac{1}{2} E^2, \qquad V_\text{null}(r; L) = \frac{L^2}{2 r^2} \left( 1 - \frac{2}{r} \right).$$

The angular coordinate satisfies $d\varphi / d\lambda = L / r^2$. With $E = 1$, the impact parameter equals $L$; the playground uses $|L| = b$ and tracks $\varphi$ along the orbit. The potential $V_\text{null}$ has a single critical point at $r = 3$ (the photon sphere, $dV/dr = 0$), where $V = L^2 / 54$. Marginal capture corresponds to $V_\text{null}(3, L) = E^2/2 = 1/2$, yielding $L^2 = 27$ and the critical impact parameter $b_\text{crit} = 3\sqrt{3}$.

## Numerical method

- **Discretization**: velocity-Verlet from `shared/js/engine/symplectic.js`, integrator `'verlet'`. State is a Float64Array of N radial positions; each photon $i$ has its own conserved $L_i$ supplied through closure in accelerationFn. The angular coordinate $\varphi_i$ is advanced as $\varphi_{i, n+1} = \varphi_{i, n} + dt \cdot L_i / r_i^2$ outside the symplectic loop.
- **Time step**: dt = 0.05. Near the photon sphere the local timescale is $\tau \sim r = 3$, so dt resolves it well; for the critical orbit at $b = b_\text{crit}$ the integration time is bounded by an integration cap of 20000 steps.
- **Initial conditions**: each photon enters at $x = -x_\infty = -12$, $y = b$, with $p_r$ computed from the null condition. The energy $(1/2) E^2 = 1/2$ is conserved by symplectic Verlet.
- **Fate logic**: a photon is SWALLOWED when $r < 2.05$; DEFLECTED when $r > x_\infty + 2 = 14$.
- **Photon set**: N = 41 by default, impact parameters distributed with mild bunching near critical (cube-root spacing) so the steep-deflection regime is well sampled.
- **RNG**: not used.

## Controls

| name | type | units | range | default | sets |
|------|------|-------|-------|---------|------|
| N (photons) | slider | dimensionless | 11 to 81 | 41 | number of photons in the plane wave |
| b_max | slider | M | 3 to 12 | 9 | half-width of the impact-parameter range |
| reset | button | N/A | N/A | N/A | restore default sliders |

## Expected qualitative features

### Visible in the default golden frames

The playground animates the swarm at SUBSTEPS_PER_FRAME = 12 steps per requestAnimationFrame call. The captureFraction sweep maps to simulation time, holding (N, b_max) = (41, 9) constant; t-000 to t-100 cover [0, CAPTURE_TOTAL_STEPS = 1500] integration steps:

- t-000: plane wave just released at x = -12 (all photons at left edge, no trails yet beyond the seed point).
- t-025: photons approaching the BH; some inner photons already past r = 3.
- t-050: critical photons winding around the photon sphere; outer photons begin deflecting back to infinity.
- t-075: most photons resolved, the swallowed-vs-deflected fan visible.
- t-100: terminal state, all but the b -> b_crit photons resolved; a few may still be running.

Every frame shows:

- Black filled disk at the origin (event horizon r = 2).
- Dashed circle at r = 3 (photon sphere).
- Red trails for photons swallowed by the horizon.
- Blue trails for photons that escape past x = 14.
- Dark dots at the leading edge of any photon still RUNNING (gray trail behind it).
- Photons near $b_\text{crit} = 5.196$ visibly loop the photon sphere one or more times before deciding their fate.

### Available via user interaction

- Increase N to fill in the impact-parameter density. Near $|b| \sim b_\text{crit}$ the deflection angle is very sensitive to $b$, producing a characteristic fan of trails.
- Reduce b_max to focus on the critical region; the boundary between red and blue trails sharpens.

## Invariants and acceptance thresholds

| invariant | strong/medium/weak | threshold | notes |
|-----------|-------------------|-----------|-------|
| Critical impact parameter | strong | photons at $|b| = 4$ are swallowed; photons at $|b| = 7$ are deflected; the boundary lies at $|b| = 3\sqrt{3}$ within $\pm 0.1$ | direct check of the analytic photon-sphere result |
| Weak-field deflection scaling | strong | at $b = 12$, deflection angle $\Delta \varphi - \pi \approx 4 M / b = 1/3 \approx 0.33$ rad within 30 percent (small-angle approximation breaks down for our $b/M$ values) | Carroll Section 5.4 weak-field result |
| Photon sphere loop count | medium | photons at $|b| - b_\text{crit} \sim 0.05$ accumulate at least one full $2\pi$ loop near r = 3 before fate | the diverging-time signature of the unstable circular orbit at r = 3 |

## Limiting cases for verification

| limit | expected | source |
|-------|----------|--------|
| $b = 0$ (head-on) | photon plunges radially to r = 2 in finite affine time | trivial null geodesic |
| $b \to \infty$ | photon moves on a straight line (deflection angle $\to 0$) | flat-space limit |
| $|b| > b_\text{crit}$, far above | weak-field deflection $\Delta \varphi \approx 4 M / b$ | Carroll Section 5.4 |
| $|b| \to b_\text{crit}^+$ | photon loops the photon sphere with increasing winding number; escape angle diverges logarithmically | Carroll Section 5.4 |

## Visual fallback

Primary validation is via the critical-impact-parameter and weak-field tests. SSIM > 0.92 against committed golden frames is the secondary gate.

## Aesthetic waivers

1. **Dual accent colors (red + blue) used simultaneously.** The standard says "one accent color at any time". Here the dual encoding is essential pedagogy: red for swallowed photons, blue for deflected, with the boundary at $b_\text{crit}$ being the entire point of the playground. Replacing one with a grayscale tint would collapse the most important visual signal. Approved as a deliberate departure for fate-distinction diagrams.
2. **Canvas 2D text at 11 px hard-coded.** Canvas 2D does not inherit CSS variables; the `ctx.font` string requires literal `Npx`. The token system applies to DOM text only. This is a runtime constraint, not a stylistic choice.

## Citations

1. **Carroll, Sean M.** "Spacetime and Geometry: An Introduction to General Relativity." Cambridge University Press, 2019. Bib key `carroll2019`. Sections:
   - Section 5.1 The Schwarzschild Metric: line element and Killing-vector conserved quantities $E$ and $L$.
   - Section 5.3 Singularities: event horizon at $r = 2$ (coordinate singularity).
   - Section 5.4 Geodesics of Schwarzschild: null effective potential, photon sphere $r = 3$, weak-field deflection $4 M / b$.
   Verified in chapter_index.
2. Engine: `shared/js/engine/symplectic.js`, integrator `'verlet'`. The radial null-geodesic Hamiltonian is q-only separable; symplectic Verlet is exact (no corrector path engaged).

## Stretch goals

- Animate the photons (instead of pre-rendered trails) so the user watches the wave arrive at the BH and split into swallowed and deflected fates.
- Vertical-sweep slider that emits a Gaussian wave packet at the horizon instead of an infinite plane.
- "Light bending angle" panel plotting $\Delta\varphi(b)$ alongside the spatial trail panel; the curve diverges at $b_\text{crit}$.
- Add timelike geodesics back as a toggle (the prior single-orbit pedagogy from this same playground).
- Add a Kerr-spin toggle once Carroll Chapter 6 (rotating black holes) has its subsections added to chapter_index.

## Risk register

1. **Numerical singularity near r = 2.** Photons swallowed by the horizon experience diverging gradients of $V_\text{null}$ at $r \to 2$ (where $V_\text{null} \to 0$ but $dV/dr$ blows up only as a finite-rank derivative; the photon reaches $r = 2$ in finite affine parameter). Mitigation: terminate integration at $r < 2.05$ and mark SWALLOWED.
2. **Critical-impact-parameter sensitivity.** Photons with $|b|$ within $10^{-3}$ of $b_\text{crit}$ require very many integration steps to resolve (winding number diverges logarithmically). Mitigation: cap integration at 20000 steps; photons that reach the cap are classified by their current $r$ at the cap.
3. **Backward propagation in the deflected branch.** Some deflected photons emerge from the BH region moving back toward $x < 0$ (180-degree turn). The escape test $r > x_\infty + 2$ handles this correctly because $r$ exceeds the threshold regardless of the sign of $x$.
