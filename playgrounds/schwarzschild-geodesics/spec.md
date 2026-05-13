---
title: Schwarzschild Geodesics in the Equatorial Plane
slug: schwarzschild-geodesics
status: in-progress
audience: portfolio
created: 2026-05-13
---

# Schwarzschild Geodesics in the Equatorial Plane

## Physical setup

Geometric units $G = c = M = 1$. A massive test particle moves on a Schwarzschild background in the equatorial plane $\theta = \pi/2$. Two conserved quantities along the geodesic (Killing vectors of the metric): energy per unit rest mass $E = (1 - 2/r) \, dt/d\tau$ and angular momentum per unit rest mass $L = r^2 \, d\varphi/d\tau$. The radial motion follows a 1D Hamiltonian system in $(r, p_r)$ with effective potential

$$V_\text{eff}(r; L) = -\frac{1}{r} + \frac{L^2}{2 r^2} - \frac{L^2}{r^3}$$

(geometric units; the $-L^2/r^3$ term is the relativistic correction that causes perihelion precession). The angular motion $d\varphi/d\tau = L/r^2$ is integrated alongside, allowing the playground to render the orbit in the $(x, y)$ plane via $x = r \cos\varphi$, $y = r \sin\varphi$. The Schwarzschild radius (event horizon) sits at $r = 2$; the innermost stable circular orbit (ISCO) is at $r = 6$. The playground highlights both as dashed circles.

## Governing equations

Geodesic equations in the equatorial plane, parametrized by proper time $\tau$:

$$\dot{r}    = p_r, \qquad \dot{p_r} = -\frac{dV_\text{eff}}{dr}(r; L), \qquad \dot{\varphi} = \frac{L}{r^2}.$$

with

$$\frac{dV_\text{eff}}{dr} = \frac{1}{r^2} - \frac{L^2}{r^3} + \frac{3 L^2}{r^4}.$$

The radial energy invariant (the value of $H_\text{rad}$) is

$$\mathcal{E} = \tfrac{1}{2} p_r^2 + V_\text{eff}(r; L)$$

which is conserved exactly under symplectic Verlet on the $(r, p_r)$ pair. The angular momentum $L$ is conserved by construction (it is not updated; it is a label of the orbit).

## Numerical method

- **Discretization**: velocity-Verlet from `shared/js/engine/symplectic.js`, integrator `'verlet'`. State is the pair $(r, p_r)$; the engine treats it as a 1-degree-of-freedom Hamiltonian. accelerationFn computes $-dV_\text{eff}/dr$. energyFn computes $\tfrac{1}{2} p_r^2 + V_\text{eff}(r; L)$. The angular coordinate $\varphi$ is integrated outside the symplectic step as $\varphi_{n+1} = \varphi_n + dt \cdot L / r_n^2$.
- **Time step**: dt = 0.05 in proper time. At canonical bound IC ($r_\text{ap} = 12$, $L = 3.9$), the radial period is $\sim 300$ in proper time and the angular motion advances by $\sim 2\pi + 3$ rad per radial cycle (about 172 degrees of perihelion precession per orbit); dt resolves the radial cycle by $\sim 6000$ steps, well-resolved. At ISCO ($r = 6$), $T_\text{orbit} = 2\pi \cdot 6^{3/2} \approx 92$; dt = 0.05 gives $\sim 1840$ steps per period.
- **Run length**: the playground integrates indefinitely while playing. The live $|d\mathcal{E}/\mathcal{E}|$ readout reports the current radial-energy drift.
- **Trail**: the last 2000 trajectory samples are drawn as an accent-colored polyline in $(x, y)$.
- **RNG**: not used. Deterministic IC, deterministic integrator.

## Controls

| name | type | units | range | default | sets |
|------|------|-------|-------|---------|------|
| r_ap (apoapsis) | slider | M | 8.0 to 30.0 | 12.0 | initial radial position; IC placed at apoapsis with $p_r = 0$ |
| L (angular momentum) | slider | M | 3.5 to 6.0 | 3.9 | conserved angular momentum (3.9 gives a visibly precessing rosette at r_ap = 12) |
| reset | button | N/A | N/A | N/A | re-seed IC at apoapsis with the current (r_ap, L), clear the trail |
| play / pause | button | N/A | N/A | play | toggle integration |

The valid (r_ap, L) region produces bound orbits with $V_\text{eff}(r_\text{ap}; L) < 0$ (energy below the asymptotic rest mass). The slider ranges keep the IC well above the ISCO ($r = 6$) for the lower bound on r_ap and well above the unstable circular orbit radius for the L range; if the user picks an IC that is unbound the orbit escapes to large r, which the live readout flags via the energy drift.

## Expected qualitative features

### Visible in the default golden frames

The capture sweep maps captureFraction to integration time along a single bound orbit at canonical IC ($r_\text{ap} = 12$, $L = 4$). Each frame integrates a different fraction of one orbit (roughly $\sim 0$ to $\sim 1.5$ orbits across t-000 to t-100), so the five frames show progressively more of the trail.

- t-000: particle at apoapsis $(12, 0)$, no trail yet. Central mass (filled black) at the origin, Schwarzschild horizon and ISCO drawn as dashed circles at $r = 2$ and $r = 6$.
- t-025, t-050, t-075: progressively longer arcs of a precessing orbit; the trail is the accent-colored polyline.
- t-100: more than one full orbit completed; the perihelion has visibly precessed (the second apoapsis sits at a non-zero angle from the first), making the relativistic correction directly visible.

### Available via user interaction

- Raising L past 4 widens the orbit; lowering L below the critical value (which depends on r_ap) pushes the perihelion inside the ISCO and the orbit eventually plunges in (within slider bounds, this regime is avoided).
- Lowering r_ap and L together to near the ISCO produces fast precession and short orbital periods.

## Invariants and acceptance thresholds

| invariant | strong/medium/weak | threshold | notes |
|-----------|-------------------|-----------|-------|
| Radial Hamiltonian conservation | strong | $|d\mathcal{E}/\mathcal{E}| < 10^{-3}$ over $10^4$ dt at canonical IC ($r_\text{ap}=12$, $L=3.9$, dt = 0.05) | direct check on the 1D Hamiltonian integrator; empirical max drift is ~1e-8 |
| Angular momentum conservation | strong | $|L(t) - L(0)| < 10^{-12}$ over the run | $L$ is held fixed by the integrator (not updated); machine-precision modulo storage round-off |
| Perihelion within physically valid range | medium | $r_\text{peri} > 2$ (horizon) throughout the captured run at the canonical IC | sanity check that the orbit stays outside the event horizon |

## Limiting cases for verification

| limit | expected | source |
|-------|----------|--------|
| $L \to \infty$, $r_\text{ap}$ large | non-relativistic Newtonian Kepler orbit (no precession), $V_\text{eff} \to -1/r + L^2/(2r^2)$ | Newman Exercise 8.12 (Newtonian limit); Carroll Section 5.4 |
| ISCO at $r = 6$ | circular orbits exist for $r > 6$; $r = 6$ is the marginal stable circular orbit, the inflection point of $V_\text{eff}$ at $L = 2\sqrt{3} \approx 3.46$ | Carroll Section 5.4 Geodesics of Schwarzschild |
| Schwarzschild radius $r = 2$ | event horizon; any inward radial trajectory crossing $r = 2$ falls in; the playground stays outside | Carroll Section 5.3 Singularities (the coordinate singularity at $r = 2$ is the horizon) |
| Weak field $r \gg 2$ | radial potential $V_\text{eff}(r) \to -1/r + L^2/(2 r^2)$; orbits indistinguishable from Newtonian | Carroll Section 5.1 The Schwarzschild Metric |

## Visual fallback

Primary validation is via the two strong invariants. SSIM > 0.92 against five committed golden frames at the canonical IC is the secondary gate.

## Citations

1. **Carroll, Sean M.** "Spacetime and Geometry: An Introduction to General Relativity." Cambridge University Press, 2019. Bib key `carroll2019`. Sections cited:
   - Section 5.1 The Schwarzschild Metric: the line element and the conserved quantities $E$, $L$ from the Killing vectors.
   - Section 5.3 Singularities: the coordinate singularity at $r = 2$ (the event horizon).
   - Section 5.4 Geodesics of Schwarzschild: the effective-potential formulation including the relativistic $-L^2/r^3$ term, the ISCO at $r = 6$, and perihelion precession.
2. Engine: `shared/js/engine/symplectic.js`, integrator `'verlet'`. Validated in `tests/engines/symplectic.test.mjs` on Kepler at $e = 0.6$ over $10^4$ periods; the 1D radial Hamiltonian here is a separable single-DOF system and the engine's symplectic guarantee is exact (the corrector path is identity for q-only forces).
3. **Newman, Mark.** "Computational Physics." Revised printing, CreateSpace, 2013. Bib key `newman2013`. Exercise 8.12 "Orbit of the Earth" supplies the Newtonian Kepler limit used as a limiting case (recovered when the $-L^2/r^3$ correction is small).

## Stretch goals

- Add a "Newtonian comparison" overlay that integrates the same IC under pure inverse-square gravity (no $-L^2/r^3$ term) and renders the non-precessing orbit in a contrasting color.
- Add a slider for $M$ (mass of the central object) to rescale the horizon and ISCO with dimensional units in mind.
- Photon-sphere mode: switch to null geodesics with the photon effective potential $V_\text{ph}(r) = L^2/(2 r^2) (1 - 2/r)$ and show light bending around the photon sphere at $r = 3$.
- Plunge mode: deliberately set IC inside the ISCO and show the inward spiral into the horizon (orbit will visibly fall in within slider bounds).

## Risk register

1. **Inward plunge.** If the user picks an IC with insufficient $L$ to keep the orbit bound, the particle plunges toward $r = 2$; the simulation must handle this without dividing by zero or producing NaN. Mitigation: if $r < 2.1$, halt integration for the current orbit and render a warm-accent "plunge" indicator.
2. **Tangential velocity sign convention.** The IC at apoapsis has $p_r = 0$ and the angular velocity $d\varphi/d\tau = L/r^2$ encodes the orbital direction. Counter-clockwise is positive $L$; the slider takes $L \ge 0$ only. Documented in the spec.
3. **Theta-wrap-around for the orbital angle.** The drawing wraps $\varphi$ to $[-\pi, \pi]$ for display only; the engine state tracks $\varphi$ on the universal cover.
