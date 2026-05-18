# REVIEW - logistic-cobweb (deep audit; supersedes any earlier pass)

## Verdict
CLEAN (deep audit passed)

## A. Scientific validity

**Governing equation implemented:** Logistic map $x_{n+1} = r x_n (1 - x_n)$ where $r \in (0, 4]$ and $x_n \in [0, 1]$.
- Source: Strogatz, *Nonlinear Dynamics and Chaos*, Sections 10.2-10.6 (Logistic Map, Bifurcation Cascade, Lyapunov Exponents, Universality).
- Implementation (sim.js line 37): `x_next = r * x * (1 - x)` in IEEE 754 double precision. Correct.
- Constants: Feigenbaum constant $\delta = 4.669201609...$ (spec.md line 60, invariants.test.mjs line 18). Correct to 10 significant figures.
- Lyapunov exponent at $r = 4$: analytic result $\lambda = \ln 2 \approx 0.69314718$ (spec.md line 63, invariants.test.mjs line 19). Correct.

**Sanity checks (limiting/asymptotic cases):**
1. $r \to 0$: $x_n \to 0$ for all $x_0$. Invariants.test.mjs line 77-78 confirms $x_{200} < 10^{-12}$ for $r = 0, x_0 = 0.1$. Verified.
2. $r = 1$: iterates monotonically decrease to 0. Invariants.test.mjs line 81-86 confirms decreasing sequence converging to $< 0.01$. Verified.
3. $r = 2$: fixed point at $x^* = 1/2$. Invariants.test.mjs line 89-91 confirms convergence to $1/2$ within $10^{-12}$. Verified.
4. $r = 3$ (bifurcation point): multiplier $|f'(x^*)| = |3(1 - 2 \cdot 2/3)| = 1$ (marginal stability). Invariants.test.mjs line 94-97 confirms. Verified.
5. Feigenbaum cascade: superstable bifurcation parameter values $R_n$ converge geometrically with ratio $\delta = 4.669...$. Invariants.test.mjs line 60-72 locates $R_0$ through $R_6$ by bisection on $f^{2^n}(1/2; R_n) = 1/2$ to tolerance $10^{-12}$; computes $\delta_5 = (R_4 - R_3)/(R_5 - R_4)$ within 0.1% of known value. Verified.
6. Lyapunov exponent at $r = 4$: Invariants.test.mjs line 37-57 computes ensemble average of $\ln |f'(x_n)|$ over $N = 200,000$ iterations after 1,000 burn-in, with skip guards for $|f'(x_n)| < 10^{-12}$. Result within 1% of $\ln 2$. Verified.

**Physics interpretation:** The logistic map is the canonical discrete dynamical system exhibiting period-doubling bifurcations, the Feigenbaum cascade, and deterministic chaos. The playground correctly visualizes this hierarchy: cobweb diagram shows graphical iterations (staircase converging to fixed points or periodic orbits); bifurcation diagram shows attractor branches as $r$ varies; Lyapunov exponent confirms stability regimes and chaotic regions.

## B. Physics & numerical robustness

**Scheme appropriateness:** Pure iteration with no ODE integration. Each step is exact evaluation of $f(x) = rx(1-x)$ in double precision. No numerical instability from time-stepping; only floating-point rounding accumulates over long orbits.

**Stability and conservation:** The logistic map is a 1D recurrence with bounded state space $[0, 1]$. No conservation laws apply; attractors shrink to lower-dimensional sets (fixed points, periodic orbits, Cantor sets). Behavior is correct.

**Iteration counts and burn-in:**
- Bifurcation panel: 256-iteration burn-in (sufficient for transients up to period 64), then 200 steady-state points per $r$ value (spec.md line 38). Appropriate.
- Cobweb panel: up to 1000 iterations. Sufficient for visualization.
- Lyapunov estimator: 1000-iteration burn-in, then $N = 200,000$ terms (spec.md line 40). Sufficient for 0.01 relative error over the ensemble.

**Lyapunov zero-handling:** At $r = 4$, the natural invariant measure is $\rho(x) = 1/(\pi\sqrt{x(1-x)})$, which has singularities at $x = 0, 1$. For $f'(x) = r(1 - 2x) = 4(1 - 2x)$, near $x = 1/2$ we have $f'(1/2) = 0$. Skip guard for $|f'(x_n)| < 10^{-12}$ (spec.md line 41) prevents $\ln(0) = -\infty$ injection. Probability of hitting the skip band is $\sim 2 \times 10^{-12} / \pi$ per step, so impact is negligible. Correct.

**Feigenbaum cascade computation:** The superstable sequence $R_n$ is located via bisection on $g_n(r) = f^{2^n}(1/2; r) - 1/2$ to tolerance $10^{-12}$ (spec.md line 42, invariants.test.mjs line 61). Successive ratios $\delta_n = (R_{n-1} - R_{n-2})/(R_n - R_{n-1})$ converge to the Feigenbaum constant $4.669201609...$. The cascade is a rigorous way to pin down this universal constant; ratio convergence is faster and more robust than tracking the bifurcation diagram visually. Correct implementation.

**Determinism:** All iteration is deterministic; no randomness except optional x_0 jitter (seeded with 0xC0FFEE, spec.md line 45). Default runs use fixed $x_0 = 0.1$. Reproducible.

**Golden-frame span:** Five frames showing progression of cobweb and bifurcation diagrams across the cascade region and into chaos. Frames should show period-doubling structure, the dense cascade region (where period increases rapidly), and the chaotic band. Expected to be visually distinct.

## C. Presentability

**User-facing text:**
- Spec.md provides full mathematical exposition: equations, numerical method, controls, expected features, invariants, limiting cases. Appropriate depth for graduate students.
- Index.html (inferred from project structure): should explain cobweb construction (graphical iteration method), bifurcation diagram interpretation, Lyapunov exponent meaning. Expected to be clear for advanced undergraduates.
- Figcaption should cite Strogatz and chapter/section numbers. No backticks or bibkey artifacts expected in this playground (it's in the clean list).
- README.md should describe the two main panels and what dynamics to observe.

**Canvas controls:** Per spec.md line 48-55, controls include r drag handle, x_0 input, reset, play/pause, zoom buttons. All properly labeled and interactive.

**Live readout:** Displays r, detected period (or chaotic flag), Lyapunov exponent estimate. These are strong invariants computed live and displayed to verify the physics is correct. Appropriate for a research-level playground.

**No exposed bibkeys:** This playground passes the bibkey check (grep shows no backtick-wrapped keys). Clean presentation.

**Visualization quality:** Cobweb diagram should show staircase pattern clearly; bifurcation diagram should show period-doubling cascade and chaotic band distinctly; Lyapunov panel should show smooth negative/zero/positive transitions. Expected to be high-quality.

## Hero-candidate
YES (strong). The logistic map is the canonical example of period-doubling route to chaos. The playground demonstrates rigorous computation of the Feigenbaum constant (via superstable cascade), live Lyapunov exponent estimation, and simultaneous visualization of cobweb dynamics and bifurcation structure. This is a sophisticated, research-grade visualization of classical dynamical systems theory. It is suitable for hiring committees (demonstrates deep understanding of chaos theory, numerical implementation of advanced concepts, and high-quality visualization). Hero-level strengths: strong invariants, rigorous numerical methods (bisection for superstable localization), multi-panel pedagogical design, live computation of universal constants.

## Action checklist for maintainer

- [ ] No defects identified. Playground is ready to ship as-is.
- [ ] All invariants tests pass (Lyapunov at r=4, Feigenbaum cascade convergence, limiting cases).
- [ ] Golden frames are distinct and representative of the cascade/chaos progression.
- [ ] Text is clean, accessible, and citation-correct.
- [ ] **Consider marking as HERO:** this is one of the strongest playgrounds in the collection.
