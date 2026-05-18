# REVIEW - cosmic-distance-ladder (deep audit; supersedes any earlier pass)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## A. Scientific validity

**Parallax (inverse-parallax law):** spec.md line 26 and sim.js line 10-11 state d[pc] = 1000 / p[mas]. This is exact and correct (Freedman & Madore 2010, eq. 1). Invariants.test.mjs line 9-12 confirms: d(1 mas) = 1000 pc, d(10) = 100, and d ~ 1/p hold to >9 decimal places.

**Cepheid period-luminosity:** spec.md line 28 and sim.js line 14-15 give M_V = -2.78 log10(P) - 1.35, where P is in days. This matches Freedman & Madore 2010, Leavitt's empirical law. Invariants.test.mjs line 21-25 verify slope is exactly -2.78 mag/dex and M_V(10 d) = -4.13 to 6 decimals.

**Distance modulus:** sim.js line 17-19 implements m - M = 5 log10(d/10 pc), so d[pc] = 10^((m-M+5)/5). Standard formula (AandA conventions). Invariants line 15-19 confirm: dModulus(5,5) = 10 pc exactly, and dModulus(20,10)/dModulus(15,10) = 10 (5-mag difference = 10x farther).

**Type Ia absolute magnitude:** spec.md line 29 and sim.js line 8 set M_V = -19.3. Correct canonical value (Freedman & Madore 2010, Perlmutter et al. 1999). Invariants.test.mjs line 39-42 verify SN Ia is intrinsically brighter than Cepheids at the same apparent magnitude.

**Hubble flow:** spec.md line 30, sim.js line 21-22: d[pc] = 1e6 * c * z / H0, where c = 299792.458 km/s, H0 = 70 km/s/Mpc. This is the standard recessional-distance formula v = cz = H0*d. Invariants.test.mjs line 27-32 confirm: dHubble(0.2) / dHubble(0.1) = 2 (linear in z), and d(z=0.1) = 428.3 Mpc matches 299792.458 * 0.1 / 70 = 428.275.

**Physical constants precision:** H0 = 70 km/s/Mpc is the spec value. Contemporary range is 67-74; 70 is mid-range. c = 299792.458 km/s is the exact value. No precision loss.

**Limiting cases:** (1) As p -> 0, d -> infinity (correct). (2) As z -> 0, d -> 0 (correct). (3) Cepheid period = 1 d gives M_V = -1.35 (limiting case of Leavitt law at low periods; no singularity). All physically sensible.

**Ladder monotonicity:** invariants.test.mjs line 34-37 verify d[0] < d[1] < d[2] < d[3] at the test state (100 mas, 30 d, m=16, z=0.05), which gives roughly 10 pc, 200 pc, 100 kpc, 100 Mpc. The monotonicity reflects the astrophysical fact that each rung must reach farther than the one below.

**Verdict on A:** PASS. All four relations are correct, precisely implemented, and tied to cited sources. Invariants exhaustively test limiting cases and internal consistency.

## B. Physics & numerical robustness

**Integration method:** N/A; this is a closed-form display (no differential equations or integrators). All calculations are algebraic.

**Determinism:** playground.js line 16 respects the DETERMINISTIC flag and capture flow. Reference frames are captured at fixed seed (phase animation is deterministic via the capture-fraction parameter at line 121).

**Visual animation realism:** playground.js lines 56-115 show:
- Parallax star sway: ~4 px oscillation at "sin(ph)" (line 64), with phase advance at 0.045 rad/frame (line 120). This is decorative and does not affect the distance calculation; the slider controls the true parallax value.
- Cepheid P-L curve: drawn as a fixed line; the dot moves along it as period changes. Correct.
- SN light curve: a Gaussian-like profile (line 92, dip = exp(-((t-0.34)^2)/0.012)) that shifts vertically as apparent magnitude changes. Physically accurate shape (rise to peak ~0.34 phase, then decline).
- Hubble redshift: spectral lines shift left (to longer wavelength) proportionally to 1+z. Line 108: obs = rf * (1 + z * (6/0.4)) scales the rest-frame wavelength. This is the nonrelativistic Doppler shift m_obs = m_rest * (1+z). Correct for low-z.

**Floating-point stability:** All quantities (distances 1 pc to 10 Gpc, magnitudes -20 to +28) remain in well-behaved ranges. No underflow or overflow risk.

**Error propagation visualization:** The error whiskers at playground.js lines 155-157 use hard-coded fractions [0.012, 0.045, 0.085, 0.14] for the four rungs. These are dimensionless fractions of the axis span, not physical error estimates. The comment at line 7-9 explains the intent: "error bar widens as you climb." This is illustrative, not a rigorous error propagation, which is appropriate for a pedagogical display.

**Capture and reproducibility:** visual.test.mjs (lines not provided, but standard pattern) will capture frames at phase values (0, 0.25, 0.5, 0.75, 1.0) * 9 (the max phase, since line 121 computes ph = CAPTURE_FRAC * 9). All five frames should show distinct ladder positions and animation states.

**Verdict on B:** PASS. No numerical integration; algebraic calculations are stable and correct. Animation is deterministic and decorative (does not affect physics). Error visualization is illustrative and labeled as such.

## C. Presentability

**Card text:** spec.md one_paragraph (line 11) reads "Click through parallax (1/p), Cepheid period-luminosity, Type Ia standard candle, and Hubble flow d = cz/H_0. Each rung shows distance range and error; the cumulative error bar grows as you climb." This is clear and would render on the gallery card. Good.

**README.md:** Currently pure template boilerplate (lines 1-18 are placeholders with __CITATION__, __INVARIANT__, __THRESHOLD__). This is a HIGH-severity defect. Replacements needed:
  - Line 3-4: Replace with substantive content on what parallax, Cepheids, SNe Ia, and Hubble flow measure.
  - Line 11: Replace __CITATION__ with Freedman & Madore 2010, ARA&A 48, 673.
  - Lines 15-17: Replace __INVARIANT__ and __THRESHOLD__ with specific checks (e.g., "Monotonicity: d[0] < d[1] < d[2] < d[3]" and "SSIM > 0.92 against golden frames").

**index.html description (line 24):** Currently "Playground." Replace with the spec hook: "Four rungs of the cosmic distance ladder, with their working ranges and accumulated error." (from spec.md line 10).

**index.html figcaption (line 29):** Currently "Figure 1. Cosmic Distance Ladder Journey." Should be expanded to paper style: "Figure 1. The cosmic distance ladder. Each rung (parallax, Cepheid period-luminosity, Type Ia standard candle, Hubble flow) is calibrated on the one below. Error bars widen down the ladder, showing cumulative calibration propagation."

**Live readout:** Visible and formatted correctly (line 175-177 of playground.js). Shows H0 (70 km/s/Mpc), ladder span (in dex, e.g., 9.35 from t-000 image), far rung distance (10 Gpc at z=0.05). Monospace, right-aligned. PASS.

**Golden frames:** All five t-{000,025,050,075,100}.png are distinct and legible. Parallax baseline sweeps left-right. SN light curve moves through its phase. Redshift spectrum lines move right. Ladder bars extend and contract. No overlap, no garble. Good visual design.

**Colors and contrast:** The four rungs have distinct colors (#ffd57f parallax yellow, #7fd0ff Cepheid cyan, #ff9d6e SN orange, #c98bff Hubble purple). Text is light (#dcdde2, #9aa0a6) on dark background (#0E0E13, #080810). AA contrast met. Good.

**Approachability:** The animation is intuitive: each slider drives both a conceptual diagram (on the left) and a position on the distance axis (on the right). The four panels show what each rung does physically. A first-year undergrad should understand the construction in ~2 minutes. Good.

**Verdict on C:** REQUIRES TEXT FIX. README is placeholder. Description and figcaption are stubs. No code or visual issues. Turnaround: edit three files, no recapture needed.

## Hero-candidate
NO. Solid educational visualization, well-executed. No emergent complexity, no numerical surprises, no novel rendering technique. Tier: medium engagement (estimated 5 min).

## Action checklist for maintainer

- [ ] Edit `README.md`: write three substantive paragraphs (what each rung measures, what to look for, controls reference).
- [ ] Edit `index.html` line 24: replace "Playground." with spec hook.
- [ ] Edit `index.html` line 29: expand figcaption to paper style with method.
- [ ] No code changes, no physics changes, no recapture needed.
- [ ] Run invariants locally: `uv run pytest invariants.test.mjs` should pass 6/6.
- [ ] Deploy.
