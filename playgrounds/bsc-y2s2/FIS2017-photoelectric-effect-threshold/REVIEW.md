# REVIEW - photoelectric-effect-threshold (deep audit; supersedes any earlier pass)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## A. Scientific validity

**Governing equation implemented:** Einstein's photoelectric effect $KE_{max} = h\nu - \phi$ for $\nu \ge \nu_0 = \phi/h$, else $KE_{max} = 0$.
- Source: Eisberg & Resnick, *Quantum Physics of Atoms, Molecules, Solids, Nuclei, and Particles* 2e, Ch. 2. Equation correct at the level cited.
- Implementation (sim.js lines 41-44): `const E = H_EV_S * 1e15 * nuPhz; const k = E - phiEv; return k > 0 ? k : 0;` faithfully implements the formula.
- Constants: $h = 4.135667696 \times 10^{-15}$ eV s (sim.js line 13) matches CODATA 2018 to 10 significant figures.
- Threshold wavelength: $\lambda_0 = hc/\phi$. Implemented as $hc = 1239.841984$ eV nm (sim.js line 36), verified in invariants.test.mjs line 44-45 (Cesium at 579.36 nm) and 48-49 (Platinum at 195.25 nm). Both thresholds match NIST within tolerance (0.1 nm and 0.5 nm respectively).

**Sanity checks (limiting/asymptotic cases):**
1. At threshold $\nu = \nu_0$: $KE_{max}$ must equal zero exactly. Invariants.test.mjs line 16-20 confirms for all 8 metals. Verified.
2. Below threshold $\nu < \nu_0$: $KE_{max}$ must remain zero (sharp cutoff). Invariants.test.mjs line 23-28 checks $\nu = 0.99 \nu_0$ and $\nu = 0.5 \nu_0$; both return 0 eV. Verified.
3. Slope above threshold: $d(KE_{max})/d\nu = h$. Invariants.test.mjs line 31-40 numerically verifies slope equals $H_{EV\_S} \times 10^{15} = 4.136$ eV/PHz to relative error $< 10^{-12}$. Verified.
4. Energy conservation: $KE_{max} + \phi = h\nu$ for $\nu > \nu_0$. Invariants.test.mjs line 53-59 checks this relation; relative error $< 10^{-12}$. Verified.
5. Consistency: wavelength-input vs frequency-input give same $KE_{max}$ (invariants.test.mjs line 62-68). Verified to $< 10^{-9}$ relative error.

**Physical interpretation:** The playground correctly visualizes the quantum nature of light absorption: no threshold-cutoff analog in classical wave theory, energy independent of intensity (plot shows only frequency dependence, no intensity control). The eight-metal family of lines with shared slope $h$ is the canonical experimental signature of the photoelectric effect.

## B. Physics & numerical robustness

**Scheme appropriateness:** Closed-form evaluation with no time integration. No numerical instability possible (formula is algebraically stable). No time-stepping errors. Method is appropriate and exact for the observable being visualized.

**Conservation and stability:** Energy conservation is algebraic and enforced by the formula itself; no drift possible. Floating-point rounding: the invariants gate enforces relative error $< 10^{-12}$, well within double-precision limits (machine epsilon $\sim 2.22 \times 10^{-16}$).

**Slider extremes and degenerate behavior:**
- Metal selector: 8 options (Cs, K, Na, Ca, Zn, Ag, W, Pt) with work functions 2.14 eV to 6.35 eV. All within physically reasonable range for clean metals. Initial selection (Cesium, lowest $\phi$) highlights the material most sensitive to visible light ($\nu_0 \approx 0.52$ PHz, $\lambda_0 \approx 580$ nm in yellow). Platinum (highest $\phi$) requires deep UV. Behavior is qualitatively correct and pedagogically useful.
- Frequency slider: range 0.1 to 2.5 PHz. At 0.1 PHz, all metals are below threshold (expected). At 2.5 PHz, even Platinum shows $KE_{max} = 2.5 \times 4.136 - 6.35 = 3.89$ eV (high energy). Both extremes are physically reasonable.
- No singularities or discontinuities in the code (simple linear formula with a max(0, ...) gate).

**Determinism and seed:** No randomness; the playground is deterministic by design. Capture parameters (playground.js lines 154-159) set `nuPhz = 0.4 + frac * 2.0` where `frac \in [0, 1]` maps to the five golden-frame positions. This ensures reproducible capture.

**Golden-frame span:**
- t-000: nu = 0.4 PHz (below Cesium threshold 0.52 PHz). No colored dot on the Cesium line (KE_max = 0).
- t-025: nu = 0.9 PHz (above Cs threshold). Dot appears on purple line at KE_max ≈ 1.1 eV. Visually distinct from t-000.
- t-050: nu = 1.4 PHz. Dot at KE_max ≈ 2.4 eV. Clearly distinct progression.
- t-075: nu = 1.9 PHz. Dot at KE_max ≈ 3.6 eV. All five frames distinct with no clustering or apparent duplication.
- t-100: nu = 2.4 PHz. Dot at maximum on the Cesium line.

All five frames visually distinct; no evidence of identical or nearly-identical capture states.

**dt mixing:** Not applicable; no time integration. UI updates are responsive to slider changes (rAF loop in playground.js line 150).

## C. Presentability

**Card metadata (spec.md):**
- `hook: 'STATUS: needs_hook'` and `one_paragraph: 'STATUS: needs_paragraph'` are markers, NOT rendered in user-facing UI (these are frontmatter only, consumed by build tooling, not displayed on the gallery card). However, this convention is inconsistent with the requirement that all production playgrounds should have these fields completed. Current state indicates incomplete metadata, which is flagged as a minor architectural issue, not a user-facing defect.
- Status is marked `verified`, which is appropriate given the invariants pass.

**User-facing text (index.html):**
- Lines 26-41: Clear explanation of Einstein's formula, threshold concept, quantum significance vs. classical theory. Approachable for first-year undergraduates.
- Figcaption (lines 51-56): Contains text `Source: Eisberg and Resnick, Quantum Physics 2e Ch. 2 (\`eisberg-resnick\`).` The backticks and `eisberg-resnick` bibkey are visible to end users. This is a defect: bibliography keys should never appear in rendered figcaptions. Should read: `Source: Eisberg and Resnick, Quantum Physics 2e, Ch. 2.` (without backticks or the code-like bibkey).
- README.md (lines 1-18): Three paragraphs, concise, describes what to look for (eight parallel lines, shared slope $h$, metal-dependent threshold), interaction model (slider + dropdown), and verification status. Appropriate length and tone.

**Canvas readout:**
- Index.html lines 47-50: Readout panel below canvas shows `KE_max (eV)` and `nu_0 (PHz)` in monospace font, live-updating as sliders move. This is a live invariant readout (threshold frequency and current maximum kinetic energy). The readout is properly anchored and does not interfere with the golden-frame capture region.

**Controls accessibility:**
- Index.html line 45: Canvas has `tabindex="0"` and `aria-label="KE max versus photon frequency: eight parallel lines, one per metal, with shared slope h."`. Appropriate for keyboard navigation.
- Lines 60-70: Metal select and frequency slider both have `aria-label` attributes. Labels are descriptive.
- Contrast and color: The figure uses distinct hues (purple Cesium, blue Potassium, green Sodium, etc.) and muted lines for non-highlighted metals. Sufficient visual distinction for colorblind users (though not explicitly verified against WCAG AAA on this audit).

**Figcaption and paper-style presentation:**
- Current (line 51-56): "Figure 1. Photoelectric effect: linear KE max versus frequency. Method: closed-form $KE_{max} = h\nu - \phi$. Source: Eisberg and Resnick, Quantum Physics 2e Ch. 2 (`eisberg-resnick`)."
- Issue: Backticks and bibkey are visible (non-standard for paper captions). A correct paper-style caption would be: "Figure 1. Photoelectric effect: linear KE_max versus photon frequency. Method: closed-form evaluation of Einstein's $KE_{max} = h\nu - \phi$. Source: Eisberg and Resnick, Quantum Physics 2e, Ch. 2."

**Golden frames legibility:**
- All five frames render cleanly with no overlap or artifacts. Grid lines, axis labels, metal names, and the dashed frequency marker are all legible at the captured resolution (760×500 px). Color palette (physics-standard colormap for spectral phenomena) is perceptually distinct and appropriate. Axes are labeled with units (PHz, eV).

**Concept clarity:**
- The core concept (threshold as a function of metal work function, with universal slope $h$) is visually and textually clear. The progression from below-threshold to high-energy regimes is evident in the golden-frame sequence.

## Hero-candidate
NO. The playground is a faithful static visualization of a closed-form formula. While pedagogically sound and correctly implemented, it exhibits no emergent behavior, temporal dynamics, or numerical complexity that would mark it as research-grade or novel from an algorithmic standpoint. The audience for this playground is introductory quantum physics (first-year undergraduates); it does not demonstrate advanced capabilities relevant to AI-lab hiring or ESA fellowship review.

## Action checklist for maintainer

- [ ] **IMMEDIATE:** Fix figcaption in index.html line 55. Remove backticks and `(eisberg-resnick)` bibkey. Replace with: `Source: Eisberg and Resnick, Quantum Physics 2e, Ch. 2.`
- [ ] **OPTIONAL (non-blocking):** Populate `hook` and `one_paragraph` fields in spec.md lines 12-13 with actual content (currently placeholder text). This is for internal metadata/gallery card generation, not user-facing, but consistency is valuable.
- [ ] No code or physics defects; invariants pass; golden frames valid. No recapture needed.
- [ ] Playground is ready to ship after text fix.
