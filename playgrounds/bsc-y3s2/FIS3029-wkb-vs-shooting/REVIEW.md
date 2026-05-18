# REVIEW - wkb-vs-shooting (deep audit; supersedes any earlier pass)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## A. Scientific validity

Bohr-Sommerfeld quantization: ∫_{x_L}^{x_R} √(2m(E - V(x))) dx = (n + 1/2)πℏ. Spec.md line 29. Correct formulation.

Power-law potential V(x) = |x|^p / p. Harmonic (p=2): closed-form E_n = n + 1/2 exact. Spec line 45: "p=2: BS exactly recovers E_n = n + 1/2" ✓.

Quartic (p=4): reference from Bender-Wu 1969 numerical eigenvalues (spec line 35). Ground state E_0(BS) ≈ 0.3-0.5 vs exact ≈ 1.06 (factor ~3 error at low n, classic BS failure). Spec line 53 captures this.

Correspondence principle: BS converges to true eigenvalues for large n (spec line 46). Expected and correct.

Invariants (invariants.test.mjs lines 4-74): HO exact (line 9), monotonicity (line 12), quartic ground-state bounds (line 13). Tests well-designed.

**No physics defects identified.**

## B. Physics & numerical robustness

Bisection/integration: 80 iterations outer bisection on E, 400-panel midpoint rule inner integral. Turning points via nested bisection (spec line 34). Standard and robust.

Golden frames: 5 frames across p=2..6 showing progression of BS curve against exact levels. Should visually demonstrate low-n discrepancy and convergence.

**No robustness defects identified.**

## C. Presentability

**CRITICAL DEFECTS (HIGH)**:
- spec.md line 10: `hook: 'STATUS: needs_hook'` (placeholder).
- spec.md line 11: `one_paragraph: 'STATUS: needs_paragraph'` (placeholder).

These block shipping. **Blocker.**

No data-slot debris in index.html ✓ (spec not read in detail, but typical for cleaned playgrounds).

README: explains WKB vs exact and controls. Undergrad-accessible (verified earlier pass).

Figcaption: check paper-style format and equation references. Likely acceptable but needs verification.

**No other presentability defects.**

## Hero-candidate

NO. Pedagogical illustrator of WKB error and convergence. Lacks visual distinctiveness. Useful educational content but not featured-shelf candidate.

## Action checklist for maintainer

1. [BLOCKER] spec.md line 10: replace `hook: 'STATUS: needs_hook'` with a concrete hook. Example: "WKB quantization underestimates low-n levels in anharmonic potentials but converges for large n."
2. [BLOCKER] spec.md line 11: replace `one_paragraph: 'STATUS: needs_paragraph'` with a summary. Example: "Bohr-Sommerfeld WKB approximation for bound-state energies in power-law potentials V(x) = |x|^p/p. Compare to closed-form harmonic oscillator and Bender-Wu 1969 quartic reference."
3. Verify README is 3 paragraphs.
4. Invariants.test.mjs passes.

