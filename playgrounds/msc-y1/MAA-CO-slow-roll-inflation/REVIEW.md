# REVIEW - slow-roll-inflation (deep audit; supersedes any earlier pass)

## Verdict
BROKEN (Starobinsky potential derivatives, invariants.test.mjs skeleton)

## A. Scientific validity

**EOM (phi2 and phi4 models):** playground.js line 47-49 implement $\ddot{\phi} + 3H\dot{\phi} + V' = 0$ with $H = \sqrt{V/3}$ (M_Pl = 1). Correct for both phi^2/2 and phi^4/4 models, which have simple polynomial derivatives.

**Epsilon and eta definitions:** line 43-44 define $\epsilon = \frac{1}{2}(V'/V)^2$ and $\eta = V''/V$ (M_Pl = 1). Correct (spec line 28; Liddle & Lyth, Cosmological Inflation, eq. 2.14-2.15).

**Observable formulas:** line 202: $n_s = 1 - 6\epsilon + 2\eta$ and $r = 16\epsilon$. Standard (Baumann et al., Inflation and String Cosmology; WMAP/Planck conventions). Correct.

**phi2 model:** V = phi^2/2, Vp = phi, Vpp = 1 (lines 27, 32, 38). At phi=8: epsilon = 0.5*(8/32)^2 = 0.5*1/16 = 1/64 = 0.015625. Test at line 274-278 expects 1/64 = 0.0156. Correct.

**phi4 model:** V = phi^4/4, Vp = phi^3, Vpp = 3*phi^2 (lines 28, 33, 39). Epsilon = 0.5*(phi^3 / (phi^4/4))^2 = 0.5*(4/phi)^2 = 8/phi^2, eta = 3*phi^2 / (phi^4/4) = 12/phi^2. At phi=8: epsilon = 8/64 = 0.125, eta = 12/64 = 0.1875, so n_s = 1 - 0.75 + 0.375 = 0.625, r = 2.0. Sensible track on (n_s,r) plane (lower left corner, away from Planck-favoured region). Correct.

**Starobinsky model: SIGN ERROR.** Spec line 35 claims V = V_0 (1 - exp(-sqrt(2/3)*phi/M_Pl))^2. With M_Pl = 1, this is V = (1-e)^2 where e = exp(-sqrt(2/3)*phi).

- **Vp derivation:** dV/d_phi = 2(1-e)*de/d_phi = 2(1-e)*(-sqrt(2/3)*e) = -2*sqrt(2/3)*e*(1-e).
- **Code at line 35:** `2 * Math.sqrt(2 / 3) * (1 - e) * e` is POSITIVE, missing the minus sign.
- **Vpp derivation:** d/d_phi[-2*sqrt(2/3)*e*(1-e)] = -2*sqrt(2/3)*[de/d_phi*(1-e) + e*d(1-e)/d_phi] = -2*sqrt(2/3)*[(-sqrt(2/3)*e)*(1-e) + e*(-(-sqrt(2/3)*e))] = -2*sqrt(2/3)*[-sqrt(2/3)*e*(1-e) - sqrt(2/3)*e^2] = 2*sqrt(2/3)*sqrt(2/3)*[e*(1-e) + e^2] = (4/3)*[e - e^2 + e^2] = (4/3)*e.
- **Code at line 41:** `2 * (2 / 3) * (2 * e * e - e + e * e * (-1))` = (4/3)*[2*e^2 - e - e^2] = (4/3)*(e^2 - e), which is WRONG.

**Impact:** The entire Starobinsky track on the (n_s,r) plane is physically incorrect. Frames t-050 and t-075 show the Starobinsky model with wrong epsilon/eta, so wrong n_s and r.

**E-fold accumulation:** line 58-60 accumulates N = integral H dt while inflating (epsilon < 1). Mathematically correct. Line 62 resets N to 0 when phi wraps (phi < 0.05 -> reset to 8). Reasonable for a cyclic display.

**Inflation-end detection:** line 73-79 find the largest phi where epsilon >= 1 (the boundary of slow-roll). This is the correct interpretation of "inflation ends." Correct.

## B. Physics & numerical robustness

**Integrator:** Explicit Euler (line 48-50) with dt = 0.02 per step (line 233: 4 substeps per frame = 0.08 frame time). This is adequate for the smooth potentials tested. No symplecticity requirement (energy is not conserved in dissipative Hubble-friction EOM). Stable for the test range.

**Stability of Starobinsky:** even if the derivatives were correct, the Starobinsky model is exponential in form and stable (V -> 0 as phi -> infinity, no singularities). The integrator does not blow up, but the physics is WRONG.

**Determinism:** line 256-271 handle DETERMINISTIC and CAPTURE_NAME. The capture loop (line 259) cycles through models [phi2, phi2, Starobinsky, Starobinsky, phi4] based on CAPTURE_FRAC. This produces distinct frames across models. Correct pattern.

**E-fold accumulation determinism:** line 261 advances by 30 + CAPTURE_FRAC*220 steps, so t-000 has ~30 steps (~0.6 s), t-100 has ~250 steps (~5 s). The N readout will differ. Frames should show distinct e-fold counts.

**Readout:** line 227 shows phi, eps, eta, N in monospace on readoutInv. Correct and informative.

**Verdict on B:** PHYSICALLY BROKEN for Starobinsky due to derivative sign errors. Integrator is fine; issue is mathematical. Phi2 and phi4 are correct.

## C. Presentability

**Card text:** spec.md one_paragraph (line 11) is precise: "Inflaton EOM with Hubble friction; epsilon = (V_phi/V)^2/2 and eta = V_phi_phi/V; observables n_s = 1 - 6 epsilon + 2 eta and r = 16 epsilon plotted on a Planck-style plane." Good for reviewers. Correct.

**README.md:** Pure template boilerplate (lines 1-18). HIGH-severity defect. Needs substantive content:
  - What slow-roll inflation is (field rolling down potential under Hubble friction, observables n_s and r).
  - What to look for (shaded slow-roll plateau, ball rolling, galaxy grid expansion, epsilon=1 cliff, inflation track on (n_s,r) plane).
  - Which controls do what (model selector changes potential; watch how track and e-folds change).
  - Citations: Liddle & Lyth 2000, Inflation and Large-Scale Structure; Dodelson 2003, Modern Cosmology.

**index.html description (line 24, data-slot="description"):** Verbose but mathematically precise. Acceptable for a research portfolio.

**index.html figcaption (line 30, data-slot="caption"):** Minimal: "Figure 2. Slow-Roll Inflation: Ball on the Potential." Should expand to paper style: "Figure 2. Slow-roll inflation dynamics. The inflaton rolls down V(phi) under Hubble friction (top left); the slow-roll parameter epsilon (green shaded region) controls inflation duration. The universe expands (comoving grid stretches, top right). The observable parameters (n_s, r) trace an inflation-model-specific track (bottom) toward the Planck-favoured region."

**Live readout:** Present and functional. Monospace, showing phi, epsilon, eta, N. Good.

**Golden frames:** t-025 to t-100 show distinct evolution (different models, phi positions, N values, grid expansion). No visual defects. Colors are good (ball golden, potential blue, grid cyan, tracks orange, Planck region green).

**Animation in universe panel:** line 145-160 draw a comoving lattice that expands as a(t) ~ exp(N/9). Capped at exp(60/9) = exp(6.67) ~ 800x to keep it visible (line 148). Galaxies drift through the grid as it expands. Physically correct illustration of inflation.

**Verdict on C:** README is placeholder (HIGH severity). Figcaption is stub (MEDIUM severity). No code issues for presentation. Fast fix: write README, expand figcaption.

## Invariants.test.mjs: Required Tests

The current invariants.test.mjs (lines 1-28) is a skeleton with imports commented and a fake energy-drift mock. This is a BLOCKER for shipping.

**Required four tests:**

1. **epsilon_phi2 at phi=8 exact:** $\epsilon(\phi=8) = \frac{1}{64}$ exactly (no phi^2/2 ambiguity). Tolerance 1e-5. Tests that the epsilon formula is correctly implemented.

2. **eta consistency across models:** For each model (phi2, phi4, Starobinsky [once fixed]), verify that eta/epsilon ratio is within expected bounds (e.g., for phi2, eta = 0, so eta/epsilon should be 0; for phi4, eta/epsilon = 1.5). Tests that both derivatives are consistent.

3. **Inflation ends at epsilon = 1:** Verify that phiEndOfInflation() correctly identifies the largest phi where epsilon(phi) >= 1. For phi2 at phi=1, epsilon = 0.5, so inflation should still be ongoing; at phi=0.5, epsilon = 2, so inflation should be over. Tests inflation-end boundary.

4. **E-fold accumulation monotonic during slow-roll:** Simulate the EOM for ~100 steps in the slow-roll regime (phi=8 down to phi=2 for phi2), verify that N increases monotonically. Tests that e-fold integration is working.

These tests must be written directly on the live module (not mocks) and must pass before shipping.

## Hero-candidate
NO. Educational visualization of inflation dynamics and observational constraints. Well-rendered but not visually novel. Tier: medium engagement.

## Action checklist for maintainer

**BLOCKER: Fix Starobinsky derivatives before anything else.**
- [ ] Fix Vp in function Vp() line 35: change sign from + to -, multiply by -1.
- [ ] Fix Vpp in function Vpp() line 40-41: replace `2 * (2 / 3) * (2 * e * e - e + e * e * (-1))` with `(4/3) * e` (or equivalently, return `2 * (2 / 3) * e`).
- [ ] Verify fix locally: compute Starobinsky epsilon/eta at phi=2,4,6,8 by hand and match the code.
- [ ] Recapture golden frames to verify track moves to correct location on (n_s,r) plane.

**SECONDARY: Write invariants.test.mjs and text.**
- [ ] Write four invariant tests (see Invariants section above). Import playground functions directly (not mocks).
- [ ] Run tests locally: `uv run pytest invariants.test.mjs` should pass 4/4.
- [ ] Edit README.md: three substantive paragraphs (what, what to look for, controls).
- [ ] Edit index.html figcaption: expand to paper style with method.
- [ ] Recapture frames (will look different after Starobinsky fix).
- [ ] Deploy.

## Notes
The Starobinsky derivative errors are severe: they corrupt the entire track for one of three models and make the playground physically incorrect. The Phi2 and phi4 models are correct. Once Starobinsky is fixed and invariants are written, this playground has solid physics and good presentation.
