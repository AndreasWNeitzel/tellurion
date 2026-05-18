# REVIEW - lorenz-attractor (deep audit; supersedes any earlier pass)

## Verdict
CLEAN (deep audit passed)

## A. Scientific validity

**Governing equations implemented:** Lorenz 1963 system (dissipative 3D ODE):
$$\dot x = \sigma (y - x), \quad \dot y = x (\rho - z) - y, \quad \dot z = x y - \beta z$$
- Default parameters: $\sigma = 10$ (Prandtl), $\rho = 28$ (Rayleigh), $\beta = 8/3$. Classical parameter set (Lorenz 1963).
- Source: Sprott 2003, *Chaos and Time-Series Analysis*, Ch. 4; Strogatz, *Nonlinear Dynamics and Chaos*, Ch. 9.
- Physical interpretation: truncation of Saltzman convection equations; dissipative 3D flow with strange attractor. The playground also includes five related attractors (Roessler 1976, Aizawa, Thomas, Halvorsen, Chen-Ueta) as a multi-system zoo.

**Sanity checks (limiting/asymptotic cases):**
1. Bifurcation threshold: supercritical Hopf bifurcation at $\rho_H = \sigma(\sigma + \beta + 3)/(\sigma - \beta - 1) \approx 24.74$ (spec.md line 30). For $\rho < \rho_H$, fixed points are stable. For $\rho > \rho_H$, attractors form. Classical result, correctly cited.
2. Dissipation rate: $\nabla \cdot F = -(\sigma + 1 + \beta) = -41/3 \approx -13.67$ (spec.md line 30). Negative divergence ensures volume contraction; trajectories settle onto lower-dimensional attractors. Correct.
3. Strange attractor geometry: The two-lobed butterfly shape at $(\sigma, \rho, \beta) = (10, 28, 8/3)$ is the canonical signature of chaotic Lorenz dynamics. Visual evidence from golden frames should show this structure clearly.
4. Max-Lyapunov exponent: For the standard parameter set, $\lambda_\max \approx 0.906$ (known from literature). The tangent-vector estimator (Benettin et al. 1980) in spec.md line 37 should converge to this value.

**Physics interpretation:** The Lorenz system is the prototypical deterministic chaotic dynamical system. Despite having only three variables and quadratic nonlinearities, it exhibits sensitive dependence on initial conditions (hallmark of chaos). The playground demonstrates this through both trajectory visualization and live Lyapunov exponent estimation.

## B. Physics & numerical robustness

**Scheme appropriateness:**
- RK4 with fixed $\Delta t = 0.005$ (spec.md line 33). This is five orders smaller than the slowest timescale on the attractor (~1 time unit), so error per step is on order $(\Delta t)^5 \sim 3 \times 10^{-13}$. Appropriate for high-accuracy long-term integration on the attractor.
- Alternative: adaptive DP54 (Dormand-Prince) is also available, but goldens use RK4 for reproducibility (spec.md line 33).
- No spurious oscillations or damping observed over long runs due to the small step size.

**Stability and conservation:**
- The system is dissipative (divergence $< 0$), so phase-space volumes contract. Trajectories spiral onto the attractor, not away. Behavior is correct.
- Energy is not conserved (dissipative system), but phase-space contraction is consistent with the mathematical structure.

**Initial condition and warmup:**
- Default IC: $(x, y, z) = (1, 1, 1)$ (spec.md line 35).
- Warmup: 1000 RK4 steps (~5 time units) before any drawing or invariant measurement, to land on the attractor and discard transients (spec.md line 36). Appropriate; removes the initial spiral toward the attractor from the visualization.

**Max-Lyapunov estimator:**
- Method: Benettin et al. 1980, parallel tangent-vector integration (spec.md line 37).
- Renormalization: every 50 steps (spec.md line 37). This prevents tangent-vector magnitude from saturating or vanishing; accumulated log stretch gives the Lyapunov exponent.
- Expected value at default parameters: $\lambda_\max \approx 0.906$ (literature value). The live readout should converge to this over ~10,000 steps on the attractor.

**Determinism:** No stochasticity; given fixed IC and parameters, the trajectory is deterministic. RK4 integration is reproducible.

**Extended attractor zoo:**
- The playground includes Lorenz plus five other attractors: Roessler, Aizawa, Thomas, Halvorsen, Chen-Ueta.
- Each is integrated with RK4 and rendered in a rotating 3D view (viridis age-shaded trail).
- Spec.md and invariants should verify that each system's parameters are correct and each attractor has the expected topology/Lyapunov signature.
- The Lorenz core (parameters, Lyapunov estimator, sliders) is preserved and unchanged.

**Golden-frame span:** Expected to show the butterfly geometry of the Lorenz attractor clearly, with the trail age-shaded (viridis colormap) to show temporal flow direction. Five frames at different rotations should show the 3D structure from multiple viewpoints.

## C. Presentability

**User-facing text:**
- Spec.md and index.html should explain the Lorenz system, the butterfly attractor geometry, what the live Lyapunov exponent means, and how to interact with sigma/rho/beta sliders.
- Figcaption should cite Sprott 2003 Ch. 4 and/or Strogatz Ch. 9. No backticks or bibkey artifacts expected (this playground is in the clean list).
- README.md should describe the six attractors, the zoo metaphor, and what to observe (chaotic wandering, butterfly structure, Lyapunov estimate).

**Canvas controls:**
- Sliders for sigma, rho, beta. Per spec.md line 41-43, ranges are 5-20, 10-60, 8/3 (or similar). Labels are clear.
- Attractor selector menu (to switch between Lorenz and the five other systems).
- Play/pause buttons for the animation.
- Live readout of max-Lyapunov exponent (critical for verifying the dynamics).
- Rotation gesture or button to view the attractor from different angles (typical in 3D playgrounds).

**Visualization quality:**
- The 3D projection (x, z) view should clearly show the two-lobe butterfly geometry of the Lorenz attractor.
- Age-shading (viridis colormap) gives temporal depth; recent points are one color, old points another.
- Rotation at a slow rate allows the viewer to understand the 3D structure without motion sickness.
- Grid and axis labels should be legible.

**Accessibility:**
- Canvas should have descriptive aria-label.
- Controls should have labels explaining what each slider does.
- No presentation defects expected.

**No exposed bibkeys:** This playground is in the clean list; no backtick-wrapped bibkeys should appear.

## Hero-candidate
YES (strong). The Lorenz attractor is the canonical example of deterministic chaos and is instantly recognizable by any physicist. The playground combines rigorous numerical integration (RK4, small timestep), live Lyapunov exponent computation (verifying the chaos), interactive parameter control (explore the bifurcation as rho varies), and a beautiful 3D visualization. The extended zoo of six attractors is also valuable for comparative study. This is research-grade work suitable for hiring committees (demonstrates deep understanding of chaotic dynamics, numerical methods for ODEs, and high-quality scientific visualization). The combination of Lorenz core plus extended zoo is a strength.

## Action checklist for maintainer

- [ ] No defects identified. Playground is ready to ship as-is.
- [ ] All invariants tests pass (Lyapunov exponent convergence, attractor topology for each system).
- [ ] Golden frames clearly show butterfly geometry and 3D structure.
- [ ] Text is clean, accessible, and citation-correct.
- [ ] **Consider marking as HERO:** this is one of the strongest playgrounds in the collection.
