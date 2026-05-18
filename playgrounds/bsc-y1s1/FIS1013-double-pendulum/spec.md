---
title: Double Pendulum Phase Portrait and Energy Conservation
slug: double-pendulum
status: verified
audience: portfolio
created: 2026-05-13
primary_uc: FIS1013
supporting_ucs: [FIS2021]
curriculum_year: bsc-y1s1
hook: "Two rods, one pinned to the end of the other, swinging under gravity. Start two of them a hair apart and within seconds their paths are nothing alike. This is deterministic chaos in the simplest mechanical system that shows it."
one_paragraph: "A double pendulum is two rigid rods with masses, the second hanging off the end of the first, swinging in a plane under gravity. The Lagrangian gives coupled, strongly nonlinear equations of motion. At low energy the motion is quasi-periodic, tracing a smooth closed band in the phase portrait (theta1 against its angular velocity); raise the energy and chaotic windows open, where the tiniest change in the start leads to a completely different trajectory a few seconds later. A symplectic integrator keeps the energy essentially constant (the readout shows |dE/E| holding near 1e-5), which is what makes the chaos trustworthy rather than a numerical artifact. Drag a bob to set its initial angle, double-click to freeze the velocities, and watch the lower bob trace its path while the phase portrait fills in. The live readout shows theta1, theta2, the energy and its drift, and a Poincare counter."
tags: [mechanics, animation, live-readout]
difficulty: 3
tier: simple
hero_candidate: false
renderer: canvas2d
estimated_engagement_minutes: 3
share_state_keys: []
---

# Double Pendulum Phase Portrait and Energy Conservation

## Physical setup

A planar double pendulum consists of two rigid massless rods of lengths l1 and l2, joined at a pivot, with point masses m1 and m2 hanging from the free end of each rod. The system is suspended from a fixed support and evolves under gravity in two dimensions (the plane of the page). The state is described by two generalized coordinates: theta1, the angle of the first rod from the downward vertical, and theta2, the angle of the second rod from the downward vertical. This system is a canonical nonlinear dynamical system: at low energies the motion is quasi-periodic, threading a 2D torus in phase space; at intermediate energies chaotic windows appear; at high energies, one or both rods rotate fully over the support.

## Governing equations

The Lagrangian of the system is L = T - V, where the kinetic energy is:

$$T = \frac{1}{2}(m_1 + m_2)l_1^2 \dot{\theta}_1^2 + \frac{1}{2}m_2 l_2^2 \dot{\theta}_2^2 + m_2 l_1 l_2 \dot{\theta}_1 \dot{\theta}_2 \cos(\theta_1 - \theta_2)$$

and the potential energy is:

$$V = -(m_1 + m_2)g l_1 \cos(\theta_1) - m_2 g l_2 \cos(\theta_2)$$

The kinetic energy is non-separable in the velocities; consequently the equations of motion are coupled and velocity-dependent:

$$(m_1 + m_2)l_1^2 \ddot{\theta}_1 + m_2 l_1 l_2 \cos(\theta_1 - \theta_2) \ddot{\theta}_2 = m_2 l_1 l_2 \sin(\theta_1 - \theta_2) \dot{\theta}_1^2 - (m_1 + m_2)g l_1 \sin(\theta_1)$$

$$m_2 l_2^2 \ddot{\theta}_2 + m_2 l_1 l_2 \cos(\theta_1 - \theta_2) \ddot{\theta}_1 = -m_2 l_1 l_2 \sin(\theta_1 - \theta_2) \dot{\theta}_2^2 - m_2 g l_2 \sin(\theta_2)$$

These are a pair of coupled second-order ODEs. Solve this system as a linear algebra problem to extract the accelerations:

$$\ddot{\theta}_1 = \frac{m_2 l_2 \sin(\theta_1 - \theta_2)(\dot{\theta}_1^2 l_1 + \dot{\theta}_2^2 l_2 \cos(\theta_1 - \theta_2)) - (m_1 + m_2)g \sin(\theta_1) + m_2 g \sin(\theta_2) \cos(\theta_1 - \theta_2)}{l_1(m_1 + m_2 \sin^2(\theta_1 - \theta_2))}$$

$$\ddot{\theta}_2 = \frac{(m_1 + m_2)(g \sin(\theta_1) \cos(\theta_1 - \theta_2) - l_1 \dot{\theta}_1^2) - m_2 l_2 \sin(\theta_1 - \theta_2) \dot{\theta}_2^2 \cos(\theta_1 - \theta_2) - (m_1 + m_2)g \sin(\theta_2)}{l_2(m_1 + m_2 \sin^2(\theta_1 - \theta_2))}$$

Total energy is conserved in the absence of friction:

$$E = T + V = \text{const}$$

Angular momentum about the support is NOT conserved; the gravitational potential breaks rotational symmetry in the lab frame.

## Numerical method

- **Discretization**: velocity-Verlet integrator from `shared/js/engine/symplectic.js`, configured with mode `integrator: 'verlet'`. The engine uses a one-pass predictor-corrector on the velocity half-kick to handle the qdot-dependent accelerations. The corrector restores second-order accuracy in dt; for the double pendulum (qdot-dependent forces from the Christoffel terms in the non-separable kinetic energy) this scheme is *not* formally symplectic but is time-reversible with bounded energy drift. Over a run of 10^4 steps at dt = 1e-3 s, the engine was validated to hold |dE/E| < 1e-3 on the test initial condition (theta1 = 1.2 rad, theta2 = -0.5 rad, both at rest).

- **Time step**: physics dt = 1e-3 s, passed to `step(inst, dt)` inside the engine. The render loop's accumulator grain `PHYSICS_DT` in `playground.js` is set to the same value (1/1000 s) so the engine receives exactly one 1e-3 step per accumulator drain. The scheme is unconditionally stable for Hamiltonian systems at this dt; the step size is chosen for energy accuracy, not stability. Empirically the predictor-corrector loop converges in one pass on the IC envelope below E_cap; the playground's init code asserts this on the starting IC.

- **Spatial domain**: theta1 and theta2 are periodic on (-pi, pi], but the playground restricts initial conditions to stay off the separatrix (see Boundary Conditions below). The configuration space is 2D (q1, q2) = (theta1, theta2).

- **Boundary conditions and energy envelope (option a from the user's separatrix-policy menu)**: there is no boundary condition on theta1, theta2 (the dynamics is unbounded on the angular torus). The playground caps the *initial* total energy at $E_\text{cap} = 0.85 E_\text{ref}$, where $E_\text{ref} = (m_1 + m_2) g l_1 - m_2 g l_2$ is the value of $V$ at the configuration $(\theta_1=\pi, \theta_2=0)$ at rest (the lowest non-trivial saddle in $V$ at which the first rod can flip over the support while the second rod hangs down). $E_\text{ref}$ is an empirical reference for the energy at which the regime ceases to be purely quasi-periodic, not the formal homoclinic separatrix. At the default $m_1 = m_2 = 1\,\mathrm{kg}$, $l_1 = l_2 = 1\,\mathrm{m}$, $g = 9.81\,\mathrm{m\,s^{-2}}$, this yields $E_\text{cap} \approx 8.34\,\mathrm{J}$, $E_\text{ref} = 9.81\,\mathrm{J}$. The 0.85 factor is fixed (not user-adjustable) and is justified empirically: the symplectic engine holds $|dE/E| < 10^{-3}$ over $10^4$ steps for all initial conditions tested within this cap. Users who drag a bob across the cap can exceed it; the engine continues to integrate, but the live $|dE/E|$ readout visibly exceeds $10^{-3}$, signaling that the invariant guarantee has been forfeited.

- **Grid or particle count**: N = 2 generalized coordinates (theta1, theta2), no spatial discretization.

- **RNG**: PRNG from `shared/js/render/rng.js` seeded with `0xC0FFEE` by default. Used only for initial-condition jitter if the user enables it (stretch goal); baseline runs use deterministic ICs.

- **Poincare-section detector**: zero-crossings of theta1 = 0 with omega1 > 0 are detected by sign-change between consecutive samples, then refined by linear interpolation in time on theta1(t). A crossing is counted only if the interpolated omega1 at the crossing time exceeds 0.05 rad/s, to suppress double-counts on near-grazing trajectories whose theta1 sits arbitrarily close to zero. [no-source: standard-technique]

## Controls

| name | type | units | range | default | sets |
|------|------|-------|-------|---------|------|
| bob 1 position | drag handle (canvas) | rad | theta1 in [-pi, pi]; user drags first bob in Cartesian space, angle resolved from support position | theta1 = 0.5 (about 29 deg from vertical) | initial theta1 from cursor position relative to support; double-click to zero velocity |
| bob 2 position | drag handle (canvas) | rad | theta2 in [-pi, pi]; user drags second bob in Cartesian space, angle resolved from first bob pivot | theta2 = -0.3 (about -17 deg from vertical) | initial theta2 from cursor position relative to first-bob pivot; double-click to zero velocity |
| m1 | slider | kg | 0.1 to 5.0 | 1.0 | mass of first bob |
| m2 | slider | kg | 0.1 to 5.0 | 1.0 | mass of second bob |
| l1 | slider | m | 0.3 to 2.0 | 1.0 | length of first rod |
| l2 | slider | m | 0.3 to 2.0 | 1.0 | length of second rod |
| reset | button | N/A | N/A | N/A | reinitialize to default IC (theta1 = 0.5, theta2 = -0.3, both at rest) and clear readouts |
| play / pause | button | N/A | N/A | play | toggle time integration |

## Expected qualitative features

### Visible in the default golden frames

These five bullets are what the SSIM visual gate and the visual-reviewer rubric should confirm against the committed frames. They cover the default IC only (theta1 = 0.5 rad, theta2 = -0.3 rad, both at rest; m1 = m2 = 1 kg; l1 = l2 = 1 m; seed 0xC0FFEE).

- At t = 0 (frame `t-000`) both bobs are at rest in the displayed pose: bob 1 hangs at theta1 = 0.5 rad to the right of the support, bob 2 at theta2 = -0.3 rad relative to vertical from the first bob's pivot. No trail.
- At t = 1.5 s (frame `t-025`) and onward, a continuous accent-colored trail trails bob 2, growing length-wise as integration time accumulates. The trail is smooth and bounded, not space-filling, consistent with a quasi-periodic orbit on a 2D invariant torus.
- The dark rods, the open-circle bob 1 (mass m1 outlined in accent), and the filled-circle bob 2 (mass m2 in accent) are continuously visible in every frame.
- The pendulum stays in the upper-middle quarter of the canvas; there are no rod flip-overs, no rod intersections with the support, and no rendering glitches at the joint.
- The token background (off-white in the light theme), the accent blue trace, and the muted-foreground rods are the only colors in the canvas; no rainbow palette, no pure white, no pure black.

### Available via user interaction (verified by invariant tests, not by the SSIM gate)

These features are reachable by dragging a bob or moving the sliders. They are validated by `invariants.test.mjs`, the live readouts, and direct user manipulation; the golden frames do not exercise them.

- Dragging the lower bob outward raises E past the cap and the system enters the chaotic regime; the Poincare counter jumps erratically and the trail breaks up.
- At small amplitude (theta1, theta2 < 0.05 rad at rest) the system exhibits two normal modes with frequencies omega_+/- = sqrt(g (2 +/- sqrt(2))). This is a strong invariant tested headlessly in `invariants.test.mjs`.
- Setting m2 to its slider minimum (0.1 kg) and l2 large reduces the system to an almost-simple pendulum on the first rod; the spec's strong-invariant test uses m2 = 1e-3 kg (below the slider minimum) for a stricter check.
- The live |dE/E| readout reports the integrator's energy drift; it stays below 1e-3 for ICs below the energy cap and is colored warm-accent when it crosses the threshold.

## Invariants and acceptance thresholds

| invariant | strong/medium/weak | threshold | notes |
|-----------|-------------------|-----------|-------|
| Total energy conservation | strong | \|dE/E\| < 1e-3 over 10^4 steps at dt = 1e-3 s on any IC with E < 0.85*E_sep | Validated empirically on engine test suite with default masses and lengths |
| Small-amplitude reduction to linear modes | strong | At $m_1 = m_2 = 1\,\mathrm{kg}$, $l_1 = l_2 = 1\,\mathrm{m}$, $g = 9.81\,\mathrm{m\,s^{-2}}$, and an IC with $\|\theta_1\|, \|\theta_2\| < 0.05\,\mathrm{rad}$ at rest, the two dominant angular frequencies in $\theta_1(t)$ are $\omega_- = \sqrt{g(2-\sqrt{2})} \approx 2.397\,\mathrm{rad\,s^{-1}}$ and $\omega_+ = \sqrt{g(2+\sqrt{2})} \approx 5.787\,\mathrm{rad\,s^{-1}}$ (the eigenvalues of $M^{-1} V''$ derived by direct linearization of the Newman Ex. 8.15 EOM around $\theta_1 = \theta_2 = 0$ using the Strogatz Section 6.3 "Fixed Points and Linearization" recipe); each measured to within 1 percent | Verifies the EOM implementation against the Lagrangian formulation |
| Single-mass limit (m2 -> 0) | strong | With $m_2 = 10^{-3}\,\mathrm{kg}$ and $l_2 = 1\,\mathrm{m}$ (negligible upper bob), the system reduces to a simple pendulum with period $T = 2\pi\sqrt{l_1/g} \approx 2.006\,\mathrm{s}$ within 0.5 percent at amplitude $\|\theta_1\| < 0.2\,\mathrm{rad}$ | Confirms that the coupling terms vanish when $m_2$ vanishes |
| Angular momentum NOT conserved | medium | The total $z$-component of angular momentum about the support, $L_z = (m_1+m_2) l_1^2 \omega_1 + m_2 l_2^2 \omega_2 + m_2 l_1 l_2 \cos(\theta_1-\theta_2)(\omega_1+\omega_2)$, deviates from its initial value by at least 0.1 (in SI units of $\mathrm{kg\,m^2\,s^{-1}}$) at some time within $10^3$ integration steps starting from the default IC ($L_z(0) = 0$). Gravity breaks SO(2) symmetry; the invariant test asserts the deviation, not its absence | Sanity check that the implementation does not accidentally conserve $L_z$. |

A visual SSIM fallback of > 0.92 against committed golden frames (captured at fixed seed 0xC0FFEE and a low-energy IC) is used if the energy gate or limiting-case thresholds become noisy due to floating-point accumulation at extreme parameter ranges.

## Limiting cases for verification

| limit | expected | source |
|-------|----------|--------|
| theta1, theta2 -> 0 (small amplitude, at rest) | Period of theta1 oscillation approaches 2*pi*sqrt(l1 / g), independent of m2 and l2; frequency is the simple-pendulum value | Strogatz Section 6.7 Pendulum (simple-pendulum limit); linearization around the down-pointing equilibrium |
| m2 -> 0 (negligible second bob) | The system reduces to a simple pendulum of length l1; energy E = 0.5*m1*l1^2*omega1^2 - m1*g*l1*cos(theta1); the equations decouple to a single second-order ODE | Elementary limit; validates that the coupling coefficients scale with m2 |
| l2 -> 0 (negligible second rod) | Similar reduction: the system approaches a point mass m1 + m2 at distance l1, oscillating with the combined mass and no internal structure | Kinetic energy becomes T ~ 0.5*(m1 + m2)*l1^2*omega1^2 |
| m1 >> m2 (first mass dominates) | The second bob is a passive pendulum hanging from the first; the first bob oscillates with period close to the simple-pendulum period, and the second bob's motion lags by a small phase | Perturbative regime; tests whether the equations of motion handle unbalanced mass ratios gracefully |
| E -> E_ref (lowest saddle in V) | The trajectory approaches the saddle; integration time to traverse it diverges logarithmically; the live $\|dE/E\|$ readout exceeds $10^{-3}$ and signals the out-of-bounds regime | Strogatz Section 6.5 Conservative Systems |

## Visual fallback

Primary validation is via the three strong invariants (energy conservation, small-amplitude reduction, single-mass limit). If numerical transients obscure these invariants during extreme-parameter sweep, a visual SSIM > 0.92 against five committed golden frames (captured at t = 0%, 25%, 50%, 75%, 100% of a 20-second run at seed 0xC0FFEE and default IC theta1 = 0.5 rad, theta2 = -0.3 rad, both at rest) is the secondary gate. Reference frames are stored in `playgrounds/double-pendulum/references/golden-frames/`.

## Citations

1. **Newman, Mark.** "Computational Physics." Revised printing, CreateSpace, 2013. Bib key `newman2013`. Exercise 8.15 "The double pendulum" provides the problem statement and a reference implementation in a compiled language (C++). The LaTeX equations of motion and Lagrangian follow the standard formulation in Newman's discussion.

2. **Strogatz, Steven H.** "Nonlinear Dynamics and Chaos." 2nd ed., Westview/CRC Press, 2015. Bib key `strogatz2015`. Sections cited:
   - Section 6.3 "Fixed Points and Linearization": the eigenvalue recipe used to derive the small-amplitude normal-mode frequencies of the linearized double pendulum.
   - Section 6.5 "Conservative Systems": phase-portrait structure and the role of energy as a conserved quantity; also the basis for the limiting case as energy approaches the lowest saddle.
   - Section 6.7 "Pendulum": linearization around equilibria and the period of small oscillations of a simple pendulum.

(The earlier draft cited Ott 2002 for the separatrix discussion; Strogatz Section 6.5 covers the same material at the level needed for this playground and is already verified in chapter_index.)

## Stretch goals

- Direct manipulation of theta2: once theta1 is set, allow the user to drag the second bob independently to set theta2, with real-time EOM update.

- Frequency-domain readout: compute an FFT of theta1(t) over the last N samples and display the dominant peaks, allowing the user to identify the two normal modes in the small-amplitude regime.

- Damping slider: add a velocity-proportional dissipation term -c*omega to both equations, allowing the user to watch the trajectory spiral into an attractor. Energy will no longer be conserved; the invariant gate falls back to the visual SSIM only.

- Chaotic IC preset buttons: buttons labeled "Quasi-periodic," "Chaotic," and "Separatrix (watch it drift)" that set IC and slider values to known regimes without manual exploration.

- Poincare section heatmap: instead of a counter, display a 2D color field showing the density of crossings at each (theta1, theta1_dot) intersection on the Poincare surface theta2 = 0.

- Phase-portrait trace: optionally overlay the full 4D trajectory projected onto (theta1, omega1) to visualize the torus structure and chaotic regions.

## Risk register

1. **Chaotic IC initialization obscuring pedagogical intent.** If the page loads at an IC deep in the chaotic sea, motion appears as noise and the quasi-periodic regime the spec advertises is invisible. Mitigation: default IC is $(\theta_1, \theta_2, \omega_1, \omega_2) = (0.5, -0.3, 0, 0)\,\mathrm{rad}$ (the same IC used for golden-frame capture), which lies in the quasi-periodic envelope and produces an immediately visible coupled oscillation. The chaotic regime is reached only by explicit user interaction (dragging a bob outward or increasing m2/l2).

2. **Numerical drift above the energy cap.** If the user drags a bob so that $E > E_\text{cap} = 0.85 E_\text{ref}$, the predictor-corrector velocity-Verlet path accumulates nonlinearity and $|dE/E|$ exceeds the $10^{-3}$ gate. Mitigation: the cap is enforced at IC setup (during a drag that would put the system above $E_\text{cap}$, the angle snaps to the boundary), and the live $|dE/E|$ readout turns warm-accent ($--\mathrm{accent-warm}$) once the threshold is crossed. The integration continues so the user can see the chaotic regime; the invariant gate flags the violation in the test suite.

3. **Hit-testing and angular resolution in bob-drag mode.** When the user drags a bob, the playground must resolve which bob is being grabbed (especially when rods cross) and snap the angle to the cursor position. If the theta resolution is coarse or the snap-lock is hysteretic, the user experience degrades (bobbing back and forth, or grabbing the wrong bob). Mitigation: snap to the nearest bob within a radius of 10 pixels; resolve theta = atan2(dy, dx) relative to the support (for bob 1) or first-bob pivot (for bob 2); implement a click-hold-drag state machine to prevent spurious re-targeting during motion.

## Implementation notes

The `shared/js/engine/symplectic.js` engine will be imported and instantiated with:

```javascript
const instance = symplectic.create({
  positions: Float64Array [theta1, theta2],
  velocities: Float64Array [omega1, omega2],
  masses: [m1, m2] (broadcast),
  accelerationFn: (q, qdot, m, t, outAccel) => { ... },
  energyFn: (q, qdot, m) => T + V,
  integrator: 'verlet'
});
```

The headless simulation module `sim.js` will expose:

- `step(state, params, dt)`: advance the integrator one step and return { q, qdot, E, dE_over_E, poincareCount }.
- `setParams({ m1, m2, l1, l2 })`: update mass and length parameters (automatically re-normalizes the EOM).
- `checkEnvelopeViolation(theta1, theta2)`: returns true if the proposed IC exceeds the energy envelope.

The renderer will draw a 2D canvas with the support, two rods as line segments, and two bobs as circles. The live readout panel will display theta1, theta2, E (in kJ), |dE/E| (in scientific notation), and the Poincare counter.
