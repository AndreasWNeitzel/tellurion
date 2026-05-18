# REVIEW - semi-empirical-mass-formula (deep audit; supersedes any earlier pass)

## Verdict
RENDER-NEUTRAL TEXT FIX ONLY

## A. Scientific validity

Semi-empirical mass formula (SEMF): B(Z,A) = a_v A - a_s A^{2/3} - a_c Z(Z-1)/A^{1/3} - a_a (A-2Z)²/A ± δ(Z,A), sum of volume, surface, Coulomb, asymmetry, pairing terms.

**No physics defects identified.**

## B. Physics & numerical robustness

Standard SEMF with tabulated Krane coefficients. Deterministic.

**No robustness defects identified.**

## C. Presentability

**CRITICAL DEFECTS**:
- spec.md placeholder hook/one_paragraph.
- Verify README is 3 paragraphs.

## Hero-candidate

NO.

## Action checklist

1. [BLOCKER] Fill spec.md hook and one_paragraph.
2. Verify README is 3 paragraphs.
3. Invariants.test.mjs passes.

