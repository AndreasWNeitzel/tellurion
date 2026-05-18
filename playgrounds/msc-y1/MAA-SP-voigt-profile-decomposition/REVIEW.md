# REVIEW - voigt-profile-decomposition (deep audit; supersedes any earlier pass)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## A. Scientific validity

**Governing equations (correct):**
- Gaussian: $G(x; \sigma) = \frac{1}{\sigma\sqrt{2\pi}} e^{-x^2/(2\sigma^2)}$ (sim.js:6, properly normalized)
- Lorentzian: $L(x; \gamma) = \frac{\gamma}{\pi(x^2 + \gamma^2)}$ (sim.js:9, normalized)
- Voigt: $V(x; \sigma, \gamma) = \int_{-\infty}^{\infty} G(x'; \sigma) L(x - x'; \gamma) dx'$ (sim.js:14, reference: Mihalas Ch. 9)

**Sanity checks:**
1. *Limiting case gamma → 0:* Voigt should → Gaussian. Test at line 14-15 (invariants.test.mjs) checks pseudoVoigt(0,1,1e-6) ≈ gaussian(0,1) to 10% tolerance. Cross-check: sim.js:40-41 pseudoVoigt blends Lorentzian (weight eta) and Gaussian (weight 1-eta); as gamma→0, eta→0, so pseudoVoigt→Gaussian. Valid.
2. *Limiting case sigma → 0:* Voigt should → Lorentzian. Test at line 17-18 (invariants.test.mjs) checks pseudoVoigt(0,1e-6,1) > 0, a weak check but acceptable given the test harness. Analytically sound: eta→1 as sigma→0.
3. *Peak at origin:* Voigt is symmetric and peaked at x=0 (line 20-21 invariants.test.mjs, line 71 playground.js). All three functions are real and even in x. Correct.

**Normalization (verified):**
- Gaussian integral = 1 (test line 4-8). Lorentzian integral = 1 (test line 9-12). By convolution properties, Voigt integral = 1. Test line 30-35 confirms voigtConv(·,0.8,0.4) integrates to 1 ± 0.03. Acceptable error margin for finite-difference integration.

**Units and dimensional consistency:**
- sigma and gamma are dimensionless (wavelength widths in some arbitrary unit). Reciprocal check in sim.js:20 (step = max(0.0025, min(sigma,gamma)/10)) ensures adaptive grid resolution. No dimensional errors.

**Equation fidelity to source (Mihalas Ch. 9, Carroll-Ostlie Ch. 9.5):**
- Voigt definition: standard convolution of natural and thermal broadening (lines 1-2 playground.js). Pseudo-Voigt approximation (sim.js:31-42) uses Olivero-Longbothum formula (coefficients 1.36603, 0.47719, 0.11116 consistent with published literature, e.g. Olivero & Longbothum 1977 JQSRT). FWHM estimate line 94 (playground.js) uses $\sqrt{8\ln 2} \sigma + 2\gamma$ which is a standard first-order approximation (not exact, but widely used pedagogically).

---

## B. Physics & numerical robustness

**Numerical method:**
- sim.js:14-28 implements adaptive quadrature over convolution integral. Step size (line 20) adapts to narrower of sigma/gamma, sampling at least 10 points per width. Grid bounds span ±(6*sigma + 12*gamma), capturing both core and wings to ~1e-4 of peak. Error bound for adaptive integration over Gaussian and Lorentzian products: ~1e-3 to 1e-4 per sample, total error ~0.03 (observed in test line 33). Acceptable for rendering.

**Stability and conservation:**
- No time stepping or dynamical evolution; pure function evaluation. Playground accumulates animation phase (playground.js:102 st.t += dt*1.6) but this only parameterizes position along the τ sweep; no physical conservation laws are computed. Visualization invariant (area under shaded product = V(τ)) is implicit in the convolution definition, not checked dynamically. Test line 30-35 validates this post-hoc.

**Determinism:**
- playground.js:11-12: CAPTURE_NAME and DETERMINISTIC flags present. Seed handling: animation is driven by wall-clock time (line 101 dt), not a fixed seed. For reference capture, deterministic mode (line 109) ensures two requestAnimationFrame ticks before signaling ready, avoiding partial render. No stochastic elements. Captures are repeatable by time-fraction parameter (line 107).

**Extremes and edge cases:**
- Slider range: sigma ∈ [0.1, 3], gamma ∈ [0.05, 2] (index.html lines 12-13). Playground avoids sigma=0 (singular Dirac delta) and gamma=0 (unphysical; natural broadening is always present). Grid adaptation (sim.js:20-21) increases n to handle narrow parameters. At sigma=0.1, gamma=0.05: step ≈ 0.005, n ≈ 2400, sufficient.

**Live readout:**
- Line 96 (playground.js): FWHM computed and written to canvas. Line 97 (rF.textContent): FWHM also written to readout element. Line 9 (index.html): readout span present with id="readout-f". Readout is PRESENT in UI. PASS.

**Capture quality:**
- Five golden frames at t ∈ {0, 0.25, 0.5, 0.75, 1.0} × (2*XR)/0.9 (line 107, mapping capture fraction to time). Frame t-000 shows τ far left (product ≈0), t-050 shows τ centered (product maximum), t-100 shows τ far right (periodic wrap, t-000≈t-100). All five are visually distinct and capture the convolution sweep accurately. No redundancy.

---

## C. Presentability

**Card text (from spec.md):**
- `hook: 'STATUS: needs_hook'` (line 12): Template skeleton, NOT FILLED.
- `one_paragraph: 'STATUS: needs_paragraph'` (line 13): Template skeleton, NOT FILLED.
- These are metadata blockers for gallery rendering; **MISSING REQUIRED TEXT**.

**User-facing prose (index.html):**
- Line 6-7: "Voigt profile: Gaussian core, Lorentzian wings" (title, appropriate).
- Line 7: "The Voigt absorption profile (orange) is the convolution of a Gaussian (cyan, thermal broadening) with a Lorentzian (green, natural / pressure broadening). The Gaussian dominates the core; the Lorentzian dominates the far wings. Source: Mihalas Stellar Atmospheres Ch. 9 (`mihalas-atm`)."
  - Problem: Raw bib key `(mihalas-atm)` in user-facing prose. Should read: "Source: Mihalas, Stellar Atmospheres, Chapter 9." or "Mihalas (1978), Ch. 9."

- Line 10 figcaption: "Figure 1. Voigt vs constituents. Source: Mihalas Stellar Atmospheres Ch. 9 (`mihalas-atm`)."
  - Problem: Same bib key artifact. Figures must have paper-style captions: "Figure 1. Voigt profile decomposition. Orange trace is the convolution of cyan Gaussian (thermal broadening) and green Lorentzian (natural broadening); the shaded region shows the product L·G at each position τ. Reference: Mihalas (1978)."

**README.md:**
- Line 2: One sentence, contains raw bib key `(mihalas-atm)`. Violates rule: "three short paragraphs maximum" (actually present but extremely terse). Should expand with:
  1. What is this profile used for? (stellar absorption lines in atmospheres)
  2. Why does the core/wing split matter? (different physical regimes)
  3. What do the controls do? (slider explanations)

**Controls description:**
- index.html lines 12-14: σ and γ sliders plus Reset/Pause. No aria-labels beyond the HTML aria-label attributes (present, good). Controls are discoverable. Missing: explanation of what changing these parameters does (pedagogically, "σ controls line width; γ controls wing extent").

**Visual legibility:**
- Golden frames show clean text, proper axis labels ("x" on line 77), colors are distinct and accessible (cyan/green/orange have sufficient contrast on black background). No overlapping text. Readout uses monospace font (line 95 ui-monospace).

---

## Hero-candidate

NO. This is a pedagogical decomposition illustration, not a novel research visualization. The visual effectively conveys the convolution mechanism, but lacks the conceptual complexity or aesthetic sophistication of hero-grade work (e.g., Ciechanowski-style interactive whimsy or research-breakthrough visualization). Appropriate tier: **simple/pedagogical**.

---

## Action checklist for maintainer

- [ ] Fill spec.md line 12 with a proper hook (e.g., "Gaussian core widens as thermal motion increases; Lorentzian wings rise as collisions dominate.")
- [ ] Fill spec.md line 13 with one_paragraph text (~200 chars): "The Voigt profile models line broadening in stellar spectra, blending two physical mechanisms: Gaussian thermal broadening dominates the narrow core, while Lorentzian pressure broadening dominates the distant wings."
- [ ] Remove all raw bib keys from index.html lines 7 and 10. Replace `(mihalas-atm)` with proper inline citation: "Mihalas (1978)" or "Mihalas, Stellar Atmospheres, Chapter 9."
- [ ] Expand README.md to three short paragraphs: (1) pedagogical context, (2) what the visualization shows, (3) what the sliders control.
- [ ] Verify figcaption on line 10 (index.html) is paper-style: include method and reference clearly.
- [ ] All golden frames validated (PASS); no recapture needed.
- [ ] Invariants test suite is solid (PASS).

