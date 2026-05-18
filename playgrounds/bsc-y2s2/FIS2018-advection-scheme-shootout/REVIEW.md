# REVIEW - advection-scheme-shootout (deep audit; supersedes any earlier pass)

## Verdict
CLEAN (deep audit passed)

## A. Scientific validity

**Governing equations implemented:** Four finite-difference schemes for 1D linear advection $u_t + c u_x = 0$ on periodic domain [0, 1].
- FTCS (Forward-Time Centered-Space): $u^{n+1}_i = u^n_i - (C/2)(u^n_{i+1} - u^n_{i-1})$ where $C = c \Delta t / \Delta x$ (Courant number). Unconditionally unstable (sim.js line 58-66). Correct implementation.
- Upwind: $u^{n+1}_i = u^n_i - C(u^n_i - u^n_{i-1})$ for $c > 0$ (sim.js line 68-82). First-order TVD scheme. Correct for both positive and negative advection speeds.
- Lax-Wendroff: $u^{n+1}_i = u^n_i - (C/2)(u^n_{i+1} - u^n_{i-1}) + (C^2/2)(u^n_{i+1} - 2u^n_i + u^n_{i-1})$ (sim.js line 84-94). Second-order, centered. Correct implementation.
- MacCormack: predictor $u^*_i = u^n_i - C(u^n_{i+1} - u^n_i)$, corrector $u^{n+1}_i = 0.5(u^n_i + u^*_i) - 0.5C(u^*_i - u^*_{i-1})$ (sim.js line 96-108). Second-order predictor-corrector. Correct.

**Source citation:** LeVeque 1992, *Numerical Methods for Conservation Laws*, Chapter 9. All four schemes are standard references and correctly cited.

**Sanity checks (limiting/asymptotic cases):**
1. FTCS instability at CFL $C < 1$: Amplification factor is $\lambda = 1 - i C \sin(k \Delta x)$, so $|\lambda|^2 = 1 + C^2 \sin^2(k \Delta x) > 1$ for all $k, C$. Unconditionally unstable. Invariants.test.mjs line 28-35 confirms: TV grows > 5x over 200 steps at $C = 0.5$. Verified.
2. Upwind TVD property: first-order and total-variation diminishing (TVD) by construction. Invariants.test.mjs line 15-25 confirms TV never grows over 100 steps. Verified.
3. Mass conservation: integral $\sum_i u_i \Delta x$ must be invariant. Invariants.test.mjs line 48-57 confirms upwind preserves mass to $< 10^{-10}$ over 200 steps. Verified.
4. Exact solution periodicity: pure translation $u(x, t) = u_0(x - ct)$ on periodic domain returns to initial condition at time $t = L/c = 1.0$. Invariants.test.mjs line 60-69 confirms max error $< 0.01$ (discretization error only). Verified.
5. Lax-Wendroff on smooth data (Gaussian): TV should grow by $< 5\%$ over 200 steps on smooth data. Invariants.test.mjs line 38-45 confirms. Verified.

**Physics interpretation:** The playground correctly demonstrates the trade-off between accuracy and stability in finite-difference schemes for advection. FTCS is the "obvious" method but fails catastrophically (pedagogically instructive). Upwind is stable but dissipative. Lax-Wendroff is more accurate but oscillatory at discontinuities (Gibbs phenomenon). MacCormack is a practical second-order alternative.

## B. Physics & numerical robustness

**Stability analysis:**
- FTCS: Unconditionally unstable for all CFL numbers (von Neumann stability analysis shows amplification factor $> 1$). Code correctly implements this scheme; the blow-up is expected.
- Upwind: Stable for $0 < C \le 1$ (CFL stability). Code enforces periodic BCs correctly (periodic() function line 52-56); wrapping is correct.
- Lax-Wendroff: Stable for $|C| \le 1$. Correct second-order implementation.
- MacCormack: Stable for $|C| \le 1$. Correct predictor-corrector sequence.

**CFL constraint:** The playground allows CFL range [0.1, 1.2]. CFL > 1 violates the necessary stability condition; all schemes will diverge. The spec.md correctly documents this.

**Periodic boundary conditions:** All schemes use periodic wrapping (periodic() function). Correct for this domain.

**Grid parameters:** NX = 200 cells, DX = 1/200 = 0.005. dt is computed from `dt = CFL * DX / c`. Correct.

**Conservation:** Upwind is mass-conserving (upwind is TVD hence conservative). Lax-Wendroff and MacCormack are conservative schemes. All correct.

**Initial conditions:** Square pulse on [0.30, 0.45] and Gaussian for smooth testing. Both correctly implemented.

**Determinism:** All schemes are deterministic given fixed initial condition and parameters. Playground is reproducible.

**Golden-frame span:** Five frames showing progression of advected pulse under different schemes. Initial frame shows all four schemes at t=0 (identical square pulse). Final frame shows long-time behavior (FTCS exploded, upwind smeared, LW oscillating, MacCormack similar to LW). Frames are visually distinct and capture qualitative behavior correctly.

## C. Presentability

**User-facing text:**
- Index.html lines 27-44: Clear narrative explanation of why FTCS fails, why upwind is safe, why LW is better, MacCormack as alternative. Appropriate for second-year numerics course.
- Figcaption: "Figure 1. 1D linear advection $u_t + c u_x = 0$ on a periodic domain, square pulse initial condition. Four schemes side-by-side: FTCS, upwind, Lax-Wendroff, MacCormack. Source: LeVeque 1992, Numerical Methods for Conservation Laws, Chapter 9." Paper-style citation, no backticks or bibkey artifacts. Clean.

**README.md:** Concise three-paragraph description, verification status appropriate.

**Canvas controls:** Sliders for $c$, CFL, and simulation speed; buttons for Reset/Play. All labels clear and units implicit. Appropriate.

**Visualization quality:** Four side-by-side subplots, legible grid and axes, exact solution overlay. Evolution is perceptually clear.

**Accessibility:** Canvas has appropriate aria-label; controls have descriptive labels. No presentation defects.

**No exposed bibkeys:** Citation uses plain text. Clean.

## Hero-candidate
MAYBE (marginal). Demonstrates classic numerical-methods trade-off (stability vs. accuracy) with side-by-side comparison. Visualization of scheme failure is pedagogically compelling. However, this is textbook illustration, not research-grade. Standard schemes, well-known analysis. Not strong for AI-lab hiring (pedagogical rather than novel), but acceptable for ESA context (demonstrates numerical methods depth). Would strengthen significantly with error-rate comparison plot or stability diagram.

## Action checklist for maintainer

- [ ] No defects identified. Playground is ready to ship as-is.
- [ ] All invariants tests pass.
- [ ] Golden frames are distinct and representative.
- [ ] Text is clean and accessible.
